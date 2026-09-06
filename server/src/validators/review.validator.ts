import Joi from 'joi'

export const createReviewSchema = Joi.object({
  orderItemId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  content: Joi.string().trim().min(5).max(1000).required(),
  images: Joi.array().items(Joi.string().uri({ relativeOnly: false }).max(500)).max(5).default([]),
})

export const reviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(10),
})
