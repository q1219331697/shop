<template>
  <el-descriptions v-loading="loading" :column="1" border>
    <template v-for="field in fields" :key="field.prop">
      <el-descriptions-item :label="field.label">
        <!-- 插槽类型 -->
        <slot
          v-if="field.type === 'slot'"
          :name="`detail-${field.slot || field.prop}`"
          :row="data"
          :value="data?.[field.prop]"
        />

        <!-- tag 类型 -->
        <template v-else-if="field.type === 'tag'">
          <el-tag
            v-if="field.tagMap && field.tagMap[data?.[field.prop]]"
            :type="field.tagMap[data?.[field.prop]][1]"
            effect="plain"
          >
            {{ field.tagMap[data?.[field.prop]][0] }}
          </el-tag>
          <span v-else>{{ data?.[field.prop] ?? '-' }}</span>
        </template>

        <!-- date 类型 -->
        <template v-else-if="field.type === 'date'">
          {{ formatDate(data?.[field.prop], field.dateFormat) }}
        </template>

        <!-- boolean 类型 -->
        <template v-else-if="field.type === 'boolean'">
          <el-tag
            :type="data?.[field.prop] ? field.trueType || 'success' : field.falseType || 'info'"
            effect="plain"
          >
            {{ data?.[field.prop] ? field.trueText || '是' : field.falseText || '否' }}
          </el-tag>
        </template>

        <!-- money 类型 -->
        <template v-else-if="field.type === 'money'">
          {{ formatMoney(data?.[field.prop], field.prefix, field.precision) }}
        </template>

        <!-- image 类型 -->
        <template v-else-if="field.type === 'image'">
          <el-image
            v-if="data?.[field.prop]"
            :src="data?.[field.prop]"
            :preview-src-list="[data?.[field.prop]]"
            style="width: 60px; height: 60px"
            fit="cover"
            preview-teleported
          />
          <span v-else>-</span>
        </template>

        <!-- formatter -->
        <template v-else-if="field.formatter">
          {{ data ? field.formatter(data?.[field.prop], data) : '-' }}
        </template>

        <!-- default -->
        <template v-else>
          {{ data?.[field.prop] ?? '-' }}
        </template>
      </el-descriptions-item>
    </template>
  </el-descriptions>
</template>

<script setup lang="ts" generic="T extends RowData">
/**
 * CrudDetailContent - 详情描述列表（无弹窗外壳）
 *
 * 从 CrudDetailDialog 抽取内层描述列表，供「弹窗」与「独立页面」共用。
 * 支持：tag / date / boolean / money / image / slot / default / formatter 类型
 */
import { formatDate } from '@/utils/date'

import type { DetailField, RowData } from './CrudTable/types'

withDefaults(
  defineProps<{
    /** 详情字段配置（T 由传入的行类型决定，使 formatter 的 row 参数保持精确类型） */
    fields?: DetailField<T>[]
    /** 详情数据，未加载完成时为 null */
    data: T | null
    /** 是否加载中 */
    loading?: boolean
  }>(),
  {
    fields: () => [],
    loading: false,
  },
)

/** 格式化金额 */
function formatMoney(value: unknown, prefix?: string, precision?: number): string {
  if (value == null) return '-'
  const p = prefix ?? '¥'
  const d = precision ?? 2
  const num = Number(value)
  if (isNaN(num)) return '-'
  return p + num.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<style scoped>
/* 兜底：详情描述列表 value 单元格遇到长内容自动折行，避免撑破弹窗 */
:deep(.el-descriptions__content) {
  word-break: break-all;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
