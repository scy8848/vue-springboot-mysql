<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { reviewApi } from '@/api/activity'
import { formatDateTime } from '@/constants/order'
import type { Pagination, Review } from '@/types'

const props = defineProps<{ productId: number }>()
const loading = ref(true)
const reviews = ref<Review[]>([])
const summary = ref({ total: 0, average: 0 })
const pagination = ref<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
async function load(page = 1) {
  loading.value = true
  try { const result = await reviewApi.list(props.productId, { page, pageSize: 10 }); reviews.value = result.data.items; summary.value = result.data.summary; pagination.value = result.data.pagination }
  finally { loading.value = false }
}
watch(() => props.productId, () => load(1))
onMounted(() => load())
</script>

<template>
  <section :class="$style.section">
    <div :class="$style.head"><div><span>REVIEWS</span><h2>真实评价</h2></div><div :class="$style.score"><strong>{{ summary.average || '—' }}</strong><div><el-rate :model-value="summary.average" disabled allow-half /><span>来自 {{ summary.total }} 条已购评价</span></div></div></div>
    <div v-loading="loading" :class="$style.list">
      <el-empty v-if="!loading && !reviews.length" description="暂时还没有评价" />
      <article v-for="review in reviews" :key="review.id">
        <div :class="$style.user"><span>{{ (review.user.nickname || '森集会员').slice(0, 1) }}</span><div><strong>{{ review.user.nickname || '森集会员' }}</strong><small>已购 · {{ review.orderItem.skuName }}</small></div></div>
        <div :class="$style.body"><el-rate :model-value="review.rating" disabled /><p>{{ review.content }}</p><div v-if="review.images.length" :class="$style.images"><el-image v-for="image in review.images" :key="image" :src="image" :preview-src-list="review.images" fit="cover" /></div><time>{{ formatDateTime(review.createdAt) }}</time></div>
      </article>
    </div>
    <el-pagination v-if="pagination.totalPages > 1" background layout="prev, pager, next" :current-page="pagination.page" :total="pagination.total" :page-size="pagination.pageSize" @current-change="load" />
  </section>
</template>

<style module lang="scss">
.section { margin: 90px auto 0; max-width: 900px; }.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22px; > div:first-child span { color: #547260; font-size: 12px; font-weight: 800; letter-spacing: .18em; } h2 { margin: 9px 0 0; font-size: 32px; } }.score { display: flex; align-items: center; gap: 12px; > strong { color: #a64a30; font-size: 38px; } > div { display: flex; flex-direction: column; } span { margin-top: 3px; color: #87918b; font-size: 12px; } }.list { min-height: 180px; background: #fff; border: 1px solid #e0e6df; border-radius: 15px; > article { display: grid; grid-template-columns: 180px 1fr; gap: 20px; padding: 25px; border-bottom: 1px solid #ebeeea; &:last-child { border-bottom: 0; } } }.user { display: flex; align-items: center; gap: 10px; > span { width: 38px; height: 38px; display: grid; place-items: center; flex: none; color: #1c4935; background: #ddeb92; border-radius: 50%; font-weight: 750; } strong, small { display: block; } strong { font-size: 14px; } small { margin-top: 4px; color: #8a948e; font-size: 11px; } }.body { p { margin: 10px 0; color: #56635b; line-height: 1.8; } time { display: block; margin-top: 12px; color: #9ba39e; font-size: 11px; } }.images { display: flex; flex-wrap: wrap; gap: 8px; :global(.el-image) { width: 82px; height: 82px; border-radius: 8px; } }.section > :global(.el-pagination) { justify-content: center; margin-top: 25px; }
@media(max-width: 650px) { .head { align-items: center; }.score > strong { font-size: 30px; }.list > article { grid-template-columns: 1fr; gap: 13px; padding: 18px; }.user { border-bottom: 1px solid #edf0ec; padding-bottom: 12px; } }
</style>
