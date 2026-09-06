import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, register, sendCode } from '../controllers/auth.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { loginSchema, registerSchema, sendCodeSchema } from '../validators/auth.validator.js'

export const authRouter = Router()
const codeLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { code: 429, data: null, message: '验证码请求过于频繁，请稍后再试' } })
authRouter.post('/send-code', codeLimiter, validate(sendCodeSchema), asyncHandler(sendCode))
authRouter.post('/register', validate(registerSchema), asyncHandler(register))
authRouter.post('/login', validate(loginSchema), asyncHandler(login))
