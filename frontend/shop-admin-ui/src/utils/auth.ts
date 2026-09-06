/**
 * 认证工具
 */
import { startAutoRefreshToken, stopAutoRefreshToken } from '@/api/auth'

import { hasTokenCookie, setToken, removeToken } from './storage'

export function isAuthenticated(): boolean {
  return hasTokenCookie()
}

export function login(token: string): void {
  setToken(token)
  startAutoRefreshToken()
}

export function logout(): void {
  removeToken()
  stopAutoRefreshToken()
}
