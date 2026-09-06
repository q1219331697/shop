/**
 * 认证模块：登录 / 登出
 */
import { getToken, setToken, removeToken } from '@/utils/storage'

import { endpoints } from './endpoints'
import request from './http'

/** 登录请求 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应（后端 data 直接返回 token 字符串） */
export type LoginResult = string

/** 管理员登录，成功返回 Token 字符串，并写入 Token 存储（浏览器写 Cookie / 测试写请求头） */
export async function login(data: LoginParams) {
  const token = await request.post<string>(endpoints.auth.login, data)
  setToken(token)
  return token
}

/** 管理员登出 */
export function logout() {
  return request.post(endpoints.auth.logout)
}

// ==================== Token 刷新 ====================

/** 是否正在刷新 Token（防止并发重复刷新） */
let isRefreshing = false

/**
 * 刷新 Token：后端延长 Redis 中 Token 的有效时间并返回新 Token。
 * 成功后写回新 Token；失败（含 401）由响应拦截器统一清除登录态并跳转登录页。
 */
async function refreshToken(): Promise<void> {
  if (!getToken()) {
    throw new Error('无 Token 可刷新')
  }
  try {
    const newToken = await request.post<string | null>(endpoints.auth.tokenRefresh, {})
    if (newToken) {
      setToken(newToken)
    } else {
      throw new Error('Token 刷新失败')
    }
  } catch (error: unknown) {
    removeToken()
    throw error
  }
}

// ==================== 后台定时自动刷新 Token ====================

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

/** 启动 Token 自动刷新定时器（每 25 分钟） */
export function startAutoRefreshToken(): void {
  stopAutoRefreshToken()
  autoRefreshTimer = setInterval(
    () => {
      if (!getToken()) {
        stopAutoRefreshToken()
        return
      }
      if (!isRefreshing) {
        isRefreshing = true
        refreshToken()
          .catch(() => {
            // 刷新失败，拦截器已清除登录态
          })
          .finally(() => {
            isRefreshing = false
          })
      }
    },
    25 * 60 * 1000,
  )
}

/** 停止 Token 自动刷新定时器 */
export function stopAutoRefreshToken(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

/** 认证模块 API 聚合对象（非 CRUD 资源，仅供直接调用） */
export const authApi = {
  login,
  logout,
}
