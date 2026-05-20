/**
 * 本地存储工具
 */

const TOKEN_KEY = 'admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStorage<T>(key: string): T | null {
  const value = localStorage.getItem(key)
  if (value) {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return null
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key)
}
