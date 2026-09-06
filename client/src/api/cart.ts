import { http } from './http'
import type { ApiResponse, CartLine } from '@/types'

export interface CartInput { productId: number; skuId: number; quantity: number }

export const cartApi = {
  list: () => http.get<never, ApiResponse<CartLine[]>>('/cart'),
  add: (data: CartInput) => http.post<never, ApiResponse<CartLine>>('/cart/items', data),
  update: (id: number, quantity: number) => http.patch<never, ApiResponse<CartLine>>(`/cart/items/${id}`, { quantity }),
  remove: (id: number) => http.delete<never, ApiResponse<null>>(`/cart/items/${id}`),
  clear: () => http.delete<never, ApiResponse<null>>('/cart'),
  sync: (items: CartInput[]) => http.post<never, ApiResponse<CartLine[]>>('/cart/sync', { items }),
}
