<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { adminApi } from '@/api/admin'
import { formatDateTime } from '@/constants/order'
import type { AdminUser, Pagination } from '@/types'

const loading = ref(true), items = ref<AdminUser[]>([])
const pagination = ref<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
const filters = reactive({ keyword: '', status: '' as '' | 'ACTIVE' | 'BANNED' })
async function load(page = 1) { loading.value = true; try { const result = await adminApi.users({ page, pageSize: 10, keyword: filters.keyword || undefined, status: filters.status || undefined }); items.value = result.data.items; pagination.value = result.data.pagination } finally { loading.value = false } }
async function toggle(user: AdminUser) { const status = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE'; const verb = status === 'BANNED' ? '封禁' : '解除封禁'; await ElMessageBox.confirm(`确定${verb}用户 ${user.email} 吗？`, `${verb}用户`, { type: status === 'BANNED' ? 'warning' : 'info' }); await adminApi.setUserStatus(user.id, status); ElMessage.success(`已${verb}`); await load(pagination.value.page) }
onMounted(() => load())
</script>

<template>
  <section><div :class="$style.heading"><div><span>MEMBERS</span><h1>用户管理</h1><p>查看会员账户及订单活跃情况，处理异常账户。</p></div></div>
    <div :class="$style.toolbar"><el-input v-model="filters.keyword" placeholder="邮箱 / 昵称 / 手机号" clearable :prefix-icon="Search" @keyup.enter="load(1)" /><el-select v-model="filters.status" placeholder="全部状态" clearable><el-option label="正常" value="ACTIVE" /><el-option label="已封禁" value="BANNED" /></el-select><el-button @click="load(1)">查询</el-button></div>
    <div :class="$style.table"><el-table v-loading="loading" :data="items"><el-table-column label="用户" min-width="260"><template #default="{ row }"><div :class="$style.user"><span>{{ (row.nickname || row.email).slice(0,1).toUpperCase() }}</span><div><b>{{ row.nickname || '未设置昵称' }}</b><small>{{ row.email }}</small></div></div></template></el-table-column><el-table-column label="手机号" min-width="135"><template #default="{ row }">{{ row.phone || '—' }}</template></el-table-column><el-table-column prop="orderCount" label="订单数" width="90" /><el-table-column label="注册时间" width="165"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column><el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">{{ row.status === 'ACTIVE' ? '正常' : '已封禁' }}</el-tag></template></el-table-column><el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link :type="row.status === 'ACTIVE' ? 'danger' : 'success'" @click="toggle(row)">{{ row.status === 'ACTIVE' ? '封禁' : '解除封禁' }}</el-button></template></el-table-column></el-table></div>
    <el-pagination v-if="pagination.totalPages > 1" background layout="prev, pager, next" :current-page="pagination.page" :page-size="pagination.pageSize" :total="pagination.total" @current-change="load" />
  </section>
</template>

<style module lang="scss">
.heading{margin-bottom:24px;span{color:#5f7d6c;font-size:11px;letter-spacing:.2em;font-weight:800}h1{margin:8px 0 5px;font-size:30px;letter-spacing:-.04em}p{margin:0;color:#7d8881;font-size:13px}}.toolbar{margin-bottom:14px;padding:14px;display:flex;gap:10px;background:#fff;border:1px solid #e0e6e0;border-radius:13px;:global(.el-input){width:290px}:global(.el-select){width:150px}}.table{overflow:hidden;background:#fff;border:1px solid #e0e6e0;border-radius:14px}.user{display:flex;align-items:center;gap:11px;>span{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#e7eee8;color:#315d48;font-weight:800}div{display:grid;gap:4px}b{font-size:12px}small{color:#89948d;font-size:10px}}section>:global(.el-pagination){justify-content:center;margin-top:24px}@media(max-width:600px){.toolbar{flex-wrap:wrap}.toolbar :global(.el-input){width:100%}.heading p{display:none}}
</style>
