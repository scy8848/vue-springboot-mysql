<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Delete, ShoppingBag } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { CartLine } from '@/types'

const cart = useCartStore()
const auth = useAuthStore()
const router = useRouter()
const loading = ref(true)
const selectedIds = ref<Array<number | string>>([])
const updating = ref<Array<number | string>>([])
const availableItems = computed(() => cart.items.filter((item) => item.available))
const selectedItems = computed(() => cart.items.filter((item) => selectedIds.value.includes(item.id) && item.available))
const allSelected = computed({
  get: () => availableItems.value.length > 0 && availableItems.value.every((item) => selectedIds.value.includes(item.id)),
  set: (checked: boolean) => { selectedIds.value = checked ? availableItems.value.map((item) => item.id) : [] },
})
const selectedCount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0))
const total = computed(() => selectedItems.value.reduce((sum, item) => sum + item.sku.price * item.quantity, 0))
const shipping = computed(() => total.value >= 199 || total.value === 0 ? 0 : 12)
const payable = computed(() => total.value + shipping.value)

async function changeQuantity(item: CartLine, value: number | undefined) {
  if (!value || updating.value.includes(item.id)) return
  updating.value.push(item.id)
  try { await cart.setQuantity(item, value) }
  finally { updating.value = updating.value.filter((id) => id !== item.id) }
}
async function remove(item: CartLine) {
  await ElMessageBox.confirm(`确定移除“${item.product.name}”吗？`, '移除商品', { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' })
  await cart.remove(item)
  selectedIds.value = selectedIds.value.filter((id) => id !== item.id)
  ElMessage.success('商品已移除')
}
async function clearSelected() {
  if (!selectedIds.value.length) return ElMessage.info('请先选择商品')
  await ElMessageBox.confirm(`确定移除选中的 ${selectedItems.value.length} 件商品吗？`, '批量移除', { confirmButtonText: '移除', cancelButtonText: '取消', type: 'warning' })
  for (const item of [...selectedItems.value]) await cart.remove(item)
  selectedIds.value = []
  ElMessage.success('已移除选中商品')
}
async function clearAll() {
  if (!cart.items.length) return
  await ElMessageBox.confirm('确定清空整个购物车吗？', '清空购物车', { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' })
  await cart.clear(); selectedIds.value = []; ElMessage.success('购物车已清空')
}
function checkout() {
  if (!selectedIds.value.length) return ElMessage.info('请先选择要结算的商品')
  const target = `/checkout?skus=${selectedItems.value.map((item) => item.skuId).join(',')}`
  if (!auth.isLoggedIn) router.push({ name: 'login', query: { redirect: target } })
  else router.push(target)
}
watch(() => cart.items.map((item) => item.id).join(','), () => { selectedIds.value = selectedIds.value.filter((id) => cart.items.some((item) => item.id === id)) })
onMounted(async () => {
  try { await cart.bootstrap(); selectedIds.value = availableItems.value.map((item) => item.id) }
  finally { loading.value = false }
})
</script>

<template>
  <section :class="$style.page">
    <div :class="$style.heading"><div><span>SHOPPING BAG</span><h1>我的购物袋</h1><p>已为你保留 {{ cart.totalCount }} 件好物</p></div><RouterLink to="/products">继续逛逛 →</RouterLink></div>
    <div v-loading="loading" :class="$style.workspace">
      <div :class="$style.listPanel">
        <div v-if="cart.items.length" :class="$style.listHead"><el-checkbox v-model="allSelected">全选（{{ cart.items.length }}）</el-checkbox><div><button @click="clearSelected">删除选中</button><button @click="clearAll">清空购物车</button></div></div>
        <el-empty v-if="!loading && !cart.items.length" description="购物袋还是空的"><el-button type="primary" @click="$router.push('/products')">去挑选好物</el-button></el-empty>
        <article v-for="item in cart.items" :key="item.id" :class="[$style.line, { [$style.unavailable]: !item.available }]">
          <el-checkbox v-model="selectedIds" :label="item.id" :disabled="!item.available"><span class="sr-only">选择 {{ item.product.name }}</span></el-checkbox>
          <RouterLink :to="`/products/${item.productId}`" :class="$style.image"><img :src="item.product.cover" :alt="item.product.name" /></RouterLink>
          <div :class="$style.info"><RouterLink :to="`/products/${item.productId}`"><h2>{{ item.product.name }}</h2></RouterLink><p>{{ item.product.subtitle }}</p><div :class="$style.spec"><span v-for="(value, key) in item.sku.specs" :key="key">{{ key }}：{{ value }}</span></div><el-tag v-if="!item.available" type="info">已失效</el-tag><el-tag v-else-if="item.sku.stock <= 5" type="warning">仅剩 {{ item.sku.stock }} 件</el-tag></div>
          <div :class="$style.unitPrice">¥{{ item.sku.price.toFixed(2) }}</div>
          <el-input-number :model-value="item.quantity" :min="1" :max="item.sku.stock" :disabled="!item.available || updating.includes(item.id)" size="small" @change="(value?: number) => changeQuantity(item, value)" />
          <div :class="$style.subtotal">¥{{ (item.sku.price * item.quantity).toFixed(2) }}</div>
          <el-button text circle :icon="Delete" aria-label="移除商品" @click="remove(item)" />
        </article>
      </div>

      <aside :class="$style.summary">
        <div :class="$style.summaryIcon"><el-icon><ShoppingBag /></el-icon></div><h2>订单小计</h2>
        <div :class="$style.row"><span>已选 {{ selectedCount }} 件</span><strong>¥{{ total.toFixed(2) }}</strong></div>
        <div :class="$style.row"><span>运费</span><strong>{{ shipping ? `¥${shipping.toFixed(2)}` : '免运费' }}</strong></div>
        <div v-if="total > 0 && total < 199" :class="$style.shippingTip">再选 ¥{{ (199 - total).toFixed(2) }} 即可免运费</div>
        <div :class="$style.total"><span>合计</span><strong>¥{{ payable.toFixed(2) }}</strong></div>
        <el-button type="primary" :disabled="!selectedIds.length" @click="checkout">去结算</el-button>
        <p>结算前可继续调整数量，商品价格和库存以提交订单时为准。</p>
      </aside>
    </div>
  </section>
</template>

<style module lang="scss">
.page { width: min(1240px, calc(100% - 42px)); min-height: 68vh; margin: 0 auto; padding-top: 52px; }
.heading { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; span { color: #52705f; font-size: 12px; font-weight: 800; letter-spacing: .18em; } h1 { margin: 8px 0 5px; font-size: clamp(34px, 4vw, 50px); letter-spacing: -.05em; } p { margin: 0; color: #7b867f; } > a { color: #27543f; font-weight: 700; } }
.workspace { min-height: 300px; display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 26px; align-items: start; }
.listPanel { min-width: 0; overflow: hidden; background: #fff; border: 1px solid #e0e6df; border-radius: 16px; }
.listHead { min-height: 58px; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; border-bottom: 1px solid #e6eae5; div { display: flex; gap: 16px; } button { border: 0; background: none; color: #748078; cursor: pointer; &:hover { color: #a34731; } } }
.line { display: grid; grid-template-columns: auto 118px minmax(180px, 1fr) 90px 110px 100px auto; gap: 16px; align-items: center; padding: 22px; border-bottom: 1px solid #edf0ec; &:last-child { border-bottom: 0; } &.unavailable { opacity: .58; background: #f6f7f5; } }
.image { width: 118px; aspect-ratio: 1; overflow: hidden; border-radius: 10px; background: #eceeea; img { width: 100%; height: 100%; object-fit: cover; display: block; } }
.info { min-width: 0; h2 { margin: 0 0 5px; font-size: 17px; } p { margin: 0 0 8px; overflow: hidden; color: #87918b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; } }.spec { display: flex; gap: 8px; color: #647069; font-size: 13px; }.unitPrice { color: #66736a; font-size: 14px; }.subtotal { color: #9e412a; font-size: 16px; font-weight: 750; }
.summary { position: sticky; top: 102px; padding: 27px; background: #183b2c; color: #fff; border-radius: 16px; box-shadow: 0 18px 40px rgba(24,59,44,.15); h2 { margin: 13px 0 24px; font-size: 23px; } > :global(.el-button) { width: 100%; height: 49px; margin-top: 22px; color: #173a2b; background: var(--mori-lime); border-color: var(--mori-lime); font-weight: 750; } > p { margin: 15px 0 0; color: #9fb3a8; font-size: 12px; line-height: 1.6; } }
.summaryIcon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; color: #193c2d; background: var(--mori-lime); font-size: 20px; }.row { display: flex; justify-content: space-between; padding: 10px 0; color: #b9c9c0; font-size: 14px; strong { color: #fff; font-weight: 500; } }.shippingTip { margin: 10px 0; padding: 10px 12px; color: #dce9a0; background: rgba(215,236,120,.1); border-radius: 8px; font-size: 12px; }.total { display: flex; align-items: baseline; justify-content: space-between; margin-top: 16px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.16); strong { color: #e9f58c; font-size: 28px; } }
@media(max-width: 980px) { .workspace { grid-template-columns: 1fr; }.summary { position: static; }.line { grid-template-columns: auto 92px minmax(150px, 1fr) 100px auto; }.image { width: 92px; }.unitPrice { display: none; }.subtotal { grid-column: 4; grid-row: 2; } }
@media(max-width: 640px) { .page { width: min(100% - 24px, 600px); padding-top: 34px; }.heading { align-items: center; }.heading > a { font-size: 13px; }.line { grid-template-columns: auto 82px 1fr auto; gap: 10px; padding: 16px 12px; }.image { width: 82px; }.line > :global(.el-input-number) { grid-column: 3; width: 105px; }.subtotal { grid-column: 4; grid-row: 2; }.info p { display: none; }.listHead { padding: 0 14px; }.listHead div button:first-child { display: none; } }
</style>
