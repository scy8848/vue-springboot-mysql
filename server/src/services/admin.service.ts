import { OrderStatus, PaymentStatus, Prisma, ProductStatus, UserStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

type PageQuery = { page: number; pageSize: number; keyword?: string; status?: string }
type ProductInput = {
  categoryId: number; name: string; subtitle?: string | null; description: string; cover: string
  price: number; originalPrice?: number | null; status: ProductStatus
  skus: Array<{ id?: number; skuCode: string; name: string; specs: Record<string, string>; price: number; stock: number }>
}

const pagination = (query: PageQuery, total: number) => ({ page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) })
const serializeProduct = <T extends { price: Prisma.Decimal; originalPrice: Prisma.Decimal | null; skus: Array<{ price: Prisma.Decimal }> }>(item: T) => ({
  ...item, price: Number(item.price), originalPrice: item.originalPrice === null ? null : Number(item.originalPrice),
  skus: item.skus.map((sku) => ({ ...sku, price: Number(sku.price) })),
})
const serializeOrder = <T extends { totalAmount: Prisma.Decimal; shippingFee: Prisma.Decimal; payableAmount: Prisma.Decimal; items: Array<{ price: Prisma.Decimal; subtotal: Prisma.Decimal }> }>(item: T) => ({
  ...item, totalAmount: Number(item.totalAmount), shippingFee: Number(item.shippingFee), payableAmount: Number(item.payableAmount),
  items: item.items.map((line) => ({ ...line, price: Number(line.price), subtotal: Number(line.subtotal) })),
})

export const adminService = {
  async stats() {
    const [orders, paid, users, products, statusGroups] = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { payableAmount: true } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      prisma.order.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { status: true } }),
    ])
    const orderStatus = Object.fromEntries(Object.values(OrderStatus).map((status) => [status, 0]))
    statusGroups.forEach((row) => { orderStatus[row.status] = (row._count as { status: number }).status })
    return { orderCount: orders, salesAmount: Number(paid._sum.payableAmount || 0), userCount: users, activeProductCount: products, orderStatus }
  },

  async products(query: PageQuery & { categoryId?: number }) {
    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status as ProductStatus } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.keyword ? { OR: [{ name: { contains: query.keyword } }, { subtitle: { contains: query.keyword } }] } : {}),
    }
    const [total, items] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, include: { category: { select: { id: true, name: true } }, skus: { orderBy: { id: 'asc' } } }, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    ])
    return { items: items.map(serializeProduct), pagination: pagination(query, total) }
  },

  async createProduct(input: ProductInput) {
    const stock = input.skus.reduce((sum, sku) => sum + sku.stock, 0)
    const item = await prisma.product.create({
      data: {
        categoryId: input.categoryId, name: input.name, subtitle: input.subtitle || null, description: input.description,
        cover: input.cover, price: input.price, originalPrice: input.originalPrice ?? null, status: input.status, stock,
        skus: { create: input.skus.map(({ id: _id, ...sku }) => ({ ...sku, specs: sku.specs as Prisma.InputJsonValue })) },
        images: { create: [{ url: input.cover, alt: input.name, sort: 0 }] },
      }, include: { category: { select: { id: true, name: true } }, skus: true },
    })
    return serializeProduct(item)
  },

  async updateProduct(id: number, input: ProductInput) {
    const current = await prisma.product.findUnique({ where: { id }, include: { skus: { select: { id: true } } } })
    if (!current) throw new AppError(404, '商品不存在')
    const ownedIds = new Set(current.skus.map((sku) => sku.id))
    if (input.skus.some((sku) => sku.id && !ownedIds.has(sku.id))) throw new AppError(422, 'SKU 不属于当前商品')
    const stock = input.skus.reduce((sum, sku) => sum + sku.stock, 0)
    return prisma.$transaction(async (tx) => {
      for (const sku of input.skus) {
        const data = { skuCode: sku.skuCode, name: sku.name, specs: sku.specs as Prisma.InputJsonValue, price: sku.price, stock: sku.stock }
        if (sku.id) await tx.productSku.update({ where: { id: sku.id }, data })
        else await tx.productSku.create({ data: { ...data, productId: id } })
      }
      const item = await tx.product.update({
        where: { id }, data: {
          categoryId: input.categoryId, name: input.name, subtitle: input.subtitle || null, description: input.description,
          cover: input.cover, price: input.price, originalPrice: input.originalPrice ?? null, status: input.status, stock,
        }, include: { category: { select: { id: true, name: true } }, skus: { orderBy: { id: 'asc' } } },
      })
      return serializeProduct(item)
    })
  },

  async setProductStatus(id: number, status: ProductStatus) {
    try { return await prisma.product.update({ where: { id }, data: { status } }) }
    catch { throw new AppError(404, '商品不存在') }
  },

  async orders(query: PageQuery) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status as OrderStatus } : {}),
      ...(query.keyword ? { OR: [{ orderNo: { contains: query.keyword } }, { receiver: { contains: query.keyword } }, { user: { email: { contains: query.keyword } } }] } : {}),
    }
    const [total, items] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, include: { user: { select: { id: true, email: true, nickname: true } }, items: true }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    ])
    return { items: items.map(serializeOrder), pagination: pagination(query, total) }
  },

  async setOrderStatus(id: number, status: OrderStatus) {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) throw new AppError(404, '订单不存在')
    const allowed = (order.status === OrderStatus.PENDING_SHIPMENT && status === OrderStatus.SHIPPED)
      || (order.status === OrderStatus.SHIPPED && status === OrderStatus.COMPLETED)
      || (order.status === OrderStatus.PENDING_PAYMENT && status === OrderStatus.CANCELLED)
    if (!allowed) throw new AppError(422, '不允许执行此订单状态变更')
    return prisma.$transaction(async (tx) => {
      if (status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.skuId) await tx.productSku.update({ where: { id: item.skuId }, data: { stock: { increment: item.quantity } } })
          if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } } })
        }
      }
      const data: Prisma.OrderUpdateInput = { status }
      if (status === OrderStatus.SHIPPED) data.shippedAt = new Date()
      if (status === OrderStatus.COMPLETED) data.completedAt = new Date()
      if (status === OrderStatus.CANCELLED) data.cancelledAt = new Date()
      const updated = await tx.order.update({ where: { id }, data, include: { user: { select: { id: true, email: true, nickname: true } }, items: true } })
      return serializeOrder(updated)
    })
  },

  async users(query: PageQuery) {
    const where: Prisma.UserWhereInput = {
      role: 'USER',
      ...(query.status ? { status: query.status as UserStatus } : {}),
      ...(query.keyword ? { OR: [{ email: { contains: query.keyword } }, { nickname: { contains: query.keyword } }, { phone: { contains: query.keyword } }] } : {}),
    }
    const [total, items] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, select: { id: true, email: true, nickname: true, phone: true, avatar: true, role: true, status: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    ])
    return { items: items.map(({ _count, ...user }) => ({ ...user, orderCount: _count.orders })), pagination: pagination(query, total) }
  },

  async setUserStatus(id: number, status: UserStatus) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.role === 'ADMIN') throw new AppError(404, '普通用户不存在')
    const updated = await prisma.user.update({ where: { id }, data: { status }, select: { id: true, email: true, status: true } })
    return updated
  },
}
