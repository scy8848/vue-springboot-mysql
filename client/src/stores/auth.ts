import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { userApi } from '@/api/user'
import type { User } from '@/types'

export const useAuthStore = defineStore('mori-auth', () => {
  const token = ref('')
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => Boolean(token.value))
  async function login(payload: LoginPayload) {
    const response = await authApi.login(payload)
    token.value = response.data.token
    user.value = response.data.user
    const { useCartStore } = await import('./cart')
    await useCartStore().syncGuest().catch(() => undefined)
  }
  async function register(payload: RegisterPayload) {
    const response = await authApi.register(payload)
    token.value = response.data.token
    user.value = response.data.user
    const { useCartStore } = await import('./cart')
    await useCartStore().syncGuest().catch(() => undefined)
  }
  async function refreshProfile() {
    const response = await userApi.me()
    user.value = response.data
  }
  async function logout() {
    token.value = ''; user.value = null
    const { useCartStore } = await import('./cart')
    useCartStore().resetSession()
  }
  return { token, user, isLoggedIn, login, register, refreshProfile, logout }
}, { persist: true })
