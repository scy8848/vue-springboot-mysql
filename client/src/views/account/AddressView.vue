<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Delete, EditPen, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi, type AddressInput } from '@/api/user'
import type { Address } from '@/types'

const addresses = ref<Address[]>([])
const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const blank = (): AddressInput => ({ receiver: '', phone: '', province: '', city: '', district: '', detail: '', postalCode: '', isDefault: false })
const form = reactive<AddressInput>(blank())
const rules: FormRules = {
  receiver: [{ required: true, message: '请输入收货人' }],
  phone: [{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }],
  province: [{ required: true, message: '请输入省份' }], city: [{ required: true, message: '请输入城市' }],
  district: [{ required: true, message: '请输入区县' }], detail: [{ required: true, message: '请输入详细地址' }],
}

async function load() { loading.value = true; try { addresses.value = (await userApi.addresses()).data } finally { loading.value = false } }
function openCreate() { editingId.value = null; Object.assign(form, blank()); dialog.value = true }
function openEdit(item: Address) { editingId.value = item.id; Object.assign(form, item); dialog.value = true }
async function save() {
  if (!await formRef.value?.validate()) return
  saving.value = true
  try {
    editingId.value ? await userApi.updateAddress(editingId.value, form) : await userApi.createAddress(form)
    ElMessage.success(editingId.value ? '地址已更新' : '地址已添加')
    dialog.value = false; await load()
  } finally { saving.value = false }
}
async function remove(item: Address) {
  await ElMessageBox.confirm(`确定删除 ${item.receiver} 的地址吗？`, '删除地址', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  await userApi.removeAddress(item.id); ElMessage.success('地址已删除'); await load()
}
async function setDefault(item: Address) { await userApi.setDefault(item.id); ElMessage.success('已设为默认地址'); await load() }
onMounted(load)
</script>

<template>
  <section>
    <div :class="$style.heading"><div><span>DELIVERY</span><h1>收货地址</h1><p>最多保存 10 个常用地址。</p></div><el-button type="primary" :icon="Plus" @click="openCreate">新增地址</el-button></div>
    <div v-loading="loading" :class="$style.list">
      <el-empty v-if="!loading && !addresses.length" description="还没有收货地址"><el-button type="primary" @click="openCreate">添加第一个地址</el-button></el-empty>
      <article v-for="item in addresses" :key="item.id" :class="[$style.address, { [$style.default]: item.isDefault }]">
        <div :class="$style.top"><div><strong>{{ item.receiver }}</strong><span>{{ item.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}</span></div><el-tag v-if="item.isDefault" effect="dark" size="small">默认</el-tag></div>
        <p>{{ item.province }} {{ item.city }} {{ item.district }} {{ item.detail }}</p>
        <div :class="$style.actions"><button v-if="!item.isDefault" @click="setDefault(item)">设为默认</button><button @click="openEdit(item)"><el-icon><EditPen /></el-icon>编辑</button><button @click="remove(item)"><el-icon><Delete /></el-icon>删除</button></div>
      </article>
    </div>

    <el-dialog v-model="dialog" :title="editingId ? '编辑收货地址' : '新增收货地址'" width="min(560px, calc(100vw - 28px))" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div :class="$style.formGrid">
          <el-form-item label="收货人" prop="receiver"><el-input v-model.trim="form.receiver" maxlength="30" /></el-form-item>
          <el-form-item label="手机号" prop="phone"><el-input v-model.trim="form.phone" maxlength="11" /></el-form-item>
          <el-form-item label="省份" prop="province"><el-input v-model.trim="form.province" placeholder="如：浙江省" /></el-form-item>
          <el-form-item label="城市" prop="city"><el-input v-model.trim="form.city" placeholder="如：杭州市" /></el-form-item>
          <el-form-item label="区县" prop="district"><el-input v-model.trim="form.district" placeholder="如：西湖区" /></el-form-item>
          <el-form-item label="邮编"><el-input v-model.trim="form.postalCode" maxlength="12" /></el-form-item>
          <el-form-item label="详细地址" prop="detail" :class="$style.full"><el-input v-model.trim="form.detail" type="textarea" :rows="3" maxlength="120" show-word-limit /></el-form-item>
          <el-form-item :class="$style.full"><el-checkbox v-model="form.isDefault">设为默认收货地址</el-checkbox></el-form-item>
        </div>
      </el-form>
      <template #footer><el-button @click="dialog = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存地址</el-button></template>
    </el-dialog>
  </section>
</template>

<style module lang="scss">
.heading { display: flex; align-items: flex-end; justify-content: space-between; margin: 2px 2px 26px; span { color: #50715f; font-size: 12px; letter-spacing: .18em; font-weight: 800; } h1 { margin: 8px 0 6px; font-size: 34px; letter-spacing: -.04em; } p { margin: 0; color: #758079; } }
.list { min-height: 260px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.address { min-height: 180px; padding: 24px; background: #fff; border: 1px solid #dfe6df; border-radius: 16px; transition: .2s; &:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(23,60,44,.08); } &.default { border: 1.5px solid #527d67; background: linear-gradient(145deg, #fff, #f6faf4); } p { min-height: 54px; color: #637168; line-height: 1.7; font-size: 14px; } }
.top { display: flex; justify-content: space-between; align-items: center; strong { margin-right: 12px; font-size: 18px; } span { color: #87918b; font-size: 14px; } }
.actions { display: flex; gap: 18px; padding-top: 14px; border-top: 1px solid #edf0ec; button { display: flex; align-items: center; gap: 4px; border: 0; background: none; color: #66756c; padding: 0; cursor: pointer; &:first-child { margin-right: auto; color: var(--mori-green); font-weight: 650; } &:hover { color: var(--mori-green); } } }
.formGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.full { grid-column: 1 / -1; }
@media(max-width: 680px) { .heading { align-items: center; } .list { grid-template-columns: 1fr; } .formGrid { grid-template-columns: 1fr; } .full { grid-column: auto; } }
</style>
