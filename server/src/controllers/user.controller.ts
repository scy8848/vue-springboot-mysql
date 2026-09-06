import type { RequestHandler } from 'express'
import { success } from '../lib/response.js'
import { userService } from '../services/user.service.js'

export const getProfile: RequestHandler = async (req, res) => success(res, await userService.getProfile(req.userId!))
export const updateProfile: RequestHandler = async (req, res) => success(res, await userService.updateProfile(req.userId!, req.body), '资料已更新')
export const listAddresses: RequestHandler = async (req, res) => success(res, await userService.listAddresses(req.userId!))
export const createAddress: RequestHandler = async (req, res) => success(res, await userService.createAddress(req.userId!, req.body), '地址已创建', 201)
export const updateAddress: RequestHandler = async (req, res) => success(res, await userService.updateAddress(req.userId!, Number(req.params.id), req.body), '地址已更新')
export const deleteAddress: RequestHandler = async (req, res) => { await userService.deleteAddress(req.userId!, Number(req.params.id)); success(res, null, '地址已删除') }
export const setDefaultAddress: RequestHandler = async (req, res) => success(res, await userService.setDefaultAddress(req.userId!, Number(req.params.id)), '默认地址已更新')
