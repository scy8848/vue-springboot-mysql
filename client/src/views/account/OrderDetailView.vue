<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Location, Tickets } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api/order'
import PaymentDialog from '@/components/order/PaymentDialog.vue'
import ReviewDialog from '@/components/review/ReviewDialog.vue'
import { formatDateTime, orderStatusLabel, orderStatusType } from '@/constants/order'
import type { Order, OrderItem } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref<Order | null>(null)
const paymentVisible = ref(false)
const reviewVisible = ref(false)
const reviewingItem = ref<OrderItem | null>(null)
const step = computed(() => {
  if (!order.value) return 0
  return { PENDING_PAYMENT: 1, PENDING_SHIPMENT: 2, SHIPPED: 3, COMPLETED: 4, CANCELLED: 1 }[order.value.status]
})
async function load() { loading.value = true; try { order.value = (await orderApi.detail(Number(route.params.id))).data } finally { loading.value = false } }
async function cancel() {
  if (!order.value) return
  await ElMessageBox.confirm('取消后库存将释放，确定取消该订单吗？', '取消订单', { confirmButtonText: '确认取消', cancelButtonText: '暂不取消', type: 'warning' })
  order.value = (await orderApi.cancel(order.value.id)).data; ElMessage.success('订单已取消')
}
async function confirm() {
  if (!order.value) return
  await ElMessageBox.confirm('请确认已经收到商品。', '确认收货', { confirmButtonText: '已收到', cancelButtonText: '暂不确认', type: 'success' })
  order.value = (await orderApi.confirmReceipt(order.value.id)).data; ElMessage.success('已确认收货')
}
function review(item: OrderItem) { reviewingItem.value = item; reviewVisible.value = true }
onMounted(load)
</script>

<template>
  <section v-loading="loading" :class="$style.page">
    <button :class="$style.back" @click="router.push('/account/orders')"><el-icon><ArrowLeft /></el-icon>返回订单列表</button>
    <template v-if="order">
      <div :class="$style.hero"><div><span>ORDER DETAIL</span><h1>{{ orderStatusLabel[order.status] }}</h1><p>订单号 {{ order.orderNo }}</p></div><el-tag :type="orderStatusType[order.status]" effect="dark" size="large">{{ orderStatusLabel[order.status] }}</el-tag></div>
      <div v-if="order.status === 'CANCELLED'" :class="$style.cancelled">该订单已于 {{ formatDateTime(order.cancelledAt) }} 取消，商品库存已经释放。</div>
      <el-steps v-else :active="step" finish-status="success" align-center :class="$style.steps"><el-step title="提交订单" :description="formatDateTime(order.createdAt)" /><el-step title="付款成功" :description="formatDateTime(order.paidAt)" /><el-step title="商品发货" :description="formatDateTime(order.shippedAt)" /><el-step title="交易完成" :description="formatDateTime(order.completedAt)" /></el-steps>
      <div :class="$style.actions"><el-button v-if="order.status === 'PENDING_PAYMENT'" @click="cancel">取消订单</el-button><el-button v-if="order.status === 'PENDING_PAYMENT'" type="primary" @click="paymentVisible = true">立即付款</el-button><el-button v-if="order.status === 'SHIPPED'" type="primary" @click="confirm">确认收货</el-button></div>
      <div :class="$style.grid">
        <section :class="$style.block"><div :class="$style.title"><el-icon><Tickets /></el-icon><h2>商品信息</h2></div><article v-for="item in order.items" :key="item.id" :class="$style.item"><img :src="item.image" :alt="item.productName" /><div><RouterLink v-if="item.productId" :to="`/products/${item.productId}`"><strong>{{ item.productName }}</strong></RouterLink><strong v-else>{{ item.productName }}</strong><span>{{ item.skuName }} · {{ Object.entries(item.specs).map(([key, value]) => `${key}：${value}`).join(' / ') }}</span><small>¥{{ item.price.toFixed(2) }} × {{ item.quantity }}</small><el-button v-if="order.status === 'COMPLETED' && !item.review" size="small" plain @click="review(item)">评价商品</el-button><em v-else-if="item.review">已评价</em></div><b>¥{{ item.subtotal.toFixed(2) }}</b></article></section>
        <section :class="$style.block"><div :class="$style.title"><el-icon><Location /></el-icon><h2>配送信息</h2></div><dl><dt>收货人</dt><dd>{{ order.receiver }}　{{ order.phone }}</dd><dt>收货地址</dt><dd>{{ order.province }} {{ order.city }} {{ order.district }} {{ order.addressDetail }}</dd><dt>订单备注</dt><dd>{{ order.remark || '无' }}</dd></dl></section>
      </div>
      <section :class="$style.bill"><div><span>商品金额</span><strong>¥{{ order.totalAmount.toFixed(2) }}</strong></div><div><span>运费</span><strong>{{ order.shippingFee ? `¥${order.shippingFee.toFixed(2)}` : '免运费' }}</strong></div><div class="total"><span>实付金额</span><strong>¥{{ order.payableAmount.toFixed(2) }}</strong></div></section>
      <PaymentDialog v-model="paymentVisible" :order="order" @paid="(paid) => order = paid" />
      <ReviewDialog v-model="reviewVisible" :item="reviewingItem" @submitted="load" />
    </template>
  </section>
