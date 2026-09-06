<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataBoard, Goods, List, User, Shop, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const initial = computed(() => (auth.user?.nickname || auth.user?.email || 'A').slice(0, 1).toUpperCase())
function logout() { auth.logout(); router.push('/auth/login') }
</script>

<template>
  <div :class="$style.shell">
    <aside :class="$style.sidebar">
      <RouterLink to="/admin" :class="$style.brand"><span>M</span><div>MORI<small>管理中心</small></div></RouterLink>
      <nav>
        <RouterLink to="/admin" :class="[$style.nav, { [$style.active]: route.name === 'admin-dashboard' }]"><el-icon><DataBoard /></el-icon><span>经营概览</span></RouterLink>
        <RouterLink to="/admin/products" :class="[$style.nav, { [$style.active]: route.name === 'admin-products' }]"><el-icon><Goods /></el-icon><span>商品管理</span></RouterLink>
        <RouterLink to="/admin/orders" :class="[$style.nav, { [$style.active]: route.name === 'admin-orders' }]"><el-icon><List /></el-icon><span>订单管理</span></RouterLink>
        <RouterLink to="/admin/users" :class="[$style.nav, { [$style.active]: route.name === 'admin-users' }]"><el-icon><User /></el-icon><span>用户管理</span></RouterLink>
      </nav>
      <div :class="$style.sideFoot"><RouterLink to="/products"><el-icon><Shop /></el-icon><span>返回商城</span></RouterLink><button @click="logout"><el-icon><SwitchButton /></el-icon><span>退出登录</span></button></div>
    </aside>
    <div :class="$style.main">
      <header :class="$style.header"><div><b>运营工作台</b><span>及时掌握商城状态</span></div><div :class="$style.account"><span>{{ initial }}</span><div><b>{{ auth.user?.nickname || '管理员' }}</b><small>{{ auth.user?.email }}</small></div></div></header>
      <main :class="$style.content"><RouterView /></main>
    </div>
  </div>
</template>

<style module lang="scss">
.shell { min-height: 100vh; display: grid; grid-template-columns: 236px minmax(0, 1fr); background: #f3f5f2; }
.sidebar { position: sticky; top: 0; height: 100vh; padding: 26px 18px; display: flex; flex-direction: column; color: #e7efe9; background: #122f23; }
.brand { display: flex; align-items: center; gap: 12px; padding: 0 10px 34px; font-weight: 850; letter-spacing: .1em; span { width: 38px; height: 38px; display: grid; place-items: center; color: #17382a; background: var(--mori-lime); border-radius: 12px; } div { display: grid; } small { margin-top: 2px; color: #85a092; font-size: 10px; letter-spacing: .18em; font-weight: 500; } }
nav { display: grid; gap: 6px; }.nav { height: 46px; padding: 0 14px; display: flex; align-items: center; gap: 12px; border-radius: 11px; color: #b9cbbf; font-size: 14px; transition: .18s; &:hover, &.active { color: #153426; background: var(--mori-lime); font-weight: 700; } }
.sideFoot { margin-top: auto; border-top: 1px solid rgba(255,255,255,.1); padding-top: 16px; a, button { width: 100%; height: 40px; padding: 0 12px; border: 0; display: flex; align-items: center; gap: 11px; color: #94aa9d; background: none; cursor: pointer; font-size: 13px; } a:hover, button:hover { color: #fff; } }
.main { min-width: 0; }.header { height: 76px; padding: 0 clamp(22px, 4vw, 54px); display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e2e7e2; > div:first-child { display: grid; gap: 3px; b { font-size: 15px; } span { color: #87918b; font-size: 11px; } } }.account { display: flex; align-items: center; gap: 10px; > span { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; color: #17382a; background: #e5eedf; font-weight: 800; } div { display: grid; } b { font-size: 12px; } small { color: #89948d; font-size: 10px; } }
.content { padding: 34px clamp(20px, 4vw, 54px) 60px; }
@media (max-width: 720px) { .shell { grid-template-columns: 68px minmax(0,1fr); }.sidebar { padding: 20px 10px; }.brand { padding: 0 5px 28px; div { display: none; } }.nav { padding: 0; justify-content: center; span { display: none; } }.sideFoot { a, button { justify-content: center; span { display: none; } } }.header { padding: 0 18px; }.account div { display: none; }.content { padding: 24px 14px 50px; } }
</style>
