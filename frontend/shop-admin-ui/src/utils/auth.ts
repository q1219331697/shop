/**
 * 认证工具
 */
import { hasTokenCookie, setToken, removeToken } from './storage'
import { startAutoRefreshToken, stopAutoRefreshToken } from './http'

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
