import { Router } from 'express'
import * as controller from '../controllers/user.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { addressSchema, updateProfileSchema } from '../validators/user.validator.js'

export const userRouter = Router()
userRouter.use(authenticate)
userRouter.get('/me', asyncHandler(controller.getProfile))
userRouter.patch('/me', validate(updateProfileSchema), asyncHandler(controller.updateProfile))
userRouter.get('/addresses', asyncHandler(controller.listAddresses))
userRouter.post('/addresses', validate(addressSchema), asyncHandler(controller.createAddress))
userRouter.put('/addresses/:id', validate(addressSchema), asyncHandler(controller.updateAddress))
userRouter.delete('/addresses/:id', asyncHandler(controller.deleteAddress))
userRouter.patch('/addresses/:id/default', asyncHandler(controller.setDefaultAddress))
