import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '@/api/cart'
import { useAuthStore } from './auth'
import type { CartLine, ProductDetail, ProductSku } from '@/types'

export const useCartStore = defineStore('mori-cart', () => {
  const guestItems = ref<CartLine[]>([])
  const serverItems = ref<CartLine[]>([])
  const loaded = ref(false)
  const auth = useAuthStore()
  const items = computed(() => auth.isLoggedIn ? serverItems.value : guestItems.value)
  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  async function bootstrap() {
    if (!auth.isLoggedIn || loaded.value) return
    serverItems.value = (await cartApi.list()).data
    loaded.value = true
  }
  async function add(product: ProductDetail, sku: ProductSku, quantity: number) {
    if (auth.isLoggedIn) {
      await cartApi.add({ productId: product.id, skuId: sku.id, quantity })
      loaded.value = false
      await bootstrap()
      return
    }
    const existing = guestItems.value.find((item) => item.skuId === sku.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, sku.stock, 99)
      existing.subtotal = existing.quantity * sku.price
    } else {
      guestItems.value.unshift({
        id: `guest-${sku.id}`, productId: product.id, skuId: sku.id, quantity: Math.min(quantity, sku.stock), available: sku.stock > 0,
        product: { id: product.id, name: product.name, subtitle: product.subtitle, cover: product.cover }, sku: { ...sku }, subtotal: sku.price * quantity,
      })
    }
  }
  async function setQuantity(item: CartLine, quantity: number) {
    const safe = Math.max(1, Math.min(quantity, item.sku.stock, 99))
    if (auth.isLoggedIn) {
      const updated = (await cartApi.update(Number(item.id), safe)).data
      const index = serverItems.value.findIndex((line) => line.id === item.id)
      if (index >= 0) serverItems.value[index] = updated
    } else {
      item.quantity = safe
      item.subtotal = item.sku.price * safe
    }
  }
  async function remove(item: CartLine) {
    if (auth.isLoggedIn) {
      await cartApi.remove(Number(item.id))
      serverItems.value = serverItems.value.filter((line) => line.id !== item.id)
    } else guestItems.value = guestItems.value.filter((line) => line.id !== item.id)
  }
  async function clear() {
    if (auth.isLoggedIn) { await cartApi.clear(); serverItems.value = [] }
    else guestItems.value = []
  }
  async function syncGuest() {
    if (!auth.isLoggedIn) return
    if (guestItems.value.length) {
      serverItems.value = (await cartApi.sync(guestItems.value.map(({ productId, skuId, quantity }) => ({ productId, skuId, quantity })))).data
      guestItems.value = []
      loaded.value = true
    } else { loaded.value = false; await bootstrap() }
  }
  function resetSession() { serverItems.value = []; loaded.value = false }
  return { guestItems, serverItems, loaded, items, totalCount, bootstrap, add, setQuantity, remove, clear, syncGuest, resetSession }
}, { persist: { pick: ['guestItems'] } })
