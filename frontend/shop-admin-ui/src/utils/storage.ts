/**
 * 本地存储工具
 * Token 使用 Cookie 存储（替代 localStorage），安全性更好
 */

const TOKEN_KEY = 'Token'
const TOKEN_EXPIRE_KEY = 'TokenExpireTime'

// Token 默认有效期（毫秒），与后端保持一致
const DEFAULT_TOKEN_TTL = 2 * 60 * 60 * 1000 // 2小时

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
 * 将 Token 写入 Cookie，并记录过期时间
 * @param token Token 值
 * @param ttl 有效期（毫秒），默认 2 小时
 */
export function setToken(token: string, ttl: number = DEFAULT_TOKEN_TTL): void {
  if (!token || token === 'undefined' || token === 'null') {
    return
  }
  // Cookie 的 Max-Age（秒）与 Token TTL 同步，确保浏览器关闭后 Cookie 仍有效
  const maxAge = Math.floor(ttl / 1000)
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; Max-Age=${maxAge}; SameSite=Strict`
  // 记录过期时间戳到 localStorage，用于前端判断是否即将过期
  const expireTime = Date.now() + ttl
  localStorage.setItem(TOKEN_EXPIRE_KEY, String(expireTime))
}

/**
 * 移除 Token Cookie 及过期时间
 */
export function removeToken(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; Max-Age=0; SameSite=Strict`
  localStorage.removeItem(TOKEN_EXPIRE_KEY)
}

/**
 * 检查是否存在 Token Cookie（用于路由守卫判断登录状态）
 */
export function hasTokenCookie(): boolean {
  return document.cookie.includes(TOKEN_KEY + '=')
}

