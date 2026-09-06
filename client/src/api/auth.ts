import { http } from './http'
import type { ApiResponse, User } from '@/types'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload extends LoginPayload { code: string; nickname?: string }
export interface AuthResult { token: string; user: User }

export const authApi = {
  sendCode: (email: string) => http.post<never, ApiResponse<{ expiresIn: number; devCode?: string }>>('/auth/send-code', { email, type: 'REGISTER' }),
  register: (data: RegisterPayload) => http.post<never, ApiResponse<AuthResult>>('/auth/register', data),
  login: (data: LoginPayload) => http.post<never, ApiResponse<AuthResult>>('/auth/login', data),
}
