<template>
  <!-- 操作日志为只读数据：schema 已隐藏全部工具栏按钮与行操作 -->
  <CrudTable :schema="operationLogSchema" :api="api.operationLog" resource="operationlog">
    <template #detail-requestParams="{ value }">
      <pre class="json-block">{{ formatJson(value) }}</pre>
    </template>
    <template #detail-responseData="{ value }">
      <pre class="json-block">{{ formatJson(value) }}</pre>
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
/**
 * 操作日志 - 基于 CrudTable 的只读查询页
 * <p>
 * 日志由 OperationLogAspect 自动写入，仅支持按操作人 / 模块 / 操作 / 类型 / 状态 / 开始时间 / 结束时间查询。
 * </p>
 */

// ==================== 依赖引入 ====================

// API 聚合对象（显式导入，避免依赖 auto-import 在该视图未注入）/ 业务组件
import { api } from '@/api'
import { CrudTable } from '@/components/CrudTable'

// Schema 配置
import { operationLogSchema } from './schema'

/**
 * 尝试将 JSON 字符串格式化为 2 空格缩进；
 * 非 JSON 时原样返回，便于统一渲染请求参数 / 响应结果。
 */
function formatJson(value: unknown): string {
  if (value == null || value === '') return '-'
  try {
    return JSON.stringify(JSON.parse(value as string), null, 2)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.json-block {
  margin: 0;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
}
</style>
