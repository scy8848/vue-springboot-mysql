<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, ShoppingBag, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { productApi } from '@/api/product'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { favoriteApi, historyApi } from '@/api/activity'
import ProductReviews from '@/components/review/ProductReviews.vue'
import type { ProductDetail, ProductSku } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const product = ref<ProductDetail | null>(null)
const selectedSku = ref<ProductSku | null>(null)
const quantity = ref(1)
const cart = useCartStore()
const auth = useAuthStore()
const favorited = ref(false)
const favoriteLoading = ref(false)
const images = computed(() => product.value?.images.length ? product.value.images : product.value ? [{ id: 0, url: product.value.cover, alt: product.value.name, sort: 0 }] : [])
const displayPrice = computed(() => selectedSku.value?.price ?? product.value?.price ?? 0)
const availableStock = computed(() => selectedSku.value?.stock ?? product.value?.stock ?? 0)

async function load() {
  loading.value = true
  try {
    product.value = (await productApi.detail(Number(route.params.id))).data
    selectedSku.value = product.value.skus.find((sku) => sku.stock > 0) || product.value.skus[0] || null
    if (auth.isLoggedIn) {
      favorited.value = (await favoriteApi.status(product.value.id)).data.favorited
      historyApi.record(product.value.id).catch(() => undefined)
    } else {
      const key = 'mori-guest-history'
      let history: Array<{ product: ProductDetail; viewedAt: string }> = []
      try { history = JSON.parse(localStorage.getItem(key) || '[]') } catch { history = [] }
      history = [{ product: product.value, viewedAt: new Date().toISOString() }, ...history.filter((item) => item.product.id !== product.value!.id)].slice(0, 20)
      localStorage.setItem(key, JSON.stringify(history))
    }
  } finally { loading.value = false }
}
async function toggleFavorite() {
  if (!product.value) return
  if (!auth.isLoggedIn) return router.push({ name: 'login', query: { redirect: route.fullPath } })
  favoriteLoading.value = true
  try {
    favorited.value ? await favoriteApi.remove(product.value.id) : await favoriteApi.add(product.value.id)
    favorited.value = !favorited.value
    ElMessage.success(favorited.value ? '已加入收藏' : '已取消收藏')
  } finally { favoriteLoading.value = false }
}
async function addToCart() {
  if (!product.value || !selectedSku.value) return ElMessage.warning('请选择商品规格')
  await cart.add(product.value, selectedSku.value, quantity.value)
  ElMessage.success('已加入购物袋')
}
watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <section v-loading="loading" :class="$style.page">
    <button :class="$style.back" @click="router.back()"><el-icon><ArrowLeft /></el-icon>返回商品列表</button>
    <template v-if="product">
      <div :class="$style.breadcrumb">全部好物 <span>/</span> {{ product.category.parent?.name }} <span>/</span> {{ product.category.name }}</div>
      <div :class="$style.product">
        <div :class="$style.gallery">
          <el-carousel height="min(620px, 48vw)" indicator-position="outside" :autoplay="false" arrow="always">
            <el-carousel-item v-for="image in images" :key="image.id"><img :src="image.url" :alt="image.alt || product.name" /></el-carousel-item>
          </el-carousel>
          <div :class="$style.imageNote">原创商品图 · 图片仅作展示</div>
        </div>
        <div :class="$style.info">
          <div :class="$style.topline"><span :class="$style.category">{{ product.category.name }}</span><button :disabled="favoriteLoading" @click="toggleFavorite"><el-icon><StarFilled v-if="favorited" /><Star v-else /></el-icon>{{ favorited ? '已收藏' : '收藏' }}</button></div>
          <h1>{{ product.name }}</h1>
          <p :class="$style.subtitle">{{ product.subtitle }}</p>
          <div :class="$style.price"><strong>¥{{ displayPrice.toFixed(2) }}</strong><del v-if="product.originalPrice">¥{{ product.originalPrice.toFixed(2) }}</del><span>已售 {{ product.salesCount }}</span></div>
          <div :class="$style.divider" />
          <div :class="$style.label"><b>选择款式</b><span>库存 {{ availableStock }} 件</span></div>
          <div :class="$style.skus"><button v-for="sku in product.skus" :key="sku.id" :disabled="sku.stock === 0" :class="{ [$style.selectedSku]: selectedSku?.id === sku.id }" @click="selectedSku = sku"><el-icon v-if="selectedSku?.id === sku.id"><Check /></el-icon>{{ sku.name }}<small>¥{{ sku.price }}</small></button></div>
          <div :class="$style.purchase"><el-input-number v-model="quantity" :min="1" :max="availableStock || 1" /><el-button type="primary" :icon="ShoppingBag" :disabled="availableStock === 0" @click="addToCart">加入购物袋</el-button></div>
          <ul :class="$style.assurance"><li><el-icon><Check /></el-icon>正品保障</li><li><el-icon><Check /></el-icon>7 天无理由退换</li><li><el-icon><Check /></el-icon>满 199 元免运费</li></ul>
        </div>
      </div>
      <div :class="$style.description"><span>PRODUCT STORY</span><h2>关于这件好物</h2><p>{{ product.description }}</p><div :class="$style.facts"><div><strong>精心挑选</strong><span>关注材质与耐用性</span></div><div><strong>安心售后</strong><span>问题商品快速处理</span></div><div><strong>低碳包装</strong><span>减少不必要的塑料</span></div></div></div>
      <ProductReviews :product-id="product.id" />
    </template>
  </section>
