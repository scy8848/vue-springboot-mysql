import axios from 'axios'
import { ElMessage } from 'element-plus'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('mori-auth')
  if (raw) {
    try {
      const token = JSON.parse(raw).token
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch { localStorage.removeItem('mori-auth') }
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || '网络开小差了，请稍后重试'
    if (status === 401) {
      localStorage.removeItem('mori-auth')
      if (!location.pathname.startsWith('/auth')) location.href = '/auth/login'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  },
)
