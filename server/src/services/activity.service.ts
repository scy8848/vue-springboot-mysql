import { ProductStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const productInclude = { category: { select: { id: true, name: true } } } as const
const serializeProduct = <T extends { price: unknown; originalPrice: unknown }>(product: T) => ({ ...product, price: Number(product.price), originalPrice: product.originalPrice === null ? null : Number(product.originalPrice) })

async function activeProduct(productId: number) {
  const product = await prisma.product.findFirst({ where: { id: productId, status: ProductStatus.ACTIVE }, select: { id: true } })
  if (!product) throw new AppError(404, '商品不存在或已下架')
}

export const activityService = {
  async favorites(userId: number) {
    const rows = await prisma.favorite.findMany({ where: { userId, product: { status: ProductStatus.ACTIVE } }, include: { product: { include: productInclude } }, orderBy: { createdAt: 'desc' } })
    return rows.map((row) => ({ id: row.id, createdAt: row.createdAt, product: serializeProduct(row.product) }))
  },
  async favoriteStatus(userId: number, productId: number) { return { favorited: Boolean(await prisma.favorite.findUnique({ where: { userId_productId: { userId, productId } } })) } },
  async addFavorite(userId: number, productId: number) {
    await activeProduct(productId)
    return prisma.favorite.upsert({ where: { userId_productId: { userId, productId } }, create: { userId, productId }, update: {} })
  },
  async removeFavorite(userId: number, productId: number) { await prisma.favorite.deleteMany({ where: { userId, productId } }) },
  async histories(userId: number) {
    const rows = await prisma.browsingHistory.findMany({ where: { userId, product: { status: ProductStatus.ACTIVE } }, include: { product: { include: productInclude } }, orderBy: { viewedAt: 'desc' }, take: 50 })
    return rows.map((row) => ({ id: row.id, viewedAt: row.viewedAt, product: serializeProduct(row.product) }))
  },
  async recordHistory(userId: number, productId: number) {
    await activeProduct(productId)
    await prisma.browsingHistory.upsert({ where: { userId_productId: { userId, productId } }, create: { userId, productId }, update: { viewedAt: new Date() } })
    const overflow = await prisma.browsingHistory.findMany({ where: { userId }, orderBy: { viewedAt: 'desc' }, skip: 50, select: { id: true } })
    if (overflow.length) await prisma.browsingHistory.deleteMany({ where: { id: { in: overflow.map((item) => item.id) } } })
  },
  async clearHistory(userId: number) { await prisma.browsingHistory.deleteMany({ where: { userId } }) },
  async removeHistory(userId: number, productId: number) { await prisma.browsingHistory.deleteMany({ where: { userId, productId } }) },
}
