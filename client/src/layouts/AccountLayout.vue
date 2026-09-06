<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Location, User, SwitchButton, Tickets, CollectionTag, Clock, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const initial = computed(() => (auth.user?.nickname || auth.user?.email || 'M').slice(0, 1).toUpperCase())
function logout() { auth.logout(); router.push('/auth/login') }
</script>

<template>
  <div :class="$style.shell">
    <header :class="$style.header">
      <RouterLink :class="$style.brand" to="/products"><span>M</span>MORI 森集</RouterLink>
      <div :class="$style.user"><span :class="$style.avatar">{{ initial }}</span><span>{{ auth.user?.nickname || auth.user?.email }}</span></div>
    </header>
    <div :class="$style.body">
      <aside :class="$style.sidebar">
        <div :class="$style.sideTitle">我的账户</div>
        <nav>
          <RouterLink to="/account/profile" :class="[$style.navItem, { [$style.active]: route.name === 'profile' }]"><el-icon><User /></el-icon>个人资料</RouterLink>
          <RouterLink to="/account/addresses" :class="[$style.navItem, { [$style.active]: route.name === 'addresses' }]"><el-icon><Location /></el-icon>收货地址</RouterLink>
          <RouterLink to="/account/orders" :class="[$style.navItem, { [$style.active]: route.name === 'orders' || route.name === 'order-detail' }]"><el-icon><Tickets /></el-icon>我的订单</RouterLink>
          <RouterLink to="/account/favorites" :class="[$style.navItem, { [$style.active]: route.name === 'favorites' }]"><el-icon><CollectionTag /></el-icon>我的收藏</RouterLink>
          <RouterLink to="/account/history" :class="[$style.navItem, { [$style.active]: route.name === 'history' }]"><el-icon><Clock /></el-icon>浏览历史</RouterLink>
          <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin" :class="$style.navItem"><el-icon><Setting /></el-icon>管理后台</RouterLink>
          <button :class="$style.navItem" @click="logout"><el-icon><SwitchButton /></el-icon>退出登录</button>
        </nav>
        <div :class="$style.note"><strong>账户服务</strong><span>资料与地址会安全保存在你的个人账户中。</span></div>
      </aside>
      <main :class="$style.content"><RouterView /></main>
    </div>
  </div>
</template>

<style module lang="scss">
.shell { min-height: 100vh; background: #f4f6f2; }
.header { height: 76px; padding: 0 clamp(22px, 5vw, 72px); display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e4e9e2; }
.brand { display: flex; align-items: center; gap: 11px; font-size: 18px; font-weight: 800; letter-spacing: .06em; span { width: 34px; height: 34px; display: grid; place-items: center; color: #163526; background: var(--mori-lime); border-radius: 50%; } }
.user { display: flex; align-items: center; gap: 10px; color: #536159; font-size: 14px; }
.avatar { width: 34px; height: 34px; display: grid; place-items: center; background: #e7eee9; color: var(--mori-green); border-radius: 50%; font-weight: 750; }
.body { width: min(1180px, calc(100% - 40px)); margin: 38px auto; display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 34px; }
.sidebar { position: sticky; top: 28px; align-self: start; display: flex; flex-direction: column; background: #173c2c; padding: 26px 16px 18px; border-radius: 18px; color: #fff; min-height: 460px; }
.sideTitle { padding: 0 14px 20px; font-size: 13px; color: #aabdb2; letter-spacing: .12em; }
.navItem { width: 100%; border: 0; display: flex; align-items: center; gap: 11px; padding: 13px 14px; margin-bottom: 6px; border-radius: 10px; color: #d6e1da; background: none; font-size: 15px; cursor: pointer; transition: .18s; &:hover, &.active { color: #173c2c; background: var(--mori-lime); } }
.note { margin-top: 18px; padding: 16px; background: rgba(255,255,255,.08); border-radius: 11px; strong, span { display: block; } strong { margin-bottom: 6px; font-size: 13px; } span { color: #adc0b5; font-size: 12px; line-height: 1.6; } }
.content { min-width: 0; }
@media (max-width: 760px) {
  .user > span:last-child { display: none; }
  .body { width: min(100% - 28px, 720px); margin: 20px auto; grid-template-columns: 1fr; gap: 20px; }
  .sidebar { position: static; min-height: auto; display: block; padding: 10px; }
  .sidebar nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .sideTitle, .note { display: none; }
  .navItem { min-width: 0; justify-content: center; gap: 7px; margin: 0; padding: 11px 6px; font-size: 13px; white-space: nowrap; }
}
@media (max-width: 500px) {
  .sidebar nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .navItem { font-size: 14px; }
}
</style>
