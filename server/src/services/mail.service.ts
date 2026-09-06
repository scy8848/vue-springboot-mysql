import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export async function sendVerificationEmail(email: string, code: string) {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (env.nodeEnv === 'production') throw new Error('SMTP is not configured')
    console.log(`[MORI verification] ${email}: ${code}`)
    return false
  }
  const transporter = nodemailer.createTransport({
    host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  })
  await transporter.sendMail({
    from: env.smtp.from, to: email, subject: 'MORI 森集注册验证码',
    text: `你的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略本邮件。`,
    html: `<div style="font-family:sans-serif;padding:24px"><h2>MORI 森集</h2><p>你的注册验证码：</p><p style="font-size:28px;letter-spacing:8px;font-weight:700">${code}</p><p>10 分钟内有效。若非本人操作，请忽略本邮件。</p></div>`,
  })
  return true
}
