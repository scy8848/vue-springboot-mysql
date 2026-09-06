<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, CreditCard, Wallet } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { orderApi } from '@/api/order'
import type { Order } from '@/types'

const props = defineProps<{ modelValue: boolean; order: Order | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; paid: [order: Order]; later: [] }>()
const method = ref('wechat')
const paying = ref(false)
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
async function pay() {
  if (!props.order) return
  paying.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 850))
    const paid = (await orderApi.pay(props.order.id)).data
    ElMessage.success('支付成功')
    visible.value = false
    emit('paid', paid)
  } finally { paying.value = false }
}
function later() { visible.value = false; emit('later') }
</script>

<template>
  <el-dialog v-model="visible" width="min(460px, calc(100vw - 28px))" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" class="payment-dialog">
    <div :class="$style.wrap">
      <div :class="$style.icon"><el-icon><CreditCard /></el-icon></div>
      <span>模拟收银台</span><h2>确认支付</h2>
      <p v-if="order">订单 {{ order.orderNo }}</p>
      <div :class="$style.amount"><small>支付金额</small><strong>¥{{ order?.payableAmount.toFixed(2) }}</strong></div>
      <div :class="$style.methods">
        <button :class="{ [$style.selected]: method === 'wechat' }" @click="method = 'wechat'"><el-icon><Wallet /></el-icon><span>微信支付<small>模拟支付，不会产生真实扣款</small></span><el-icon v-if="method === 'wechat'"><Check /></el-icon></button>
        <button :class="{ [$style.selected]: method === 'card' }" @click="method = 'card'"><el-icon><CreditCard /></el-icon><span>银行卡<small>测试环境安全模拟</small></span><el-icon v-if="method === 'card'"><Check /></el-icon></button>
      </div>
      <el-button type="primary" :loading="paying" @click="pay">{{ paying ? '正在处理支付…' : '确认模拟支付' }}</el-button>
      <button :class="$style.later" :disabled="paying" @click="later">稍后支付</button>
    </div>
  </el-dialog>
</template>

<style module lang="scss">
.wrap { text-align: center; > span { color: #557260; font-size: 12px; font-weight: 800; letter-spacing: .14em; } h2 { margin: 8px 0 4px; font-size: 27px; } > p { margin: 0; color: #8a938e; font-size: 12px; } > :global(.el-button) { width: 100%; height: 48px; margin-top: 20px; } }
.icon { width: 52px; height: 52px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: 16px; color: #183b2c; background: var(--mori-lime); font-size: 24px; }.amount { margin: 24px 0; padding: 18px; background: #f2f5ef; border-radius: 12px; small, strong { display: block; } small { color: #7e8982; } strong { margin-top: 4px; color: #9e432c; font-size: 32px; } }
.methods { display: grid; gap: 9px; button { min-height: 62px; display: grid; grid-template-columns: 28px 1fr 24px; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid #dfe5df; border-radius: 10px; background: #fff; text-align: left; cursor: pointer; > :global(.el-icon) { font-size: 20px; } span { display: flex; flex-direction: column; font-weight: 650; } small { margin-top: 3px; color: #919a94; font-size: 11px; font-weight: 400; } &.selected { border-color: #28543f; background: #f6faf4; color: #214b38; } } }.later { margin-top: 13px; border: 0; background: none; color: #7c8780; cursor: pointer; }
</style>
