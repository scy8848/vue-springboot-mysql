import { Router } from 'express'
import * as controller from '../controllers/activity.controller.js'
import { create as createReview } from '../controllers/review.controller.js'
import { asyncHandler } from '../lib/asyncHandler.js'
import { authenticate } from '../middleware/auth.js'
import { reviewUpload } from '../middleware/upload.js'
import { validate } from '../middleware/validate.js'
import { createReviewSchema } from '../validators/review.validator.js'

export const favoriteRouter = Router()
favoriteRouter.use(authenticate)
favoriteRouter.get('/', asyncHandler(controller.favorites))
favoriteRouter.get('/:productId/status', asyncHandler(controller.favoriteStatus))
favoriteRouter.post('/:productId', asyncHandler(controller.addFavorite))
favoriteRouter.delete('/:productId', asyncHandler(controller.removeFavorite))

export const historyRouter = Router()
historyRouter.use(authenticate)
historyRouter.get('/', asyncHandler(controller.histories))
historyRouter.post('/:productId', asyncHandler(controller.recordHistory))
historyRouter.delete('/:productId', asyncHandler(controller.removeHistory))
historyRouter.delete('/', asyncHandler(controller.clearHistory))

export const reviewRouter = Router()
reviewRouter.use(authenticate)
reviewRouter.post('/', validate(createReviewSchema), asyncHandler(createReview))

export const uploadRouter = Router()
uploadRouter.use(authenticate)
uploadRouter.post('/reviews', reviewUpload.array('images', 5), asyncHandler(controller.uploadReviewImages))
