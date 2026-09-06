import { OrderStatus, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

export const reviewService = {
  async create(userId: number, input: { orderItemId: number; rating: number; content: string; images: string[] }) {
    const item = await prisma.orderItem.findFirst({
      where: { id: input.orderItemId, order: { userId } },
      include: { order: { select: { status: true } }, review: { select: { id: true } } },
    })
    if (!item) throw new AppError(404, '订单商品不存在')
    if (item.order.status !== OrderStatus.COMPLETED) throw new AppError(422, '订单完成后才能评价')
    if (!item.productId) throw new AppError(422, '该商品已不存在，无法评价')
    if (item.review) throw new AppError(409, '该商品已经评价过了')
    return prisma.review.create({
      data: { userId, productId: item.productId, orderItemId: item.id, rating: input.rating, content: input.content, images: input.images },
    })
  },
  async list(productId: number, query: { page: number; pageSize: number }) {
    const where = { productId }
    const [total, aggregate, rowsfinder] = await prisma.$transaction([
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        include: { user: { select: { nickname: true, avatar: true } }, orderItem: { select: { skuName: true } } },
      }),
    ])
    return { items: rowsfinder, summary: { total, average: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0 }, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } }
  },
}
