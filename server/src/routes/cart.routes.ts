import { Router } from 'express'
import * as controller from '../controllers/cart.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { addCartItemSchema, syncCartSchema, updateCartItemSchema } from '../validators/cart.validator.js'

export const cartRouter = Router()
cartRouter.use(authenticate)
cartRouter.get('/', asyncHandler(controller.list))
cartRouter.post('/items', validate(addCartItemSchema), asyncHandler(controller.add))
cartRouter.patch('/items/:id', validate(updateCartItemSchema), asyncHandler(controller.update))
cartRouter.delete('/items/:id', asyncHandler(controller.remove))
cartRouter.delete('/', asyncHandler(controller.clear))
cartRouter.post('/sync', validate(syncCartSchema), asyncHandler(controller.sync))
