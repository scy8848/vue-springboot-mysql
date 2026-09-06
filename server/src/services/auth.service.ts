import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { VerificationType, type User } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { env } from '../config/env.js'
import { sendVerificationEmail } from './mail.service.js'

const publicUser = (user: User) => ({
  id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, phone: user.phone,
  role: user.role, status: user.status, createdAt: user.createdAt,
})

function issueToken(user: User) {
  return jwt.sign({ role: user.role }, env.jwtSecret, { subject: String(user.id), expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

export const authService = {
  async sendCode(email: string) {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (exists) throw new AppError(409, '该邮箱已注册，请直接登录')
    const recent = await prisma.emailVerification.findFirst({ where: { email, type: VerificationType.REGISTER, createdAt: { gt: new Date(Date.now() - 60_000) } } })
    if (recent) throw new AppError(429, '发送过于频繁，请 60 秒后再试')
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(code, 10)
    await prisma.emailVerification.create({ data: { email, codeHash, type: VerificationType.REGISTER, expiresAt: new Date(Date.now() + 10 * 60_000) } })
    const mailed = await sendVerificationEmail(email, code)
    return { expiresIn: 600, ...(!mailed && env.nodeEnv !== 'production' ? { devCode: code } : {}) }
  },

  async register(input: { email: string; password: string; code: string; nickname?: string }) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } })
    if (exists) throw new AppError(409, '该邮箱已注册，请直接登录')
    const verification = await prisma.emailVerification.findFirst({
      where: { email: input.email, type: VerificationType.REGISTER, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' },
    })
    if (!verification || !await bcrypt.compare(input.code, verification.codeHash)) throw new AppError(422, '验证码错误或已过期')
    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email: input.email, passwordHash, nickname: input.nickname || null } })
      await tx.emailVerification.update({ where: { id: verification.id }, data: { usedAt: new Date() } })
      return created
    })
    return { token: issueToken(user), user: publicUser(user) }
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !await bcrypt.compare(password, user.passwordHash)) throw new AppError(401, '邮箱或密码错误')
    if (user.status === 'BANNED') throw new AppError(403, '该账户已被封禁')
    return { token: issueToken(user), user: publicUser(user) }
  },
}
