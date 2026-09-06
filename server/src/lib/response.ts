import type { Response } from 'express'

export function success<T>(res: Response, data: T, message = '操作成功', status = 200) {
  return res.status(status).json({ code: 0, data, message })
}
