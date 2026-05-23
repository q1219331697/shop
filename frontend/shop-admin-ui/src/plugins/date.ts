/**
 * 日期工具 Vue 插件
 *
 * 将日期工具函数注册为 Vue 全局属性，模板中可直接使用：
 * @example {{ formatDate(row.createTime) }}
 * @example {{ formatDate(row.createTime, DATE_FORMAT.DATE) }}
 * @example {{ formatRelative(row.createTime) }}
 */
import type { App } from 'vue'
import {
  formatDate,
  formatRelative,
  toDate,
  parseToDate,
  unixToDate,
  toUnix,
  toMillis,
  DATE_FORMAT,
} from '@/utils/date'

export default {
  install(app: App) {
    app.config.globalProperties.formatDate = formatDate
    app.config.globalProperties.formatRelative = formatRelative
    app.config.globalProperties.toDate = toDate
    app.config.globalProperties.parseToDate = parseToDate
    app.config.globalProperties.unixToDate = unixToDate
    app.config.globalProperties.toUnix = toUnix
    app.config.globalProperties.toMillis = toMillis
    app.config.globalProperties.DATE_FORMAT = DATE_FORMAT
  },
}
