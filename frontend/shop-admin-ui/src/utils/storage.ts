/**
 * 本地存储工具
 * Token 使用 Cookie 存储（替代 localStorage），安全性更好
 */

const TOKEN_KEY = 'Token'

// ==================== Cookie Token 管理 ====================

/**
 * 从 Cookie 中获取 Token
 */
export function getToken(): string | null {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + TOKEN_KEY + '=([^;]*)'))
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token || token === 'undefined' || token === 'null') {
    return null
  }
  return token
}

/**
 * 将 Token 写入 Cookie
 */
export function setToken(token: string): void {
  if (!token || token === 'undefined' || token === 'null') {
    return
  }
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Strict`
}

/**
 * 移除 Token Cookie
 */
export function removeToken(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0; SameSite=Strict`
}

/**
 * 检查是否存在 Token Cookie
 * 用于路由守卫判断登录状态
 */
export function hasTokenCookie(): boolean {
  return document.cookie.includes(TOKEN_KEY + '=')
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
