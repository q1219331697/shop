/**
 * 认证工具
 */
import { hasTokenCookie, setToken, removeToken } from './storage'

export function isAuthenticated(): boolean {
  return hasTokenCookie()
}

export function login(token: string): void {
  setToken(token)
}

export function logout(): void {
  removeToken()
}
