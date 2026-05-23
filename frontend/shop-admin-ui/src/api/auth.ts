/**
 * 认证相关接口
 */
import { post } from '@/utils/http'
import type { LoginParams, LoginResult } from './types'

/** 管理员登录 */
export function login(data: LoginParams) {
  return post<LoginResult>('/public/login', data)
}

/** 管理员登出 */
export function logout() {
  return post('/public/logout')
}

