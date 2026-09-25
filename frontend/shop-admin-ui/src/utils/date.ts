/**
 * 日期工具
 *
 * 行业标准：后端接口统一返回 ISO 8601 格式（如 2026-05-22T00:11:04），
 * 前端按需格式化展示（如 2026-05-22 00:11:04）。
 *
 * 基于 dayjs。
 *
 * ⚠️ 依赖声明：dayjs 虽与 Element Plus 内部所用同款，但它是**本项目的直接依赖**，
 *    已在 package.json 的 dependencies 中显式声明。切勿因「Element Plus 已带」而移除该声明——
 *    传递依赖不在对方的兼容承诺内，element-plus 升级或替换日期库时，
 *    此处的 dayjs / dayjs/plugin/relativeTime / dayjs/locale/zh-cn 会立即解析失败。
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 启用相对时间插件 & 中文语言包
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// ==================== 格式常量 ====================

/** 日期格式常量，配合 formatDate 使用 */
export const DATE_FORMAT = {
  /** 日期时间：2026-05-22 00:11:04 */
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  /** 短日期：2026-05-22 */
  DATE: 'YYYY-MM-DD',
  /** 时间：14:30:00 */
  TIME: 'HH:mm:ss',
  /** 短时间：14:30 */
  TIME_SHORT: 'HH:mm',
  /** 年月：2026-05 */
  MONTH: 'YYYY-MM',
  /** 中文日期：2026年05月22日 */
  DATE_CN: 'YYYY年MM月DD日',
  /** 中文日期时间：2026年05月22日 14时30分 */
  DATETIME_CN: 'YYYY年MM月DD日 HH时mm分',
} as const

/** 日期输入类型 */
type DateInput = string | Date | number | null | undefined

// ==================== 格式化（→ 字符串） ====================

/**
 * 通用日期格式化
 * @example formatDate("2026-05-22T00:11:04") => "2026-05-22 00:11:04"
 * @example formatDate("2026-05-22T00:11:04", DATE_FORMAT.DATE) => "2026-05-22"
 * @example formatDate("2026-05-22T00:11:04", "YYYY/MM/DD") => "2026/05/22"
 * @param input  日期字符串、Date 对象或时间戳
 * @param format 格式模板，默认 DATE_FORMAT.DATETIME
 * @returns 格式化后的字符串，无效输入返回 "-"
 */
export function formatDate(input: DateInput, format: string = DATE_FORMAT.DATETIME): string {
  if (!input) return '-'
  const d = dayjs(input)
  return d.isValid() ? d.format(format) : '-'
}

/**
 * 相对时间（如 "3 小时前"、"2 天前"）
 * @example formatRelative("2026-05-22T00:11:04") => "3 小时前"
 */
export function formatRelative(input: DateInput): string {
  if (!input) return '-'
  const d = dayjs(input)
  return d.isValid() ? d.fromNow() : '-'
}

// ==================== 解析（→ Date / 时间戳） ====================

/**
 * 任意日期输入转 Date 对象
 * @example toDate("2026-05-22T00:11:04") => Date
 * @example toDate(1716336000000) => Date
 * @example toDate(new Date()) => Date
 * @returns Date 对象，无效输入返回 null
 */
export function toDate(input: DateInput): Date | null {
  if (!input) return null
  const d = dayjs(input)
  return d.isValid() ? d.toDate() : null
}

/**
 * 按指定格式解析日期字符串，再转为 Date
 * @example parseToDate("22/05/2026", "DD/MM/YYYY") => Date
 * @example parseToDate("2026年05月22日", DATE_FORMAT.DATE_CN) => Date
 * @param dateStr 日期字符串
 * @param format  对应的格式模板
 * @returns Date 对象，无效输入返回 null
 */
export function parseToDate(dateStr: string | null | undefined, format: string): Date | null {
  if (!dateStr) return null
  const d = dayjs(dateStr, format)
  return d.isValid() ? d.toDate() : null
}

/**
 * Unix 时间戳（秒）转 Date
 * @example unixToDate(1716336000) => Date
 */
export function unixToDate(timestamp: number | null | undefined): Date | null {
  if (timestamp == null || !Number.isFinite(timestamp)) return null
  const d = dayjs.unix(timestamp)
  return d.isValid() ? d.toDate() : null
}

/**
 * 日期输入转 Unix 时间戳（秒）
 * @example toUnix("2026-05-22T00:11:04") => 1716336000
 */
export function toUnix(input: DateInput): number | null {
  if (!input) return null
  const d = dayjs(input)
  return d.isValid() ? d.unix() : null
}

/**
 * 日期输入转毫秒时间戳
 * @example toMillis("2026-05-22T00:11:04") => 1716336000000
 */
export function toMillis(input: DateInput): number | null {
  if (!input) return null
  const d = dayjs(input)
  return d.isValid() ? d.valueOf() : null
}
