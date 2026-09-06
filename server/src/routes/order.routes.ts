import { Router } from 'express'
import * as controller from '../controllers/order.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validate.js'
import { createOrderSchema, orderQuerySchema } from '../validators/order.validator.js'

export const orderRouter = Router()
orderRouter.use(authenticate)
orderRouter.post('/', validate(createOrderSchema), asyncHandler(controller.create))
orderRouter.get('/', validateQuery(orderQuerySchema), asyncHandler(controller.list))
orderRouter.get('/:id', asyncHandler(controller.detail))
orderRouter.post('/:id/pay', asyncHandler(controller.pay))
orderRouter.post('/:id/cancel', asyncHandler(controller.cancel))
orderRouter.post('/:id/confirm-receipt', asyncHandler(controller.confirmReceipt))
