import type { OrderStatus } from '@/types'

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款', PENDING_SHIPMENT: '待发货', SHIPPED: '待收货', COMPLETED: '已完成', CANCELLED: '已取消',
}
export const orderStatusType: Record<OrderStatus, '' | 'warning' | 'success' | 'info' | 'primary'> = {
  PENDING_PAYMENT: 'warning', PENDING_SHIPMENT: 'primary', SHIPPED: 'success', COMPLETED: 'success', CANCELLED: 'info',
}
export const formatDateTime = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—'
