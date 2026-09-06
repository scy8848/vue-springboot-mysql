import { Router } from 'express'
import * as controller from '../controllers/admin.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validate.js'
import {
  adminOrderQuerySchema, adminProductQuerySchema, adminProductSchema, adminUserQuerySchema,
  orderStatusSchema, productStatusSchema, userStatusSchema,
} from '../validators/admin.validator.js'

export const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)
adminRouter.get('/stats', asyncHandler(controller.stats))
adminRouter.get('/products', validateQuery(adminProductQuerySchema), asyncHandler(controller.products))
adminRouter.post('/products', validate(adminProductSchema), asyncHandler(controller.createProduct))
adminRouter.put('/products/:id', validate(adminProductSchema), asyncHandler(controller.updateProduct))
adminRouter.patch('/products/:id/status', validate(productStatusSchema), asyncHandler(controller.setProductStatus))
adminRouter.get('/orders', validateQuery(adminOrderQuerySchema), asyncHandler(controller.orders))
adminRouter.patch('/orders/:id/status', validate(orderStatusSchema), asyncHandler(controller.setOrderStatus))
adminRouter.get('/users', validateQuery(adminUserQuerySchema), asyncHandler(controller.users))
adminRouter.patch('/users/:id/status', validate(userStatusSchema), asyncHandler(controller.setUserStatus))
