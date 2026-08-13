/**
 * 认证相关接口
 */
import { post } from '@/utils/http'
import type { LoginParams } from './types'

/**
 * 管理员登录
 * @returns Promise<string> - 登录成功返回 Token 字符串
 * @throws Error - 登录失败抛出异常（已在 HTTP 拦截器中处理错误提示）
 */
export function login(data: LoginParams) {
  // HTTP 拦截器已解包响应，成功时直接返回 data（token 字符串）
  return post<string>('/public/login', data)
}

/** 管理员登出 */
export function logout() {
  return post('/public/logout')
}
