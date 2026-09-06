import Joi from 'joi'

const email = Joi.string().max(191).lowercase().required().messages({ 'any.required': '请输入邮箱' })
const password = Joi.string().min(8).max(72).pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/).required().messages({ 'string.pattern.base': '密码必须同时包含字母和数字', 'string.min': '密码至少 8 位' })

export const sendCodeSchema = Joi.object({ email, type: Joi.string().valid('REGISTER').default('REGISTER') })
export const registerSchema = Joi.object({ email, password, code: Joi.string().length(6).pattern(/^\d+$/).required(), nickname: Joi.string().trim().max(30).allow('', null) })
export const loginSchema = Joi.object({ email, password: Joi.string().min(1).max(72).required() })