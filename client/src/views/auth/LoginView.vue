<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import AuthShell from "@/components/auth/AuthShell.vue";
import { useAuthStore } from "@/stores/auth";

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ email: "", password: "" });
const rules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱" },
    {
      validator: (_rule, value, callback) => {
        if (!value || value.includes("@")) callback();
        else callback(new Error("邮箱格式不正确"));
      },
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 8, message: "密码至少 8 位" },
  ],
};
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

async function submit() {
  if (!(await formRef.value?.validate())) return;
  loading.value = true;
  try {
    await auth.login(form);
    ElMessage.success("欢迎回来");
    await router.push(String(route.query.redirect || "/account/profile"));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthShell title="好生活，从一次相遇开始。">
    <div class="auth-card">
      <div class="eyebrow">Welcome back</div>
      <h2>登录森集</h2>
      <p>继续管理你的账户、地址和订单。</p>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @keyup.enter="submit"
      >
        <el-form-item label="邮箱" prop="email"
          ><el-input v-model.trim="form.email" placeholder="name@example.com"
        /></el-form-item>
        <el-form-item label="密码" prop="password"
          ><el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="至少 8 位"
        /></el-form-item>
        <el-button type="primary" :loading="loading" @click="submit"
          >登录</el-button
        >
      </el-form>
      <div class="auth-switch">
        还没有账户？ <RouterLink to="/auth/register">免费注册</RouterLink>
      </div>
    </div>
  </AuthShell>
</template>