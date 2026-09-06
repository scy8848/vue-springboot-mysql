import type { RequestHandler } from 'express'
import { AppError } from '../lib/AppError.js'
import { success } from '../lib/response.js'
import { reviewService } from '../services/review.service.js'

const productId = (raw: string | string[] | undefined) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, '商品 ID 不正确')
  return id
}
export const create: RequestHandler = async (req, res) => success(res, await reviewService.create(req.userId!, req.body), '评价发布成功', 201)
export const list: RequestHandler = async (req, res) => success(res, await reviewService.list(productId(req.params.id), req.query as unknown as { page: number; pageSize: number }))
