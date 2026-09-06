import type { RequestHandler } from 'express'
import type { OrderStatus } from '@prisma/client'
import { AppError } from '../lib/AppError.js'
import { success } from '../lib/response.js'
import { orderService } from '../services/order.service.js'

const idOf = (raw: string | string[] | undefined) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, '订单 ID 不正确')
  return id
}
export const create: RequestHandler = async (req, res) => success(res, await orderService.create(req.userId!, req.body), '订单创建成功', 201)
export const list: RequestHandler = async (req, res) => success(res, await orderService.list(req.userId!, req.query as unknown as { page: number; pageSize: number; status?: OrderStatus }))
export const detail: RequestHandler = async (req, res) => success(res, await orderService.detail(req.userId!, idOf(req.params.id)))
export const pay: RequestHandler = async (req, res) => success(res, await orderService.pay(req.userId!, idOf(req.params.id)), '支付成功')
export const cancel: RequestHandler = async (req, res) => success(res, await orderService.cancel(req.userId!, idOf(req.params.id)), '订单已取消')
export const confirmReceipt: RequestHandler = async (req, res) => success(res, await orderService.confirmReceipt(req.userId!, idOf(req.params.id)), '已确认收货')
