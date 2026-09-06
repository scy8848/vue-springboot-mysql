import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { authRouter } from './routes/auth.routes.js'
import { userRouter } from './routes/user.routes.js'
import { cartRouter } from './routes/cart.routes.js'
import { orderRouter } from './routes/order.routes.js'
import { favoriteRouter, historyRouter, reviewRouter, uploadRouter } from './routes/activity.routes.js'
import { uploadRoot } from './middleware/upload.js'
import { productRouter } from './routes/product.routes.js'
import { errorHandler, notFound } from './middleware/error.js'
import { adminRouter } from './routes/admin.routes.js'

export const app = express()
app.disable('x-powered-by')
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (_req, res) => res.json({ code: 0, data: { status: 'ok' }, message: '服务正常' }))
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', orderRouter)
app.use('/api/favorites', favoriteRouter)
app.use('/api/history', historyRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/uploads', uploadRouter)
app.use('/uploads', express.static(uploadRoot, { maxAge: '7d', immutable: true }))
app.use('/api/catalog', productRouter)
app.use('/api/admin', adminRouter)
app.use(notFound)
app.use(errorHandler)
