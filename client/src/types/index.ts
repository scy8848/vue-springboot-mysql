export interface User {
  id: number
  email: string
  nickname: string | null
  avatar: string | null
  phone: string | null
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'BANNED'
  createdAt: string
}

export interface Address {
  id: number
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  postalCode: string | null
  isDefault: boolean
}

export interface ApiResponse<T> { code: number; data: T; message: string }

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  parentId: number | null
  children?: Category[]
}

export interface Product {
  id: number
  categoryId: number
  name: string
  subtitle: string | null
  description: string
  cover: string
  price: number
  originalPrice: number | null
  stock: number
  salesCount: number
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE'
  category: Pick<Category, 'id' | 'name'> & { parent?: Pick<Category, 'id' | 'name'> | null }
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export interface ProductSku {
  id: number
  skuCode: string
  name: string
  specs: Record<string, string>
  price: number
  stock: number
}

export interface ProductDetail extends Product {
  images: Array<{ id: number; url: string; alt: string | null; sort: number }>
  skus: ProductSku[]
}

export interface Pagination { page: number; pageSize: number; total: number; totalPages: number }

export interface CartLine {
  id: number | string
  productId: number
  skuId: number
  quantity: number
  available: boolean
  product: Pick<Product, 'id' | 'name' | 'subtitle' | 'cover'> & { status?: string }
  sku: ProductSku
  subtotal: number
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_SHIPMENT' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'

export interface OrderItem {
  id: number
  productId: number | null
  skuId: number | null
  productName: string
  skuName: string
  specs: Record<string, string>
  image: string
  price: number
  quantity: number
  subtotal: number
  review?: { id: number } | null
}

export interface Review {
  id: number
  rating: number
  content: string
  images: string[]
  createdAt: string
  user: { nickname: string | null; avatar: string | null }
  orderItem: { skuName: string }
}

export interface ProductActivity {
  id: number
  createdAt?: string
  viewedAt?: string
  product: Product
}

export interface Order {
  id: number
  orderNo: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  shippingFee: number
  payableAmount: number
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  addressDetail: string
  postalCode: string | null
  remark: string | null
  items: OrderItem[]
  paidAt: string | null
  shippedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface AdminStats {
  orderCount: number
  salesAmount: number
  userCount: number
  activeProductCount: number
  orderStatus: Record<OrderStatus, number>
}

export interface AdminProduct extends ProductDetail { status: ProductStatus; updatedAt: string }
export interface AdminOrder extends Order { user: Pick<User, 'id' | 'email' | 'nickname'> }
export interface AdminUser extends User { orderCount: number }
