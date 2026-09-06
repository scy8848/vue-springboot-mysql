import type { RequestHandler } from 'express'
import { AppError } from '../lib/AppError.js'
import { success } from '../lib/response.js'
import { cartService } from '../services/cart.service.js'

const idOf = (raw: string | string[] | undefined) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, '购物车条目 ID 不正确')
  return id
}
export const list: RequestHandler = async (req, res) => success(res, await cartService.list(req.userId!))
export const add: RequestHandler = async (req, res) => success(res, await cartService.add(req.userId!, req.body), '已加入购物车', 201)
export const update: RequestHandler = async (req, res) => success(res, await cartService.update(req.userId!, idOf(req.params.id), req.body.quantity), '数量已更新')
export const remove: RequestHandler = async (req, res) => { await cartService.remove(req.userId!, idOf(req.params.id)); success(res, null, '商品已删除') }
export const clear: RequestHandler = async (req, res) => { await cartService.clear(req.userId!); success(res, null, '购物车已清空') }
export const sync: RequestHandler = async (req, res) => success(res, await cartService.sync(req.userId!, req.body.items), '购物车已同步')
