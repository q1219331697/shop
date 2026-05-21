/**
 * 校验工具
 */

/** 是否为手机号 */
export function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

/** 是否为邮箱 */
export function isEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
}

/** 是否为空值（null / undefined / 空字符串 / 空数组 / 空对象） */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/** 是否为 URL */
export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
