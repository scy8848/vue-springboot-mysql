import { Prisma, ProductStatus } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

export interface ProductQuery {
  page: number
  pageSize: number
  keyword?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  sort: 'default' | 'price_asc' | 'price_desc' | 'sales'
}

const money = (value: Prisma.Decimal | null) => value === null ? null : Number(value)

export const productService = {
  async categories() {
    return prisma.category.findMany({
      where: { parentId: null }, orderBy: { sort: 'asc' },
      include: { children: { orderBy: { sort: 'asc' } } },
    })
  },

  async list(query: ProductQuery) {
    const categoryIds: number[] | undefined = query.categoryId
      ? [query.categoryId, ...(await prisma.category.findMany({ where: { parentId: query.categoryId }, select: { id: true } })).map((item) => item.id)]
      : undefined
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
      ...(query.keyword ? { OR: [{ name: { contains: query.keyword } }, { subtitle: { contains: query.keyword } }, { description: { contains: query.keyword } }] } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined ? { price: { gte: query.minPrice, lte: query.maxPrice } } : {}),
    }
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = query.sort === 'price_asc' ? [{ price: 'asc' }]
      : query.sort === 'price_desc' ? [{ price: 'desc' }]
      : query.sort === 'sales' ? [{ salesCount: 'desc' }]
      : [{ salesCount: 'desc' }, { createdAt: 'desc' }]
    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy, include: { category: { select: { id: true, name: true } } } }),
    ])
    return {
      items: rows.map((item) => ({ ...item, price: money(item.price), originalPrice: money(item.originalPrice) })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    }
  },

  async detail(id: number) {
    const item = await prisma.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      include: { category: { select: { id: true, name: true, parent: { select: { id: true, name: true } } } }, images: { orderBy: { sort: 'asc' } }, skus: { orderBy: { price: 'asc' } } },
    })
    if (!item) throw new AppError(404, '商品不存在或已下架')
    return { ...item, price: money(item.price), originalPrice: money(item.originalPrice), skus: item.skus.map((sku) => ({ ...sku, price: money(sku.price) })) }
  },
}
