<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { favoriteApi, historyApi } from '@/api/activity'
import { formatDateTime } from '@/constants/order'
import type { ProductActivity } from '@/types'

const route = useRoute()
const mode = computed(() => route.name === 'favorites' ? 'favorites' : 'history')
const title = computed(() => mode.value === 'favorites' ? '我的收藏' : '浏览历史')
const eyebrow = computed(() => mode.value === 'favorites' ? 'FAVORITES' : 'RECENTLY VIEWED')
const description = computed(() => mode.value === 'favorites' ? '把心动好物留在这里，随时回来看看。' : '最近浏览的 50 件商品，重新发现错过的选择。')
const items = ref<ProductActivity[]>([])
const loading = ref(true)
async function load() { loading.value = true; try { items.value = mode.value === 'favorites' ? (await favoriteApi.list()).data : (await historyApi.list()).data } finally { loading.value = false } }
async function remove(item: ProductActivity) {
  mode.value === 'favorites' ? await favoriteApi.remove(item.product.id) : await historyApi.remove(item.product.id)
  items.value = items.value.filter((row) => row.product.id !== item.product.id)
  ElMessage.success(mode.value === 'favorites' ? '已取消收藏' : '记录已删除')
}
async function clear() {
  await ElMessageBox.confirm('确定清空全部浏览记录吗？', '清空记录', { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' })
  await historyApi.clear(); items.value = []; ElMessage.success('浏览记录已清空')
}
watch(() => route.name, load)
onMounted(load)
</script>

<template>
  <section>
    <div :class="$style.heading"><div><span>{{ eyebrow }}</span><h1>{{ title }}</h1><p>{{ description }}</p></div><el-button v-if="mode === 'history' && items.length" plain :icon="Delete" @click="clear">清空记录</el-button></div>
    <div v-loading="loading" :class="$style.grid">
      <el-empty v-if="!loading && !items.length" :description="mode === 'favorites' ? '还没有收藏商品' : '暂无浏览记录'"><el-button type="primary" @click="$router.push('/products')">去逛逛</el-button></el-empty>
      <article v-for="item in items" :key="item.id" :class="$style.card">
        <RouterLink :to="`/products/${item.product.id}`" :class="$style.image"><img :src="item.product.cover" :alt="item.product.name" loading="lazy" /></RouterLink>
        <div :class="$style.body"><span>{{ item.product.category.name }}</span><RouterLink :to="`/products/${item.product.id}`"><h2>{{ item.product.name }}</h2></RouterLink><p>{{ item.product.subtitle }}</p><div><strong>¥{{ item.product.price.toFixed(2) }}</strong><time>{{ formatDateTime(item.viewedAt || item.createdAt || null) }}</time></div></div>
        <button :class="$style.remove" :aria-label="mode === 'favorites' ? '取消收藏' : '删除记录'" @click="remove(item)"><el-icon><Delete /></el-icon></button>
      </article>
    </div>
  </section>
</template>

<style module lang="scss">
.heading { display: flex; justify-content: space-between; align-items: flex-end; margin: 2px 2px 26px; span { color: #50715f; font-size: 12px; letter-spacing: .18em; font-weight: 800; } h1 { margin: 8px 0 6px; font-size: 34px; letter-spacing: -.04em; } p { margin: 0; color: #758079; } }.grid { min-height: 300px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }.card { position: relative; overflow: hidden; background: #fff; border: 1px solid #e0e6df; border-radius: 14px; transition: .2s; &:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(24,55,41,.08); } }.image { display: block; aspect-ratio: 1; overflow: hidden; background: #eceeea; img { width: 100%; height: 100%; display: block; object-fit: cover; transition: .3s; } }.card:hover .image img { transform: scale(1.025); }.body { padding: 15px; > span { color: #7d8e84; font-size: 11px; } h2 { margin: 5px 0; font-size: 16px; } > p { height: 37px; overflow: hidden; margin: 0; color: #7e8982; font-size: 12px; line-height: 1.55; } > div { margin-top: 12px; display: flex; justify-content: space-between; align-items: baseline; } strong { color: #a44930; font-size: 18px; } time { color: #9aa29d; font-size: 10px; } }.remove { position: absolute; top: 10px; right: 10px; width: 31px; height: 31px; display: grid; place-items: center; border: 0; border-radius: 50%; color: #5f6b64; background: rgba(255,255,255,.9); cursor: pointer; &:hover { color: #a14630; } }
@media(max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } } @media(max-width: 520px) { .grid { gap: 10px; }.body time { display: none; }.heading p { max-width: 250px; }.heading > :global(.el-button) { align-self: center; } }
</style>
