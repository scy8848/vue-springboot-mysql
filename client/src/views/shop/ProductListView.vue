<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Filter, RefreshRight } from '@element-plus/icons-vue'
import { productApi, type ProductQuery } from '@/api/product'
import type { Category, Pagination, Product } from '@/types'

const route = useRoute()
const router = useRouter()
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const loading = ref(true)
const pagination = ref<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
const filters = reactive({ minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined as number | undefined, maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined as number | undefined })
const query = computed<ProductQuery>(() => ({
  page: Number(route.query.page || 1), pageSize: 20, keyword: String(route.query.keyword || '') || undefined,
  categoryId: route.query.categoryId ? Number(route.query.categoryId) : undefined,
  minPrice: route.query.minPrice ? Number(route.query.minPrice) : undefined, maxPrice: route.query.maxPrice ? Number(route.query.maxPrice) : undefined,
  sort: (route.query.sort as ProductQuery['sort']) || 'default',
}))
const activeCategory = computed(() => Number(route.query.categoryId || 0))
const currentLabel = computed(() => {
  if (query.value.keyword) return `“${query.value.keyword}” 的搜索结果`
  for (const parent of categories.value) {
    if (parent.id === activeCategory.value) return parent.name
    const child = parent.children?.find((item) => item.id === activeCategory.value)
    if (child) return child.name
  }
  return '全部好物'
})

function changeQuery(values: Record<string, string | number | undefined>) {
  router.push({ name: 'products', query: { ...route.query, ...values, page: values.page || undefined } })
}
function chooseCategory(id?: number) { changeQuery({ categoryId: id, page: undefined }) }
function applyPrice() { changeQuery({ minPrice: filters.minPrice, maxPrice: filters.maxPrice, page: undefined }) }
function resetFilters() { filters.minPrice = undefined; filters.maxPrice = undefined; changeQuery({ categoryId: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined, page: undefined }) }
async function load() {
  loading.value = true
  try { const response = await productApi.list(query.value); products.value = response.data.items; pagination.value = response.data.pagination }
  finally { loading.value = false }
}
watch(() => route.fullPath, load)
onMounted(async () => { categories.value = (await productApi.categories()).data; await load() })
</script>

<template>
  <section :class="$style.page">
    <div :class="$style.categoryBar">
      <button :class="{ [$style.activeCat]: !activeCategory }" @click="chooseCategory()">全部</button>
      <div v-for="parent in categories" :key="parent.id" :class="$style.categoryGroup">
        <button :class="{ [$style.activeCat]: activeCategory === parent.id }" @click="chooseCategory(parent.id)">{{ parent.name }}</button>
        <div :class="$style.submenu"><button v-for="child in parent.children" :key="child.id" @click="chooseCategory(child.id)">{{ child.name }}</button></div>
      </div>
    </div>

    <div :class="$style.intro">
      <div><span>CURATED GOODS</span><h1>{{ currentLabel }}</h1></div>
      <p>从材质、功能到耐用度，我们只留下值得长期相处的物件。</p>
    </div>

    <div :class="$style.workspace">
      <aside :class="$style.filters">
        <div :class="$style.filterTitle"><span><el-icon><Filter /></el-icon>筛选</span><button @click="resetFilters"><el-icon><RefreshRight /></el-icon>重置</button></div>
        <div :class="$style.filterBlock"><strong>商品分类</strong><button :class="{ [$style.selected]: !activeCategory }" @click="chooseCategory()">全部分类</button><template v-for="parent in categories" :key="parent.id"><button :class="{ [$style.selected]: activeCategory === parent.id }" @click="chooseCategory(parent.id)">{{ parent.name }}</button><button v-for="child in parent.children" :key="child.id" :class="[$style.child, { [$style.selected]: activeCategory === child.id }]" @click="chooseCategory(child.id)">{{ child.name }}</button></template></div>
        <div :class="$style.filterBlock"><strong>价格区间</strong><div :class="$style.priceRow"><el-input-number v-model="filters.minPrice" :min="0" :controls="false" placeholder="最低价" /><i>—</i><el-input-number v-model="filters.maxPrice" :min="0" :controls="false" placeholder="最高价" /></div><el-button plain @click="applyPrice">应用价格</el-button></div>
      </aside>

      <div :class="$style.results">
        <div :class="$style.toolbar"><span>共找到 <b>{{ pagination.total }}</b> 件</span><el-segmented :model-value="query.sort" :options="[{ label: '综合', value: 'default' }, { label: '销量', value: 'sales' }, { label: '价格从低到高', value: 'price_asc' }, { label: '价格从高到低', value: 'price_desc' }]" @change="(value: string | number | boolean) => changeQuery({ sort: String(value) })" /></div>
        <div v-loading="loading" :class="$style.grid">
          <el-empty v-if="!loading && !products.length" description="暂时没有符合条件的商品"><el-button @click="resetFilters">清空筛选</el-button></el-empty>
          <RouterLink v-for="product in products" :key="product.id" :to="`/products/${product.id}`" :class="$style.card">
            <div :class="$style.image"><img :src="product.cover" :alt="product.name" loading="lazy" /><span v-if="product.originalPrice">好价</span></div>
            <div :class="$style.cardBody"><small>{{ product.category.name }}</small><h2>{{ product.name }}</h2><p>{{ product.subtitle }}</p><div :class="$style.meta"><strong>¥{{ product.price.toFixed(2) }}</strong><del v-if="product.originalPrice">¥{{ product.originalPrice.toFixed(2) }}</del><span>已售 {{ product.salesCount }}</span></div></div>
          </RouterLink>
        </div>
        <el-pagination v-if="pagination.totalPages > 1" background layout="prev, pager, next" :current-page="pagination.page" :page-size="pagination.pageSize" :total="pagination.total" @current-change="(page: number) => changeQuery({ page })" />
      </div>
    </div>
  </section>
