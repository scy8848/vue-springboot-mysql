import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../lib/AppError.js'
import { prisma } from '../lib/prisma.js'

interface TokenPayload { sub: string; role: 'USER' | 'ADMIN' }

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') || []
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, '请先登录'))
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload
    req.userId = Number(payload.sub)
    prisma.user.findUnique({ where: { id: req.userId }, select: { role: true, status: true } })
      .then((user) => {
        if (!user) return next(new AppError(401, '账户不存在，请重新登录'))
        if (user.status === 'BANNED') return next(new AppError(403, '该账户已被封禁'))
        req.userRole = user.role
        next()
      })
      .catch(next)
  } catch { next(new AppError(401, '登录已过期，请重新登录')) }
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.userRole !== 'ADMIN') return next(new AppError(403, '需要管理员权限'))
  next()
}
