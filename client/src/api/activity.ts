import { http } from './http'
import type { ApiResponse, Pagination, ProductActivity, Review } from '@/types'

export const reviewApi = {
  list: (productId: number, params: { page?: number; pageSize?: number } = {}) => http.get<never, ApiResponse<{ items: Review[]; summary: { total: number; average: number }; pagination: Pagination }>>(`/catalog/products/${productId}/reviews`, { params }),
  create: (data: { orderItemId: number; rating: number; content: string; images: string[] }) => http.post<never, ApiResponse<Review>>('/reviews', data),
  upload: (files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    return http.post<never, ApiResponse<{ urls: string[] }>>('/uploads/reviews', form)
  },
}

export const favoriteApi = {
  list: () => http.get<never, ApiResponse<ProductActivity[]>>('/favorites'),
  status: (productId: number) => http.get<never, ApiResponse<{ favorited: boolean }>>(`/favorites/${productId}/status`),
  add: (productId: number) => http.post<never, ApiResponse<unknown>>(`/favorites/${productId}`),
  remove: (productId: number) => http.delete<never, ApiResponse<null>>(`/favorites/${productId}`),
}

export const historyApi = {
  list: () => http.get<never, ApiResponse<ProductActivity[]>>('/history'),
  record: (productId: number) => http.post<never, ApiResponse<null>>(`/history/${productId}`),
  remove: (productId: number) => http.delete<never, ApiResponse<null>>(`/history/${productId}`),
  clear: () => http.delete<never, ApiResponse<null>>('/history'),
}
