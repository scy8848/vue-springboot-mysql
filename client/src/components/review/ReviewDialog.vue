<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Camera, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reviewApi } from '@/api/activity'
import type { OrderItem } from '@/types'

const props = defineProps<{ modelValue: boolean; item: OrderItem | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; submitted: [] }>()
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
const rating = ref(5)
const content = ref('')
const files = ref<File[]>([])
const previews = ref<string[]>([])
const submitting = ref(false)
function clearPreviews() { previews.value.forEach(URL.revokeObjectURL); previews.value = [] }
function choose(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files || []).filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024)
  if (files.value.length + selected.length > 5) ElMessage.warning('最多上传 5 张图片')
  files.value = [...files.value, ...selected].slice(0, 5)
  clearPreviews(); previews.value = files.value.map(URL.createObjectURL); input.value = ''
}
function remove(index: number) { files.value.splice(index, 1); clearPreviews(); previews.value = files.value.map(URL.createObjectURL) }
async function submit() {
  if (!props.item) return
  if (content.value.trim().length < 5) return ElMessage.warning('请至少写 5 个字的使用感受')
  submitting.value = true
  try {
    const images = files.value.length ? (await reviewApi.upload(files.value)).data.urls : []
    await reviewApi.create({ orderItemId: props.item.id, rating: rating.value, content: content.value.trim(), images })
    ElMessage.success('感谢你的真实评价')
    visible.value = false; emit('submitted')
  } finally { submitting.value = false }
}
watch(visible, (open) => { if (open) { rating.value = 5; content.value = ''; files.value = []; clearPreviews() } })
onBeforeUnmount(clearPreviews)
</script>

<template>
  <el-dialog v-model="visible" title="评价商品" width="min(560px, calc(100vw - 28px))" destroy-on-close>
    <div v-if="item" :class="$style.product"><img :src="item.image" :alt="item.productName" /><div><strong>{{ item.productName }}</strong><span>{{ item.skuName }}</span></div></div>
    <div :class="$style.field"><label>商品评分</label><el-rate v-model="rating" size="large" show-text :texts="['很差', '失望', '一般', '满意', '非常满意']" /></div>
    <div :class="$style.field"><label>使用感受</label><el-input v-model="content" type="textarea" :rows="5" maxlength="1000" show-word-limit placeholder="说说材质、做工和实际使用感受吧" /></div>
    <div :class="$style.field"><label>添加图片 <small>选填，最多 5 张，每张不超过 5MB</small></label><div :class="$style.uploads"><div v-for="(preview, index) in previews" :key="preview" :class="$style.preview"><img :src="preview" alt="待上传评价图片" /><button aria-label="移除图片" @click="remove(index)"><el-icon><Close /></el-icon></button></div><label v-if="files.length < 5" :class="$style.picker"><el-icon><Camera /></el-icon><span>上传图片</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" @change="choose" /></label></div></div>
    <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">发布评价</el-button></template>
  </el-dialog>
</template>

<style module lang="scss">
.product { display: flex; align-items: center; gap: 13px; margin-bottom: 22px; padding: 12px; background: #f3f5f1; border-radius: 10px; img { width: 58px; height: 58px; object-fit: cover; border-radius: 8px; } strong, span { display: block; } span { margin-top: 5px; color: #7f8983; font-size: 12px; } }.field { margin-top: 20px; > label { display: block; margin-bottom: 9px; font-size: 14px; font-weight: 650; small { margin-left: 8px; color: #909a94; font-weight: 400; } } }.uploads { display: flex; flex-wrap: wrap; gap: 10px; }.preview, .picker { width: 86px; height: 86px; border-radius: 9px; }.preview { position: relative; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } button { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; display: grid; place-items: center; border: 0; border-radius: 50%; color: #fff; background: rgba(0,0,0,.55); cursor: pointer; } }.picker { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 1px dashed #b7c0ba; color: #66746b; cursor: pointer; font-size: 12px; input { display: none; } &:hover { border-color: #315f49; color: #315f49; } }
</style>
