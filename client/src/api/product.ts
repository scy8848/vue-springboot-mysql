import { http } from './http'
import type { ApiResponse, Category, Pagination, Product, ProductDetail } from '@/types'

export interface ProductQuery {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  sort?: 'default' | 'price_asc' | 'price_desc' | 'sales'
}

export const productApi = {
  categories: () => http.get<never, ApiResponse<Category[]>>('/catalog/categories'),
  list: (params: ProductQuery) => http.get<never, ApiResponse<{ items: Product[]; pagination: Pagination }>>('/catalog/products', { params }),
  detail: (id: number) => http.get<never, ApiResponse<ProductDetail>>(`/catalog/products/${id}`),
}
