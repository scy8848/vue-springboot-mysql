<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const formRef = ref<FormInstance>()
const saving = ref(false)
const form = reactive({ nickname: auth.user?.nickname || '', phone: auth.user?.phone || '', avatar: auth.user?.avatar || '' })
const rules: FormRules = { phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }] }
async function save() {
  if (!await formRef.value?.validate()) return
  saving.value = true
  try {
    const result = await userApi.updateMe(form)
    auth.user = result.data
    ElMessage.success('个人资料已保存')
  } finally { saving.value = false }
}
</script>

<template>
  <section>
    <div :class="$style.heading"><div><span>ACCOUNT</span><h1>个人资料</h1><p>完善资料，让我们更好地为你服务。</p></div><div :class="$style.bigAvatar">{{ (form.nickname || auth.user?.email || 'M').slice(0, 1).toUpperCase() }}</div></div>
    <div :class="$style.card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div :class="$style.grid">
          <el-form-item label="登录邮箱"><el-input :model-value="auth.user?.email" disabled /><div :class="$style.hint">登录邮箱暂不支持修改</div></el-form-item>
          <el-form-item label="会员身份"><el-input :model-value="auth.user?.role === 'ADMIN' ? '管理员' : '普通会员'" disabled /></el-form-item>
          <el-form-item label="昵称"><el-input v-model.trim="form.nickname" maxlength="30" show-word-limit placeholder="你的昵称" /></el-form-item>
          <el-form-item label="手机号" prop="phone"><el-input v-model.trim="form.phone" maxlength="11" placeholder="用于收货联系" /></el-form-item>
          <el-form-item label="头像地址" :class="$style.wide"><el-input v-model.trim="form.avatar" placeholder="https://example.com/avatar.jpg" /></el-form-item>
        </div>
        <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
      </el-form>
    </div>
  </section>
</template>

<style module lang="scss">
.heading { display: flex; align-items: flex-end; justify-content: space-between; margin: 2px 2px 26px; span { color: #50715f; font-size: 12px; letter-spacing: .18em; font-weight: 800; } h1 { margin: 8px 0 6px; font-size: 34px; letter-spacing: -.04em; } p { margin: 0; color: #758079; } }
.bigAvatar { width: 78px; height: 78px; display: grid; place-items: center; background: #ddec8b; color: #173c2c; border-radius: 24px 24px 24px 6px; font-size: 30px; font-weight: 800; }
.card { padding: 30px; background: #fff; border: 1px solid #e2e7e0; border-radius: 18px; box-shadow: 0 18px 50px rgba(28,55,42,.06); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 22px; }
.wide { grid-column: 1 / -1; }
.hint { color: #9aa49e; font-size: 12px; margin-top: 5px; }
@media(max-width: 650px) { .grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } .bigAvatar { display: none; } .card { padding: 22px 18px; } }
</style>
