import Joi from 'joi'

export const createOrderSchema = Joi.object({
  addressId: Joi.number().integer().positive().required(),
  cartItemIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).unique().required(),
  remark: Joi.string().trim().max(255).allow('', null),
})

export const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid('PENDING_PAYMENT', 'PENDING_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CANCELLED'),
})
