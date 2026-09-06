import type { ErrorRequestHandler, RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { AppError } from '../lib/AppError.js'
import { env } from '../config/env.js'
import multer from 'multer'

export const notFound: RequestHandler = (req, _res, next) => next(new AppError(404, `接口不存在：${req.method} ${req.path}`))

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) return res.status(error.statusCode).json({ code: error.code, data: null, message: error.message })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ code: 409, data: null, message: '该数据已存在' })
  if (error instanceof multer.MulterError) return res.status(422).json({ code: 422, data: null, message: error.code === 'LIMIT_FILE_SIZE' ? '单张图片不能超过 5MB' : '图片上传失败，请检查数量和格式' })
  console.error(error)
  return res.status(500).json({ code: 500, data: null, message: env.nodeEnv === 'production' ? '服务器内部错误' : error.message })
}
