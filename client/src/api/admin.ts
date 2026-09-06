import { http } from './http'
import type { AdminOrder, AdminProduct, AdminStats, AdminUser, ApiResponse, OrderStatus, Pagination, ProductStatus } from '@/types'

type PageResult<T> = { items: T[]; pagination: Pagination }
export interface ProductPayload {
  categoryId: number; name: string; subtitle: string | null; description: string; cover: string
  price: number; originalPrice: number | null; status: ProductStatus
  skus: Array<{ id?: number; skuCode: string; name: string; specs: Record<string, string>; price: number; stock: number }>
}

export const adminApi = {
  stats: () => http.get<never, ApiResponse<AdminStats>>('/admin/stats'),
  products: (params: Record<string, unknown>) => http.get<never, ApiResponse<PageResult<AdminProduct>>>('/admin/products', { params }),
  createProduct: (data: ProductPayload) => http.post<never, ApiResponse<AdminProduct>>('/admin/products', data),
  updateProduct: (id: number, data: ProductPayload) => http.put<never, ApiResponse<AdminProduct>>(`/admin/products/${id}`, data),
  setProductStatus: (id: number, status: ProductStatus) => http.patch<never, ApiResponse<AdminProduct>>(`/admin/products/${id}/status`, { status }),
  orders: (params: Record<string, unknown>) => http.get<never, ApiResponse<PageResult<AdminOrder>>>('/admin/orders', { params }),
  setOrderStatus: (id: number, status: OrderStatus) => http.patch<never, ApiResponse<AdminOrder>>(`/admin/orders/${id}/status`, { status }),
  users: (params: Record<string, unknown>) => http.get<never, ApiResponse<PageResult<AdminUser>>>('/admin/users', { params }),
  setUserStatus: (id: number, status: 'ACTIVE' | 'BANNED') => http.patch<never, ApiResponse<Pick<AdminUser, 'id' | 'email' | 'status'>>>(`/admin/users/${id}/status`, { status }),
}
