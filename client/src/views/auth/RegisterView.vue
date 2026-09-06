<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import AuthShell from '@/components/auth/AuthShell.vue'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const formRef = ref<FormInstance>()
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
let timer: number | undefined
const form = reactive({ email: '', code: '', nickname: '', password: '', confirmPassword: '' })
const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱' },
    {
      validator: (_rule, value, callback) => {
        if (!value || value.includes('@')) callback();
        else callback(new Error('邮箱格式不正确'));
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码' }, { len: 6, message: '请输入 6 位验证码' }],
  password: [{ required: true, message: '请设置密码' }, { min: 8, message: '密码至少 8 位' }],
  confirmPassword: [{ required: true, validator: (_r, value, callback) => value === form.password ? callback() : callback(new Error('两次密码不一致')), trigger: 'blur' }],
}
const auth = useAuthStore()
const router = useRouter()

async function sendCode() {
  await formRef.value?.validateField('email')
  sending.value = true
  try {
    const result = await authApi.sendCode(form.email)
    ElMessage.success(result.data.devCode ? `验证码已生成：${result.data.devCode}` : '验证码已发送，请查收邮件')
    countdown.value = 60
    timer = window.setInterval(() => { if (--countdown.value <= 0) window.clearInterval(timer) }, 1000)
  } finally { sending.value = false }
}
async function submit() {
  if (!await formRef.value?.validate()) return
  loading.value = true
  try {
    await auth.register({ email: form.email, code: form.code, nickname: form.nickname || undefined, password: form.password })
    ElMessage.success('注册成功，欢迎加入森集')
    await router.push('/account/profile')
  } finally { loading.value = false }
}
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <AuthShell title="为日常，留一点好心情。">
    <div class="auth-card">
      <div class="eyebrow">Join MORI</div>
      <h2>创建账户</h2>
      <p>注册后即可保存地址，并在下一批功能中体验完整购物流程。</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="邮箱" prop="email"><el-input v-model.trim="form.email" placeholder="name@example.com" /></el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-row"><el-input v-model.trim="form.code" maxlength="6" placeholder="6 位验证码" /><el-button :disabled="countdown > 0" :loading="sending" @click="sendCode">{{ countdown ? `${countdown}s` : '获取验证码' }}</el-button></div>
        </el-form-item>
        <el-form-item label="昵称（选填）"><el-input v-model.trim="form.nickname" maxlength="30" placeholder="怎么称呼你" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" type="password" show-password placeholder="至少 8 位，包含字母和数字" /></el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入密码" /></el-form-item>
        <el-button type="primary" :loading="loading" @click="submit">注册并登录</el-button>
      </el-form>
      <div class="auth-switch">已经是会员？ <RouterLink to="/auth/login">直接登录</RouterLink></div>
    </div>
  </AuthShell>
</template>

<style module lang="scss">
:global(.code-row) { display: flex; width: 100%; gap: 10px; }
:global(.code-row .el-button) { width: 128px; flex: none; }
</style>