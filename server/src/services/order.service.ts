import { OrderStatus, PaymentStatus, Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const detailInclude = { items: { include: { review: { select: { id: true } } } } } satisfies Prisma.OrderInclude
type DetailedOrder = Prisma.OrderGetPayload<{ include: typeof detailInclude }>
const serialize = (order: DetailedOrder) => ({
  ...order,
  totalAmount: Number(order.totalAmount), shippingFee: Number(order.shippingFee), payableAmount: Number(order.payableAmount),
  items: order.items.map((item) => ({ ...item, price: Number(item.price), subtotal: Number(item.subtotal) })),
})
const orderNumber = () => `M${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`

async function ownedOrder(userId: number, id: number) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: detailInclude })
  if (!order) throw new AppError(404, '订单不存在')
  return order
}

export const orderService = {
  async create(userId: number, input: { addressId: number; cartItemIds: number[]; remark?: string }) {
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId } })
    if (!address) throw new AppError(404, '收货地址不存在')
    const cartItems = await prisma.cartItem.findMany({
      where: { id: { in: input.cartItemIds }, userId },
      include: { product: true, sku: true },
    })
    if (cartItems.length !== input.cartItemIds.length) throw new AppError(422, '部分购物车商品已失效，请刷新后重试')
    for (const item of cartItems) {
      if (item.product.status !== ProductStatus.ACTIVE || item.sku.productId !== item.productId) throw new AppError(422, `${item.product.name} 已下架`)
      if (item.sku.stock < item.quantity) throw new AppError(422, `${item.product.name} 库存不足，仅剩 ${item.sku.stock} 件`)
    }
    const total = cartItems.reduce((sum, item) => sum + Number(item.sku.price) * item.quantity, 0)
    const shipping = total >= 199 ? 0 : 12
    const order = await prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        const changed = await tx.productSku.updateMany({ where: { id: item.skuId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
        if (changed.count !== 1) throw new AppError(422, `${item.product.name} 库存刚刚发生变化，请重新确认`)
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } } })
      }
      const created = await tx.order.create({
        data: {
          orderNo: orderNumber(), userId, totalAmount: total, shippingFee: shipping, payableAmount: total + shipping,
          receiver: address.receiver, phone: address.phone, province: address.province, city: address.city,
          district: address.district, addressDetail: address.detail, postalCode: address.postalCode, remark: input.remark || null,
          items: { create: cartItems.map((item) => ({
            productId: item.productId, skuId: item.skuId, productName: item.product.name, skuName: item.sku.name,
            specs: item.sku.specs as Prisma.InputJsonValue, image: item.product.cover, price: item.sku.price,
            quantity: item.quantity, subtotal: Number(item.sku.price) * item.quantity,
          })) },
        }, include: detailInclude,
      })
      await tx.cartItem.deleteMany({ where: { userId, id: { in: input.cartItemIds } } })
      return created
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    return serialize(order)
  },

  async list(userId: number, query: { page: number; pageSize: number; status?: OrderStatus }) {
    const where: Prisma.OrderWhereInput = { userId, ...(query.status ? { status: query.status } : {}) }
    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, include: detailInclude, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    ])
    return { items: orders.map(serialize), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } }
  },
  async detail(userId: number, id: number) { return serialize(await ownedOrder(userId, id)) },
  async pay(userId: number, id: number) {
    const order = await ownedOrder(userId, id)
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new AppError(422, '当前订单无法支付')
    const updated = await prisma.order.update({ where: { id }, data: { status: OrderStatus.PENDING_SHIPMENT, paymentStatus: PaymentStatus.PAID, paidAt: new Date() }, include: detailInclude })
    return serialize(updated)
  },
  async cancel(userId: number, id: number) {
    const order = await ownedOrder(userId, id)
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new AppError(422, '仅待付款订单可以直接取消')
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.skuId) await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } })
        if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } } })
      }
      return tx.order.update({ where: { id }, data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() }, include: detailInclude })
    })
    return serialize(updated)
  },
  async confirmReceipt(userId: number, id: number) {
    const order = await ownedOrder(userId, id)
    if (order.status !== OrderStatus.SHIPPED) throw new AppError(422, '订单尚未发货，无法确认收货')
    const updated = await prisma.order.update({ where: { id }, data: { status: OrderStatus.COMPLETED, completedAt: new Date() }, include: detailInclude })
    return serialize(updated)
  },
}
