import { Router } from 'express'
import { categories, detail, list } from '../controllers/product.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { validateQuery } from '../middleware/validate.js'
import { productQuerySchema } from '../validators/product.validator.js'
import { list as listReviews } from '../controllers/review.controller.js'
import { reviewQuerySchema } from '../validators/review.validator.js'

export const productRouter = Router()
productRouter.get('/categories', asyncHandler(categories))
productRouter.get('/products', validateQuery(productQuerySchema), asyncHandler(list))
productRouter.get('/products/:id/reviews', validateQuery(reviewQuerySchema), asyncHandler(listReviews))
productRouter.get('/products/:id', asyncHandler(detail))
