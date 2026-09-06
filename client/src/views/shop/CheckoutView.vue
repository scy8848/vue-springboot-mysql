<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Location, ShoppingBag } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'
import { orderApi } from '@/api/order'
import { useCartStore } from '@/stores/cart'
import PaymentDialog from '@/components/order/PaymentDialog.vue'
import type { Address, Order } from '@/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const loading = ref(true)
const submitting = ref(false)
const addresses = ref<Address[]>([])
const addressId = ref<number>()
const remark = ref('')
const createdOrder = ref<Order | null>(null)
const paymentVisible = ref(false)
const requestedSkus = computed(() => String(route.query.skus || '').split(',').map(Number).filter(Number.isInteger))
const items = computed(() => cart.items.filter((item) => requestedSkus.value.includes(item.skuId) && item.available))
const total = computed(() => items.value.reduce((sum, item) => sum + item.sku.price * item.quantity, 0))
const shipping = computed(() => total.value >= 199 ? 0 : 12)
const payable = computed(() => total.value + shipping.value)

async function submit() {
  if (!addressId.value) return ElMessage.warning('请选择收货地址')
  if (!items.value.length) return ElMessage.warning('没有可结算的商品')
  submitting.value = true
  try {
    const response = await orderApi.create({ addressId: addressId.value, cartItemIds: items.value.map((item) => Number(item.id)), remark: remark.value || undefined })
    createdOrder.value = response.data
    cart.resetSession()
    await cart.bootstrap()
    paymentVisible.value = true
  } finally { submitting.value = false }
}
function finish(order?: Order) { router.replace(`/account/orders/${order?.id || createdOrder.value?.id}`) }
onMounted(async () => {
  try {
    await cart.bootstrap()
    addresses.value = (await userApi.addresses()).data
    addressId.value = addresses.value.find((item) => item.isDefault)?.id || addresses.value[0]?.id
  } finally { loading.value = false }
})
</script>

