<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaymentDialog from '@/components/order/PaymentDialog.vue'
import { orderApi } from '@/api/order'
import { orderStatusLabel, orderStatusType, formatDateTime } from '@/constants/order'
import type { Order, OrderStatus, Pagination } from '@/types'

const tabs: Array<{ label: string; value: '' | OrderStatus }> = [
  { label: '全部', value: '' }, { label: '待付款', value: 'PENDING_PAYMENT' }, { label: '待发货', value: 'PENDING_SHIPMENT' },
  { label: '待收货', value: 'SHIPPED' }, { label: '已完成', value: 'COMPLETED' }, { label: '已取消', value: 'CANCELLED' },
]
const active = ref<'' | OrderStatus>('')
const loading = ref(true)
const orders = ref<Order[]>([])
const pagination = ref<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
const payingOrder = ref<Order | null>(null)
const paymentVisible = ref(false)
async function load(page = 1) {
  loading.value = true
  try { const result = await orderApi.list({ page, pageSize: 10, status: active.value || undefined }); orders.value = result.data.items; pagination.value = result.data.pagination }
  finally { loading.value = false }
}
function openPay(order: Order) { payingOrder.value = order; paymentVisible.value = true }
async function cancel(order: Order) {
  await ElMessageBox.confirm('取消后库存将释放，确定取消该订单吗？', '取消订单', { confirmButtonText: '确认取消', cancelButtonText: '暂不取消', type: 'warning' })
  await orderApi.cancel(order.id); ElMessage.success('订单已取消'); await load(pagination.value.page)
}
async function confirm(order: Order) {
  await ElMessageBox.confirm('请确认已经收到商品。确认后订单将完成。', '确认收货', { confirmButtonText: '已收到', cancelButtonText: '暂不确认', type: 'success' })
  await orderApi.confirmReceipt(order.id); ElMessage.success('已确认收货'); await load(pagination.value.page)
}
function paid(updated: Order) { const index = orders.value.findIndex((item) => item.id === updated.id); if (index >= 0) orders.value[index] = updated }
onMounted(() => load())
</script>

<template>
  <section>
    <div :class="$style.heading"><div><span>ORDERS</span><h1>我的订单</h1><p>查看订单进度，处理待办事项。</p></div><RouterLink to="/products">继续购物 →</RouterLink></div>
    <el-tabs v-model="active" :class="$style.tabs" @tab-change="() => load(1)"><el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value" /></el-tabs>
    <div v-loading="loading" :class="$style.list">
      <el-empty v-if="!loading && !orders.length" description="当前分类还没有订单"><el-button @click="$router.push('/products')">去逛逛</el-button></el-empty>
      <article v-for="order in orders" :key="order.id" :class="$style.order">
        <header><div><span>{{ formatDateTime(order.createdAt) }}</span><b>订单号 {{ order.orderNo }}</b></div><el-tag :type="orderStatusType[order.status]" effect="light">{{ orderStatusLabel[order.status] }}</el-tag></header>
        <div :class="$style.body"><div :class="$style.products"><div v-for="item in order.items.slice(0, 3)" :key="item.id" :class="$style.product"><img :src="item.image" :alt="item.productName" /><div><strong>{{ item.productName }}</strong><span>{{ item.skuName }} × {{ item.quantity }}</span></div></div><span v-if="order.items.length > 3">另有 {{ order.items.length - 3 }} 件商品</span></div><div :class="$style.amount"><span>共 {{ order.items.reduce((sum, item) => sum + item.quantity, 0) }} 件</span><strong>¥{{ order.payableAmount.toFixed(2) }}</strong></div></div>
        <footer><RouterLink :to="`/account/orders/${order.id}`">订单详情</RouterLink><el-button v-if="order.status === 'PENDING_PAYMENT'" @click="cancel(order)">取消订单</el-button><el-button v-if="order.status === 'PENDING_PAYMENT'" type="primary" @click="openPay(order)">立即付款</el-button><el-button v-if="order.status === 'SHIPPED'" type="primary" @click="confirm(order)">确认收货</el-button></footer>
      </article>
    </div>
    <el-pagination v-if="pagination.totalPages > 1" background layout="prev, pager, next" :current-page="pagination.page" :total="pagination.total" :page-size="pagination.pageSize" @current-change="load" />
    <PaymentDialog v-model="paymentVisible" :order="payingOrder" @paid="paid" @later="payingOrder = null" />
  </section>
</template>

<style module lang="scss">
.heading { display: flex; justify-content: space-between; align-items: flex-end; margin: 2px 2px 22px; span { color: #50715f; font-size: 12px; letter-spacing: .18em; font-weight: 800; } h1 { margin: 8px 0 6px; font-size: 34px; letter-spacing: -.04em; } p { margin: 0; color: #758079; } > a { color: #285440; font-size: 14px; font-weight: 700; } }.tabs { margin-bottom: 17px; }.list { min-height: 300px; display: grid; gap: 14px; }.order { overflow: hidden; background: #fff; border: 1px solid #e0e6df; border-radius: 15px; header { min-height: 52px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; background: #f8f9f6; border-bottom: 1px solid #e9ede8; div { display: flex; gap: 18px; color: #7c8780; font-size: 12px; } b { color: #59665e; font-weight: 500; } } footer { min-height: 58px; padding: 0 20px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; border-top: 1px solid #edf0ec; > a { margin-right: auto; color: #315d48; font-size: 13px; font-weight: 650; } } }.body { padding: 18px 20px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }.products { min-width: 0; display: flex; align-items: center; gap: 14px; > span { color: #8a948e; font-size: 12px; } }.product { width: min(210px, 31%); display: flex; align-items: center; gap: 10px; img { width: 56px; height: 56px; flex: none; object-fit: cover; border-radius: 8px; } div { min-width: 0; } strong, span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } strong { margin-bottom: 5px; font-size: 13px; } span { color: #88928c; font-size: 11px; } }.amount { min-width: 105px; text-align: right; span, strong { display: block; } span { color: #8a948e; font-size: 11px; } strong { margin-top: 4px; color: #9d422b; font-size: 19px; } }
section > :global(.el-pagination) { justify-content: center; margin-top: 30px; }
@media(max-width: 700px) { .heading > a { display: none; }.products { display: grid; }.product { width: 100%; }.product:nth-child(n+2) { display: none; }.body { padding: 14px; }.order header { padding: 0 14px; }.order header b { display: none; }.order footer { padding: 0 12px; } }
</style>
