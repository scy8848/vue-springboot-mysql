import Joi from 'joi'

export const addCartItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  skuId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(99).default(1),
})

export const updateCartItemSchema = Joi.object({ quantity: Joi.number().integer().min(1).max(99).required() })

export const syncCartSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    productId: Joi.number().integer().positive().required(),
    skuId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).max(99).required(),
  })).max(50).required(),
})