<template>
  <section v-loading="loading" :class="$style.page">
    <div :class="$style.steps"><span class="done"><i><Check /></i>购物袋</span><b /><span class="active"><i>2</i>确认订单</span><b /><span><i>3</i>完成支付</span></div>
    <div :class="$style.heading"><span>CHECKOUT</span><h1>确认订单</h1><p>检查收货信息和商品，确认无误后提交。</p></div>
    <div v-if="!loading" :class="$style.workspace">
      <div :class="$style.main">
        <section :class="$style.block">
          <div :class="$style.blockTitle"><div><el-icon><Location /></el-icon><h2>收货地址</h2></div><RouterLink to="/account/addresses">管理地址</RouterLink></div>
          <el-empty v-if="!addresses.length" description="请先添加收货地址"><el-button type="primary" @click="router.push('/account/addresses')">添加地址</el-button></el-empty>
          <div v-else :class="$style.addresses">
            <button v-for="address in addresses" :key="address.id" :class="{ [$style.selected]: addressId === address.id }" @click="addressId = address.id">
              <span :class="$style.radio"><i /></span><div><strong>{{ address.receiver }} <small>{{ address.phone }}</small></strong><p>{{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}</p></div><el-tag v-if="address.isDefault" size="small">默认</el-tag>
            </button>
          </div>
        </section>
        <section :class="$style.block">
          <div :class="$style.blockTitle"><div><el-icon><ShoppingBag /></el-icon><h2>商品清单</h2></div><RouterLink to="/cart">返回购物车</RouterLink></div>
          <el-empty v-if="!items.length" description="没有可结算的商品"><el-button @click="router.push('/cart')">返回购物车</el-button></el-empty>
          <article v-for="item in items" :key="item.id" :class="$style.line"><img :src="item.product.cover" :alt="item.product.name" /><div><h3>{{ item.product.name }}</h3><span>{{ item.sku.name }} · 数量 {{ item.quantity }}</span></div><strong>¥{{ (item.sku.price * item.quantity).toFixed(2) }}</strong></article>
        </section>
        <section :class="$style.block"><div :class="$style.blockTitle"><div><h2>订单备注</h2></div></div><el-input v-model="remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="选填：给商家的留言" /></section>
      </div>
      <aside :class="$style.summary"><span>PAYMENT SUMMARY</span><h2>费用明细</h2><div><p>商品金额 <strong>¥{{ total.toFixed(2) }}</strong></p><p>运费 <strong>{{ shipping ? `¥${shipping.toFixed(2)}` : '免运费' }}</strong></p></div><div :class="$style.total"><small>应付金额</small><strong>¥{{ payable.toFixed(2) }}</strong></div><el-button type="primary" :loading="submitting" :disabled="!addressId || !items.length" @click="submit">提交订单</el-button><p :class="$style.notice">提交即表示你同意商城交易规则。模拟支付不会产生真实扣款。</p></aside>
    </div>
    <PaymentDialog v-model="paymentVisible" :order="createdOrder" @paid="finish" @later="finish()" />
  </section>
</template>

<style module lang="scss">
.page { width: min(1180px, calc(100% - 42px)); min-height: 70vh; margin: 0 auto; padding-top: 34px; }.steps { max-width: 560px; margin: 0 auto 42px; display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: center; gap: 12px; color: #9aa39d; font-size: 13px; span { display: flex; align-items: center; gap: 7px; white-space: nowrap; } i { width: 25px; height: 25px; display: grid; place-items: center; border: 1px solid #cdd4cf; border-radius: 50%; font-style: normal; } b { height: 1px; background: #dbe1dc; } .done, .active { color: #23503b; } .done i { border-color: #315f49; background: #315f49; color: #fff; } .active i { border-color: var(--mori-lime); background: var(--mori-lime); } }
.heading { margin-bottom: 26px; > span { color: #52705f; font-size: 12px; font-weight: 800; letter-spacing: .18em; } h1 { margin: 8px 0 5px; font-size: 42px; letter-spacing: -.05em; } p { margin: 0; color: #7c8880; } }.workspace { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 26px; align-items: start; }.main { display: grid; gap: 18px; }.block { padding: 24px; background: #fff; border: 1px solid #e0e6df; border-radius: 16px; }.blockTitle { min-height: 32px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; div { display: flex; align-items: center; gap: 8px; } h2 { margin: 0; font-size: 19px; } a { color: #315c47; font-size: 13px; font-weight: 650; } }
.addresses { display: grid; gap: 10px; > button { min-height: 78px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border: 1px solid #e0e5e0; border-radius: 10px; background: #fff; text-align: left; cursor: pointer; &.selected { border-color: #28523f; box-shadow: 0 0 0 1px #28523f inset; background: #f7faf5; } strong { display: block; } small { margin-left: 10px; color: #6d7971; font-weight: 400; } p { margin: 5px 0 0; color: #7e8982; font-size: 13px; } } }.radio { width: 18px; height: 18px; display: grid; place-items: center; border: 1px solid #aab3ad; border-radius: 50%; .selected & { border-color: #28523f; } .selected & i { width: 10px; height: 10px; border-radius: 50%; background: #28523f; } }
.line { display: grid; grid-template-columns: 76px 1fr auto; align-items: center; gap: 14px; padding: 13px 0; border-top: 1px solid #edf0ec; img { width: 76px; height: 76px; object-fit: cover; border-radius: 9px; } h3 { margin: 0 0 7px; font-size: 15px; } span { color: #818b85; font-size: 12px; } strong { color: #9e432c; } }.summary { position: sticky; top: 102px; padding: 27px; color: #fff; background: #183b2c; border-radius: 16px; > span { color: #b4c5bc; font-size: 11px; font-weight: 800; letter-spacing: .14em; } h2 { margin: 8px 0 20px; font-size: 24px; } > div:not(.total) { padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,.15); p { display: flex; justify-content: space-between; color: #b6c7bd; font-size: 14px; } strong { color: #fff; font-weight: 500; } } > :global(.el-button) { width: 100%; height: 48px; margin-top: 22px; color: #173a2b; background: var(--mori-lime); border-color: var(--mori-lime); font-weight: 750; } }.total { padding-top: 20px; display: flex; align-items: baseline; justify-content: space-between; small { color: #c0cfc7; } strong { color: #e9f58c; font-size: 28px; } }.notice { color: #9fb2a8; font-size: 11px; line-height: 1.6; text-align: center; }
@media(max-width: 820px) { .page { width: min(100% - 28px, 760px); }.workspace { grid-template-columns: 1fr; }.summary { position: static; }.heading h1 { font-size: 34px; } }.payment-dialog :global(.el-dialog__header) { padding: 0; }
</style>
