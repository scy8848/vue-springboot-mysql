import { http } from './http'
import type { ApiResponse, Order, OrderStatus, Pagination } from '@/types'

export const orderApi = {
  create: (data: { addressId: number; cartItemIds: number[]; remark?: string }) => http.post<never, ApiResponse<Order>>('/orders', data),
  list: (params: { page?: number; pageSize?: number; status?: OrderStatus }) => http.get<never, ApiResponse<{ items: Order[]; pagination: Pagination }>>('/orders', { params }),
  detail: (id: number) => http.get<never, ApiResponse<Order>>(`/orders/${id}`),
  pay: (id: number) => http.post<never, ApiResponse<Order>>(`/orders/${id}/pay`),
  cancel: (id: number) => http.post<never, ApiResponse<Order>>(`/orders/${id}/cancel`),
  confirmReceipt: (id: number) => http.post<never, ApiResponse<Order>>(`/orders/${id}/confirm-receipt`),
}
