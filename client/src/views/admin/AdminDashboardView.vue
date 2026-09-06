<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ShoppingCart, Money, User, Goods } from '@element-plus/icons-vue'
import { adminApi } from '@/api/admin'
import { orderStatusLabel } from '@/constants/order'
import type { AdminStats, OrderStatus } from '@/types'

const loading = ref(true)
const stats = ref<AdminStats | null>(null)
const cards = computed(() => stats.value ? [
  { label: '累计订单', value: stats.value.orderCount.toLocaleString(), hint: '全站订单总量', icon: ShoppingCart, tone: 'green' },
  { label: '成交金额', value: `¥${stats.value.salesAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, hint: '已支付订单金额', icon: Money, tone: 'orange' },
  { label: '注册用户', value: stats.value.userCount.toLocaleString(), hint: '普通会员数量', icon: User, tone: 'blue' },
  { label: '在售商品', value: stats.value.activeProductCount.toLocaleString(), hint: '当前上架商品', icon: Goods, tone: 'lime' },
] : [])
const statusOrder: OrderStatus[] = ['PENDING_PAYMENT', 'PENDING_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CANCELLED']
const maxStatus = computed(() => Math.max(1, ...statusOrder.map((key) => stats.value?.orderStatus[key] || 0)))
onMounted(async () => { try { stats.value = (await adminApi.stats()).data } finally { loading.value = false } })
</script>

<template>
  <section v-loading="loading">
    <div :class="$style.heading"><div><span>OVERVIEW</span><h1>经营概览</h1><p>从关键数字开始，快速处理今日商城事务。</p></div><div :class="$style.date">实时数据</div></div>
    <div :class="$style.cards"><article v-for="card in cards" :key="card.label"><div :class="[$style.icon, $style[card.tone]]"><el-icon><component :is="card.icon" /></el-icon></div><div><span>{{ card.label }}</span><strong>{{ card.value }}</strong><small>{{ card.hint }}</small></div></article></div>
    <div :class="$style.grid">
      <article :class="$style.panel"><header><div><h2>订单状态分布</h2><p>各环节当前订单数量</p></div><RouterLink to="/admin/orders">管理订单 →</RouterLink></header><div :class="$style.bars"><div v-for="status in statusOrder" :key="status"><div><span>{{ orderStatusLabel[status] }}</span><b>{{ stats?.orderStatus[status] || 0 }}</b></div><i><span :style="{ width: `${((stats?.orderStatus[status] || 0) / maxStatus) * 100}%` }" /></i></div></div></article>
      <aside :class="$style.quick"><span>QUICK ACTIONS</span><h2>常用操作</h2><RouterLink to="/admin/products"><b>新增或编辑商品</b><small>维护价格、库存与上架状态</small></RouterLink><RouterLink to="/admin/orders"><b>处理待发货订单</b><small>确认订单并更新履约进度</small></RouterLink><RouterLink to="/admin/users"><b>查看用户账户</b><small>管理异常或受限账户</small></RouterLink></aside>
    </div>
  </section>
</template>

<style module lang="scss">
.heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 26px; span { color: #5f7d6c; font-size: 11px; letter-spacing: .2em; font-weight: 800; } h1 { margin: 8px 0 6px; font-size: 32px; letter-spacing: -.04em; } p { margin: 0; color: #7a867f; font-size: 14px; } }.date { padding: 8px 12px; border: 1px solid #dce4dd; border-radius: 9px; color: #637168; background: #fff; font-size: 12px; }
.cards { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 15px; article { min-width: 0; padding: 22px 19px; display: flex; align-items: flex-start; gap: 14px; border: 1px solid #e0e6e0; border-radius: 15px; background: #fff; } article > div:last-child { min-width: 0; display: grid; } span { color: #7d8982; font-size: 12px; } strong { margin: 7px 0 5px; overflow: hidden; text-overflow: ellipsis; color: #1a2921; font-size: 24px; letter-spacing: -.03em; } small { color: #a0a9a3; font-size: 10px; } }.icon { width: 39px; height: 39px; flex: none; display: grid; place-items: center; border-radius: 11px; font-size: 18px; }.green { background: #e5f0e8; color: #316448; }.orange { background: #f8e9dd; color: #a05230; }.blue { background: #e4ecf5; color: #42678b; }.lime { background: #eef4cd; color: #687b23; }
.grid { margin-top: 18px; display: grid; grid-template-columns: minmax(0,1.7fr) minmax(260px,.8fr); gap: 18px; }.panel, .quick { padding: 25px; border: 1px solid #e0e6e0; border-radius: 16px; background: #fff; }.panel header { display: flex; justify-content: space-between; h2 { margin: 0 0 5px; font-size: 18px; } p { margin: 0; color: #929c96; font-size: 12px; } a { color: #315d47; font-size: 12px; font-weight: 700; } }.bars { margin-top: 28px; display: grid; gap: 18px; > div > div { margin-bottom: 7px; display: flex; justify-content: space-between; font-size: 12px; b { color: #36443c; } } i { height: 7px; display: block; overflow: hidden; border-radius: 5px; background: #edf0ed; span { height: 100%; min-width: 3px; display: block; border-radius: inherit; background: #386b51; } } }.quick { color: #fff; background: #183d2d; border-color: #183d2d; > span { color: #a4b9ac; font-size: 10px; letter-spacing: .18em; } h2 { margin: 7px 0 19px; font-size: 19px; } a { padding: 13px 0; display: grid; border-top: 1px solid rgba(255,255,255,.1); b { font-size: 13px; } small { margin-top: 4px; color: #9fb3a7; font-size: 10px; } } }
@media(max-width: 1050px) { .cards { grid-template-columns: repeat(2,1fr); } } @media(max-width: 700px) { .grid { grid-template-columns: 1fr; }.heading p, .date { display: none; } } @media(max-width: 460px) { .cards { grid-template-columns: 1fr; } }
</style>
