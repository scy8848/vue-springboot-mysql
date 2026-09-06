import Joi from 'joi'

const page = Joi.number().integer().min(1).default(1)
const pageSize = Joi.number().integer().min(1).max(50).default(10)

export const adminProductQuerySchema = Joi.object({
  page, pageSize,
  keyword: Joi.string().trim().max(80).allow(''),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'INACTIVE').allow(''),
  categoryId: Joi.number().integer().min(1),
})

const skuSchema = Joi.object({
  id: Joi.number().integer().min(1),
  skuCode: Joi.string().trim().max(80).required(),
  name: Joi.string().trim().max(100).required(),
  specs: Joi.object().default({}),
  price: Joi.number().precision(2).min(0).required(),
  stock: Joi.number().integer().min(0).required(),
})

export const adminProductSchema = Joi.object({
  categoryId: Joi.number().integer().min(1).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  subtitle: Joi.string().trim().max(255).allow('', null),
  description: Joi.string().trim().min(1).max(10000).required(),
  cover: Joi.string().trim().max(500).required(),
  price: Joi.number().precision(2).min(0).required(),
  originalPrice: Joi.number().precision(2).min(0).allow(null),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'INACTIVE').required(),
  skus: Joi.array().items(skuSchema).min(1).max(30).required(),
})

export const productStatusSchema = Joi.object({ status: Joi.string().valid('DRAFT', 'ACTIVE', 'INACTIVE').required() })

export const adminOrderQuerySchema = Joi.object({
  page, pageSize,
  keyword: Joi.string().trim().max(80).allow(''),
  status: Joi.string().valid('PENDING_PAYMENT', 'PENDING_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CANCELLED').allow(''),
})

export const orderStatusSchema = Joi.object({ status: Joi.string().valid('SHIPPED', 'COMPLETED', 'CANCELLED').required() })

export const adminUserQuerySchema = Joi.object({
  page, pageSize,
  keyword: Joi.string().trim().max(80).allow(''),
  status: Joi.string().valid('ACTIVE', 'BANNED').allow(''),
})

export const userStatusSchema = Joi.object({ status: Joi.string().valid('ACTIVE', 'BANNED').required() })
