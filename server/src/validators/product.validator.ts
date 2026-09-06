import Joi from 'joi'

export const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  keyword: Joi.string().trim().max(80).allow(''),
  categoryId: Joi.number().integer().positive(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice')),
  sort: Joi.string().valid('default', 'price_asc', 'price_desc', 'sales').default('default'),
})
