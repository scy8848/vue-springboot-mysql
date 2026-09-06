import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/products' },
    {
      path: '/', component: () => import('@/layouts/ShopLayout.vue'),
      children: [
        { path: 'products', name: 'products', component: () => import('@/views/shop/ProductListView.vue') },
        { path: 'products/:id', name: 'product-detail', component: () => import('@/views/shop/ProductDetailView.vue') },
        { path: 'cart', name: 'cart', component: () => import('@/views/shop/CartView.vue') },
        { path: 'checkout', name: 'checkout', component: () => import('@/views/shop/CheckoutView.vue'), meta: { auth: true } },
      ],
    },
    { path: '/auth/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true } },
    { path: '/auth/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
    {
      path: '/account', component: () => import('@/layouts/AccountLayout.vue'), meta: { auth: true },
      children: [
        { path: '', redirect: '/account/profile' },
        { path: 'profile', name: 'profile', component: () => import('@/views/account/ProfileView.vue') },
        { path: 'addresses', name: 'addresses', component: () => import('@/views/account/AddressView.vue') },
        { path: 'orders', name: 'orders', component: () => import('@/views/account/OrderListView.vue') },
        { path: 'orders/:id', name: 'order-detail', component: () => import('@/views/account/OrderDetailView.vue') },
        { path: 'favorites', name: 'favorites', component: () => import('@/views/account/ActivityView.vue') },
        { path: 'history', name: 'history', component: () => import('@/views/account/ActivityView.vue') },
      ],
    },
    {
      path: '/admin', component: () => import('@/layouts/AdminLayout.vue'), meta: { auth: true, admin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboardView.vue') },
        { path: 'products', name: 'admin-products', component: () => import('@/views/admin/AdminProductsView.vue') },
        { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/AdminOrdersView.vue') },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.admin && auth.user?.role !== 'ADMIN') return { name: 'products' }
  if (to.meta.guest && auth.isLoggedIn) return { name: 'profile' }
})

export default router
