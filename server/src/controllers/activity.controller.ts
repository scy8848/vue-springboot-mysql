import type { RequestHandler } from 'express'
import { AppError } from '../lib/AppError.js'
import { success } from '../lib/response.js'
import { activityService } from '../services/activity.service.js'

const productId = (raw: string | string[] | undefined) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, '商品 ID 不正确')
  return id
}
export const favorites: RequestHandler = async (req, res) => success(res, await activityService.favorites(req.userId!))
export const favoriteStatus: RequestHandler = async (req, res) => success(res, await activityService.favoriteStatus(req.userId!, productId(req.params.productId)))
export const addFavorite: RequestHandler = async (req, res) => success(res, await activityService.addFavorite(req.userId!, productId(req.params.productId)), '收藏成功', 201)
export const removeFavorite: RequestHandler = async (req, res) => { await activityService.removeFavorite(req.userId!, productId(req.params.productId)); success(res, null, '已取消收藏') }
export const histories: RequestHandler = async (req, res) => success(res, await activityService.histories(req.userId!))
export const recordHistory: RequestHandler = async (req, res) => { await activityService.recordHistory(req.userId!, productId(req.params.productId)); success(res, null, '浏览记录已更新') }
export const clearHistory: RequestHandler = async (req, res) => { await activityService.clearHistory(req.userId!); success(res, null, '浏览记录已清空') }
export const removeHistory: RequestHandler = async (req, res) => { await activityService.removeHistory(req.userId!, productId(req.params.productId)); success(res, null, '记录已删除') }
export const uploadReviewImages: RequestHandler = (req, res) => {
  const files = req.files as Express.Multer.File[]
  if (!files?.length) throw new AppError(422, '请选择要上传的图片')
  const origin = `${req.protocol}://${req.get('host')}`
  return success(res, { urls: files.map((file) => `${origin}/uploads/reviews/${file.filename}`) }, '图片上传成功', 201)
}