</template>

<style module lang="scss">
.page { width: min(1320px, calc(100% - 42px)); margin: 0 auto; }
.categoryBar { min-height: 54px; display: flex; align-items: center; justify-content: center; gap: 34px; border-bottom: 1px solid #e0e5de; button { border: 0; background: none; color: #56635b; font-size: 14px; cursor: pointer; &:hover, &.activeCat { color: #153e2c; font-weight: 700; } } }
.categoryGroup { position: relative; height: 54px; display: flex; align-items: center; &:hover .submenu { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); } }
.submenu { position: absolute; top: 46px; left: 50%; z-index: 10; min-width: 140px; padding: 9px; background: #fff; border: 1px solid #e2e7e0; border-radius: 12px; box-shadow: 0 12px 28px rgba(26,54,41,.12); opacity: 0; pointer-events: none; transform: translate(-50%, -5px); transition: .18s; button { display: block; width: 100%; padding: 9px 12px; text-align: left; border-radius: 7px; &:hover { background: #eff4ed; } } }
.intro { padding: 52px 8px 34px; display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; span { color: #52705f; font-size: 12px; font-weight: 800; letter-spacing: .18em; } h1 { margin: 8px 0 0; font-size: clamp(34px, 4vw, 52px); letter-spacing: -.05em; } p { max-width: 390px; margin: 0; color: #718077; line-height: 1.75; } }
.workspace { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 36px; }
.filters { align-self: start; padding: 20px; background: #fff; border: 1px solid #e0e5de; border-radius: 16px; }
.filterTitle { display: flex; justify-content: space-between; align-items: center; padding-bottom: 17px; border-bottom: 1px solid #e6eae5; span, button { display: flex; align-items: center; gap: 6px; } span { font-weight: 750; } button { border: 0; background: none; color: #89938d; font-size: 12px; cursor: pointer; } }
.filterBlock { padding-top: 20px; display: flex; flex-direction: column; align-items: stretch; gap: 5px; strong { margin-bottom: 8px; font-size: 14px; } > button:not(:global(.el-button)) { border: 0; padding: 7px 9px; text-align: left; background: none; color: #667269; border-radius: 7px; cursor: pointer; &:hover, &.selected { background: #edf3e9; color: #17452f; font-weight: 650; } &.child { padding-left: 25px; font-size: 13px; } } }
.priceRow { display: grid; grid-template-columns: 1fr auto 1fr; gap: 6px; align-items: center; margin-bottom: 8px; i { color: #a4ada7; font-style: normal; } :global(.el-input-number) { width: 100%; } :global(.el-input__wrapper) { padding: 0 8px; } }
.results { min-width: 0; }
.toolbar { min-height: 48px; display: flex; align-items: flex-start; justify-content: space-between; color: #7a857f; font-size: 14px; b { color: #234d3b; } :global(.el-segmented) { --el-segmented-item-selected-bg-color: #214d39; --el-segmented-item-selected-color: #fff; } }
.grid { min-height: 320px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.card { overflow: hidden; background: #fff; border-radius: 14px; border: 1px solid #e2e7e0; transition: .22s; &:hover { transform: translateY(-4px); box-shadow: 0 18px 38px rgba(25,56,42,.1); .image img { transform: scale(1.025); } } }
.image { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #e9ebe7; img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .35s ease; } span { position: absolute; top: 14px; left: 14px; padding: 5px 9px; color: #143725; background: var(--mori-lime); border-radius: 99px; font-size: 12px; font-weight: 750; } }
.cardBody { padding: 17px 18px 20px; small { color: #809087; } h2 { margin: 6px 0; font-size: 18px; letter-spacing: -.02em; } p { height: 42px; margin: 0; overflow: hidden; color: #78837c; font-size: 13px; line-height: 1.6; } }
.meta { margin-top: 14px; display: flex; align-items: baseline; gap: 7px; strong { color: #b34c2f; font-size: 19px; } del { color: #a4aaa6; font-size: 12px; } span { margin-left: auto; color: #8d9690; font-size: 12px; } }
.results > :global(.el-pagination) { justify-content: center; margin-top: 36px; }
@media(max-width: 1000px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .intro p { display: none; } }
@media(max-width: 700px) { .page { width: min(100% - 28px, 650px); }.categoryBar { overflow-x: auto; justify-content: flex-start; gap: 24px; }.categoryGroup { flex: none; }.submenu { display: none; }.intro { padding: 34px 2px 25px; }.workspace { grid-template-columns: 1fr; }.filters { padding: 12px; }.filterBlock:first-of-type { display: none; }.toolbar { gap: 14px; overflow-x: auto; }.toolbar > span { display: none; }.grid { gap: 12px; }.cardBody { padding: 13px; }.cardBody h2 { font-size: 16px; }.cardBody p, .meta span { display: none; } }
</style>