</template>

<style module lang="scss">
.page { min-height: 500px; }.back { display: flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: #6f7b73; cursor: pointer; }.hero { margin: 26px 0 24px; display: flex; justify-content: space-between; align-items: center; span { color: #50715f; font-size: 12px; letter-spacing: .18em; font-weight: 800; } h1 { margin: 8px 0 5px; font-size: 36px; letter-spacing: -.04em; } p { margin: 0; color: #7d8881; font-size: 13px; } }.cancelled { padding: 18px 20px; margin-bottom: 18px; color: #777f7a; background: #e9ece8; border-radius: 12px; }.steps { margin: 0 0 20px; padding: 28px 12px 24px; background: #fff; border: 1px solid #e1e6e0; border-radius: 15px; }.actions { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 18px; }.grid { display: grid; grid-template-columns: 1.35fr .65fr; gap: 18px; }.block { padding: 23px; background: #fff; border: 1px solid #e1e6e0; border-radius: 15px; }.title { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; h2 { margin: 0; font-size: 18px; } }.item { display: grid; grid-template-columns: 76px 1fr auto; align-items: center; gap: 13px; padding: 13px 0; border-top: 1px solid #edf0ec; img { width: 76px; height: 76px; object-fit: cover; border-radius: 9px; } strong, span, small { display: block; } strong { margin-bottom: 5px; font-size: 14px; } span, small { color: #848f88; font-size: 12px; } small { margin: 5px 0; } em { color: #71877b; font-size: 12px; font-style: normal; } b { color: #9d422c; } }.block dl { margin: 0; display: grid; grid-template-columns: 72px 1fr; gap: 14px 12px; padding-top: 14px; border-top: 1px solid #edf0ec; font-size: 13px; line-height: 1.65; dt { color: #89938d; } dd { margin: 0; color: #4f5c54; } }.bill { width: min(380px, 100%); margin: 18px 0 0 auto; padding: 22px 25px; background: #183b2c; color: #fff; border-radius: 15px; div { display: flex; justify-content: space-between; padding: 8px 0; color: #b8c8bf; } strong { color: #fff; font-weight: 500; } :global(.total) { margin-top: 8px; padding-top: 17px; border-top: 1px solid rgba(255,255,255,.16); align-items: baseline; strong { color: #e9f58c; font-size: 25px; } } }
@media(max-width: 760px) { .grid { grid-template-columns: 1fr; }.steps { overflow-x: auto; }.steps :global(.el-steps) { min-width: 600px; }.hero h1 { font-size: 31px; }.hero > :global(.el-tag) { display: none; }.item { grid-template-columns: 66px 1fr auto; }.item img { width: 66px; height: 66px; } }
</style>
