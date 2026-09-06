import type { RequestHandler } from 'express'
import { success } from '../lib/response.js'
import { AppError } from '../lib/AppError.js'
import { productService, type ProductQuery } from '../services/product.service.js'

export const categories: RequestHandler = async (_req, res) => success(res, await productService.categories())
export const list: RequestHandler = async (req, res) => success(res, await productService.list(req.query as unknown as ProductQuery))
export const detail: RequestHandler = async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, '商品 ID 不正确')
  return success(res, await productService.detail(id))
}
