<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Search, User, ShoppingBag } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const keyword = ref(String(route.query.keyword || ''))
watch(() => route.query.keyword, (value) => { keyword.value = String(value || '') })
function search() {
  const query = { ...route.query, keyword: keyword.value.trim() || undefined, page: undefined }
  router.push({ name: 'products', query })
}
onMounted(() => cart.bootstrap().catch(() => undefined))
</script>

<template>
  <div :class="$style.shell">
    <header :class="$style.header">
      <RouterLink :class="$style.brand" to="/products"><span>M</span><b>MORI</b><small>森集</small></RouterLink>
      <div :class="$style.search"><el-input v-model="keyword" clearable placeholder="搜索生活好物" @keyup.enter="search"><template #suffix><el-icon @click="search"><Search /></el-icon></template></el-input></div>
      <nav :class="$style.actions">
        <RouterLink :to="auth.isLoggedIn ? '/account/profile' : '/auth/login'"><el-icon><User /></el-icon><span>{{ auth.isLoggedIn ? '账户' : '登录' }}</span></RouterLink>
        <RouterLink to="/cart" :class="$style.cartLink"><el-badge :value="cart.totalCount" :hidden="cart.totalCount === 0" :max="99"><el-icon><ShoppingBag /></el-icon></el-badge><span>购物袋</span></RouterLink>
      </nav>
    </header>
    <main><RouterView /></main>
    <footer :class="$style.footer"><div><strong>MORI 森集</strong><span>认真挑选，安心生活。</span></div><span>© 2026 MORI MARKET</span></footer>
  </div>
</template>

<style module lang="scss">
.shell { min-height: 100vh; background: #f5f6f1; }
.header { position: sticky; top: 0; z-index: 20; height: 76px; display: grid; grid-template-columns: 230px minmax(260px, 540px) 230px; justify-content: space-between; align-items: center; gap: 28px; padding: 0 clamp(22px, 5vw, 74px); background: rgba(250,251,247,.94); border-bottom: 1px solid #e0e5de; backdrop-filter: blur(14px); }
.brand { display: flex; align-items: center; gap: 9px; letter-spacing: .06em; span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: var(--mori-lime); color: #173c2c; font-weight: 800; } b { font-size: 19px; } small { color: #6f7a73; font-size: 14px; } }
.search :global(.el-input__wrapper) { border-radius: 999px; background: #fff; box-shadow: 0 0 0 1px #dfe5dd inset; padding: 3px 18px; }
.search :global(.el-icon) { cursor: pointer; }
.actions { display: flex; justify-content: flex-end; gap: 22px; a, button { display: flex; align-items: center; gap: 6px; border: 0; padding: 0; background: none; color: #455149; cursor: pointer; font-size: 14px; &:hover { color: var(--mori-green); } } }
.footer { min-height: 120px; margin-top: 80px; padding: 35px clamp(22px, 5vw, 74px); display: flex; justify-content: space-between; align-items: center; color: #cbd8d0; background: #153426; font-size: 13px; div { display: flex; flex-direction: column; gap: 7px; } strong { color: #fff; font-size: 18px; } }
@media(max-width: 760px) { .header { height: auto; min-height: 70px; grid-template-columns: 1fr auto; padding: 14px 18px; gap: 10px; }.search { grid-row: 2; grid-column: 1 / -1; }.brand small { display: none; }.actions span { display: none; }.footer { margin-top: 48px; } }
</style>
