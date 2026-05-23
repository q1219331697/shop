/**
 * Vue 全局属性类型扩展
 *
 * 让模板和 this 上能正确推断全局注册的属性类型
 */
import {
  formatDate as _formatDate,
  formatRelative as _formatRelative,
  toDate as _toDate,
  parseToDate as _parseToDate,
  unixToDate as _unixToDate,
  toUnix as _toUnix,
  toMillis as _toMillis,
  DATE_FORMAT as _DATE_FORMAT,
} from '@/utils/date'

declare module 'vue' {
  export interface ComponentCustomProperties {
    formatDate: typeof _formatDate
    formatRelative: typeof _formatRelative
    toDate: typeof _toDate
    parseToDate: typeof _parseToDate
    unixToDate: typeof _unixToDate
    toUnix: typeof _toUnix
    toMillis: typeof _toMillis
    DATE_FORMAT: typeof _DATE_FORMAT
  }
}

export {}
