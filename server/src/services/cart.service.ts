import { ProductStatus, type Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const include = {
  product: { select: { id: true, name: true, subtitle: true, cover: true, status: true } },
  sku: { select: { id: true, name: true, specs: true, price: true, stock: true } },
} satisfies Prisma.CartItemInclude

type CartRow = Prisma.CartItemGetPayload<{ include: typeof include }>
const serialize = (item: CartRow) => ({
  id: item.id, productId: item.productId, skuId: item.skuId, quantity: item.quantity,
  available: item.product.status === ProductStatus.ACTIVE && item.sku.stock > 0,
  product: item.product, sku: { ...item.sku, price: Number(item.sku.price) },
  subtotal: Number(item.sku.price) * item.quantity,
})

async function validSku(productId: number, skuId: number) {
  const sku = await prisma.productSku.findFirst({
    where: { id: skuId, productId, product: { status: ProductStatus.ACTIVE } },
    include: { product: { select: { id: true } } },
  })
  if (!sku) throw new AppError(404, '商品规格不存在或已下架')
  if (sku.stock < 1) throw new AppError(422, '该商品规格暂时缺货')
  return sku
}

async function ownedItem(userId: number, id: number) {
  const item = await prisma.cartItem.findFirst({ where: { id, userId }, include })
  if (!item) throw new AppError(404, '购物车商品不存在')
  return item
}

export const cartService = {
  async list(userId: number) {
    const rows = await prisma.cartItem.findMany({ where: { userId }, include, orderBy: { updatedAt: 'desc' } })
    return rows.map(serialize)
  },
  async add(userId: number, input: { productId: number; skuId: number; quantity: number }) {
    const sku = await validSku(input.productId, input.skuId)
    const existing = await prisma.cartItem.findUnique({ where: { userId_skuId: { userId, skuId: input.skuId } } })
    const quantity = Math.min((existing?.quantity || 0) + input.quantity, sku.stock, 99)
    const row = await prisma.cartItem.upsert({
      where: { userId_skuId: { userId, skuId: input.skuId } },
      create: { userId, productId: input.productId, skuId: input.skuId, quantity },
      update: { quantity }, include,
    })
    return serialize(row)
  },
  async update(userId: number, id: number, quantity: number) {
    const current = await ownedItem(userId, id)
    if (current.product.status !== ProductStatus.ACTIVE || current.sku.stock < 1) throw new AppError(422, '商品已下架或缺货')
    const row = await prisma.cartItem.update({ where: { id }, data: { quantity: Math.min(quantity, current.sku.stock) }, include })
    return serialize(row)
  },
  async remove(userId: number, id: number) {
    await ownedItem(userId, id)
    await prisma.cartItem.delete({ where: { id } })
  },
  async clear(userId: number) { await prisma.cartItem.deleteMany({ where: { userId } }) },
  async sync(userId: number, items: Array<{ productId: number; skuId: number; quantity: number }>) {
    for (const item of items) {
      try { await this.add(userId, item) } catch (error) {
        if (!(error instanceof AppError) || error.statusCode >= 500) throw error
      }
    }
    return this.list(userId)
  },
}
