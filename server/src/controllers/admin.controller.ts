import type { RequestHandler } from 'express'
import type { OrderStatus, ProductStatus, UserStatus } from '@prisma/client'
import { AppError } from '../lib/AppError.js'
import { success } from '../lib/response.js'
import { adminService } from '../services/admin.service.js'

const idOf = (raw: string | string[] | undefined) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(422, 'ID 不正确')
  return id
}

export const stats: RequestHandler = async (_req, res) => success(res, await adminService.stats())
export const products: RequestHandler = async (req, res) => success(res, await adminService.products(req.query as never))
export const createProduct: RequestHandler = async (req, res) => success(res, await adminService.createProduct(req.body), '商品创建成功', 201)
export const updateProduct: RequestHandler = async (req, res) => success(res, await adminService.updateProduct(idOf(req.params.id), req.body), '商品保存成功')
export const setProductStatus: RequestHandler = async (req, res) => success(res, await adminService.setProductStatus(idOf(req.params.id), req.body.status as ProductStatus), '商品状态已更新')
export const orders: RequestHandler = async (req, res) => success(res, await adminService.orders(req.query as never))
export const setOrderStatus: RequestHandler = async (req, res) => success(res, await adminService.setOrderStatus(idOf(req.params.id), req.body.status as OrderStatus), '订单状态已更新')
export const users: RequestHandler = async (req, res) => success(res, await adminService.users(req.query as never))
export const setUserStatus: RequestHandler = async (req, res) => success(res, await adminService.setUserStatus(idOf(req.params.id), req.body.status as UserStatus), '用户状态已更新')
