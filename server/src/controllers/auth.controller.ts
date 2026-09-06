import type { RequestHandler } from 'express'
import { authService } from '../services/auth.service.js'
import { success } from '../lib/response.js'

export const sendCode: RequestHandler = async (req, res) => success(res, await authService.sendCode(req.body.email), '验证码已发送')
export const register: RequestHandler = async (req, res) => success(res, await authService.register(req.body), '注册成功', 201)
export const login: RequestHandler = async (req, res) => success(res, await authService.login(req.body.email, req.body.password), '登录成功')