</template>

<style module lang="scss">
.page { width: min(1220px, calc(100% - 42px)); min-height: 70vh; margin: 0 auto; padding-top: 24px; }
.back { display: flex; align-items: center; gap: 6px; border: 0; padding: 8px 0; background: none; color: #6d7971; cursor: pointer; &:hover { color: var(--mori-green); } }
.breadcrumb { margin: 14px 0 28px; color: #89948e; font-size: 13px; span { margin: 0 8px; color: #c1c7c3; } }
.product { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(360px, .92fr); gap: clamp(38px, 6vw, 82px); align-items: start; }
.gallery { min-width: 0; :global(.el-carousel__container) { background: #e8eae6; border-radius: 20px; } :global(.el-carousel__item) { border-radius: 20px; } img { width: 100%; height: 100%; display: block; object-fit: cover; } }
.imageNote { margin-top: 10px; color: #9aa39d; font-size: 12px; text-align: center; }
.info { padding-top: 20px; position: sticky; top: 106px; }
.category { color: #4f705e; font-size: 13px; font-weight: 750; letter-spacing: .12em; }.info h1 { margin: 13px 0 10px; font-size: clamp(34px, 4vw, 50px); line-height: 1.15; letter-spacing: -.05em; }.subtitle { margin: 0; color: #748078; font-size: 16px; line-height: 1.7; }
.topline { display: flex; justify-content: space-between; align-items: center; button { display: flex; align-items: center; gap: 5px; border: 0; background: none; color: #526d5e; cursor: pointer; font-size: 13px; } }
.price { margin-top: 30px; display: flex; align-items: baseline; gap: 10px; strong { color: #a9472d; font-size: 30px; } del { color: #a9afab; } span { margin-left: auto; color: #88928c; font-size: 13px; } }
.divider { height: 1px; margin: 25px 0; background: #dee4dd; }.label { display: flex; justify-content: space-between; margin-bottom: 13px; b { font-size: 15px; } span { color: #89938d; font-size: 13px; } }
.skus { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; button { position: relative; min-height: 54px; display: flex; align-items: center; gap: 7px; padding: 0 14px; border: 1px solid #d9e0d9; border-radius: 10px; background: #fff; color: #455149; cursor: pointer; small { margin-left: auto; color: #8a958e; } &:disabled { opacity: .45; cursor: not-allowed; } &.selectedSku { border-color: #214d39; box-shadow: 0 0 0 1px #214d39 inset; color: #17402e; background: #f6faf5; } } }
.purchase { margin-top: 24px; display: grid; grid-template-columns: 130px 1fr; gap: 12px; :global(.el-button) { height: 50px; font-weight: 700; } }
.assurance { margin: 22px 0 0; padding: 16px 0 0; display: flex; justify-content: space-between; border-top: 1px solid #e3e8e2; color: #7a867e; font-size: 12px; list-style: none; li { display: flex; align-items: center; gap: 3px; } }
.description { margin: 100px auto 0; max-width: 900px; text-align: center; span { color: #547260; font-size: 12px; font-weight: 800; letter-spacing: .18em; } h2 { margin: 10px 0 18px; font-size: 32px; } > p { max-width: 680px; margin: 0 auto; color: #6d7972; line-height: 2; } }
.facts { margin-top: 45px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; div { padding: 22px; background: #ebf0e8; border-radius: 12px; } strong, span { display: block; } strong { margin-bottom: 7px; color: #264c3a; font-size: 15px; } span { color: #7f8b84; font-size: 12px; letter-spacing: 0; font-weight: 400; } }
@media(max-width: 800px) { .page { width: min(100% - 28px, 720px); }.product { grid-template-columns: 1fr; gap: 18px; }.gallery :global(.el-carousel__container) { height: min(90vw, 620px) !important; }.info { position: static; padding-top: 10px; }.info h1 { font-size: 34px; }.description { margin-top: 70px; }.facts { grid-template-columns: 1fr; }.assurance { gap: 8px; flex-wrap: wrap; } }
</style>
