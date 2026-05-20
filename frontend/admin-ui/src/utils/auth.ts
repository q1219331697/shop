/**
 * 认证工具
 */
import { getToken, setToken, removeToken } from './storage'

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function login(token: string): void {
  setToken(token)
}

export function logout(): void {
  removeToken()
}
