import { http } from './http'
import type { Address, ApiResponse, User } from '@/types'

export type AddressInput = Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }

export const userApi = {
  me: () => http.get<never, ApiResponse<User>>('/users/me'),
  updateMe: (data: Partial<Pick<User, 'nickname' | 'avatar' | 'phone'>>) => http.patch<never, ApiResponse<User>>('/users/me', data),
  addresses: () => http.get<never, ApiResponse<Address[]>>('/users/addresses'),
  createAddress: (data: AddressInput) => http.post<never, ApiResponse<Address>>('/users/addresses', data),
  updateAddress: (id: number, data: AddressInput) => http.put<never, ApiResponse<Address>>(`/users/addresses/${id}`, data),
  removeAddress: (id: number) => http.delete<never, ApiResponse<null>>(`/users/addresses/${id}`),
  setDefault: (id: number) => http.patch<never, ApiResponse<Address>>(`/users/addresses/${id}/default`),
}
