import Joi from 'joi'

export const updateProfileSchema = Joi.object({
  nickname: Joi.string().trim().max(30).allow('', null), avatar: Joi.string().uri().max(500).allow('', null),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('', null),
}).min(1)

export const addressSchema = Joi.object({
  receiver: Joi.string().trim().min(2).max(30).required(), phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  province: Joi.string().trim().max(30).required(), city: Joi.string().trim().max(30).required(), district: Joi.string().trim().max(30).required(),
  detail: Joi.string().trim().min(3).max(255).required(), postalCode: Joi.string().trim().max(12).allow('', null), isDefault: Joi.boolean().default(false),
})
