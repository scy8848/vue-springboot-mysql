import type { RequestHandler } from 'express'
import type Joi from 'joi'
import { AppError } from '../lib/AppError.js'

export const validate = (schema: Joi.ObjectSchema): RequestHandler => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) return next(new AppError(422, error.details.map((item) => item.message).join('；')))
  req.body = value
  next()
}

export const validateQuery = (schema: Joi.ObjectSchema): RequestHandler => (req, _res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true })
  if (error) return next(new AppError(422, error.details.map((item) => item.message).join('；')))
  req.query = value
  next()
}
