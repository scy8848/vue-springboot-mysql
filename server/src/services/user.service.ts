import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'

const userSelect = { id: true, email: true, nickname: true, avatar: true, phone: true, role: true, status: true, createdAt: true } as const
export type AddressPayload = { receiver: string; phone: string; province: string; city: string; district: string; detail: string; postalCode?: string | null; isDefault?: boolean }

async function ownedAddress(userId: number, id: number) {
  const address = await prisma.address.findFirst({ where: { id, userId } })
  if (!address) throw new AppError(404, '地址不存在')
  return address
}

export const userService = {
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })
    if (!user) throw new AppError(404, '用户不存在')
    return user
  },
  updateProfile(userId: number, data: Prisma.UserUpdateInput) {
    const clean = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]))
    return prisma.user.update({ where: { id: userId }, data: clean, select: userSelect })
  },
  listAddresses(userId: number) { return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] }) },
  async createAddress(userId: number, data: AddressPayload) {
    const count = await prisma.address.count({ where: { userId } })
    if (count >= 10) throw new AppError(422, '最多只能保存 10 个收货地址')
    return prisma.$transaction(async (tx) => {
      const makeDefault = data.isDefault || count === 0
      if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
      return tx.address.create({ data: { ...data, postalCode: data.postalCode || null, isDefault: makeDefault, userId } })
    })
  },
  async updateAddress(userId: number, id: number, data: AddressPayload) {
    await ownedAddress(userId, id)
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) await tx.address.updateMany({ where: { userId, id: { not: id } }, data: { isDefault: false } })
      return tx.address.update({ where: { id }, data: { ...data, postalCode: data.postalCode || null } })
    })
  },
  async deleteAddress(userId: number, id: number) {
    const address = await ownedAddress(userId, id)
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } })
      if (address.isDefault) {
        const replacement = await tx.address.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } })
        if (replacement) await tx.address.update({ where: { id: replacement.id }, data: { isDefault: true } })
      }
    })
  },
  async setDefaultAddress(userId: number, id: number) {
    await ownedAddress(userId, id)
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
      return tx.address.update({ where: { id }, data: { isDefault: true } })
    })
  },
}
