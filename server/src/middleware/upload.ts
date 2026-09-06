import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { AppError } from '../lib/AppError.js'

const projectRoot = path.basename(process.cwd()) === 'server' ? process.cwd() : path.join(process.cwd(), 'server')
export const uploadRoot = path.join(projectRoot, 'uploads')
const reviewDir = path.join(uploadRoot, 'reviews')
mkdirSync(reviewDir, { recursive: true })

const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
export const reviewUpload = multer({
  storage: multer.diskStorage({ destination: reviewDir, filename: (_req, file, callback) => callback(null, `${randomUUID()}${extensions[file.mimetype] || ''}`) }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => extensions[file.mimetype] ? callback(null, true) : callback(new AppError(422, '仅支持 JPG、PNG、WebP 图片')),
})
