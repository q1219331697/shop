<template>
  <el-dialog v-model="visible" :title="`${name}详情`" :width="width" destroy-on-close>
    <el-descriptions v-loading="loading" :column="1" border>
      <template v-for="field in fields" :key="field.prop">
        <el-descriptions-item :label="field.label">
          <!-- 插槽类型 -->
          <slot
            v-if="field.type === 'slot'"
            :name="`detail-${field.slot || field.prop}`"
            :row="data"
            :value="data[field.prop]"
          />

          <!-- tag 类型 -->
          <template v-else-if="field.type === 'tag'">
            <el-tag
              v-if="field.tagMap && field.tagMap[data[field.prop]]"
              :type="field.tagMap[data[field.prop]][1] as any"
              effect="plain"
            >
              {{ field.tagMap[data[field.prop]][0] }}
            </el-tag>
            <span v-else>{{ data[field.prop] ?? '-' }}</span>
          </template>

          <!-- date 类型 -->
          <template v-else-if="field.type === 'date'">
            {{ formatDate(data[field.prop], field.dateFormat) }}
          </template>

          <!-- boolean 类型 -->
          <template v-else-if="field.type === 'boolean'">
            <el-tag
              :type="
                (data[field.prop] ? field.trueType || 'success' : field.falseType || 'info') as any
              "
              effect="plain"
            >
              {{ data[field.prop] ? field.trueText || '是' : field.falseText || '否' }}
            </el-tag>
          </template>

          <!-- money 类型 -->
          <template v-else-if="field.type === 'money'">
            {{ formatMoney(data[field.prop], field.prefix, field.precision) }}
          </template>

          <!-- image 类型 -->
          <template v-else-if="field.type === 'image'">
            <el-image
              v-if="data[field.prop]"
              :src="data[field.prop]"
              :preview-src-list="[data[field.prop]]"
              style="width: 60px; height: 60px"
              fit="cover"
              preview-teleported
            />
            <span v-else>-</span>
          </template>

          <!-- formatter -->
          <template v-else-if="field.formatter">
            {{ field.formatter(data[field.prop], data) }}
          </template>

          <!-- default -->
          <template v-else>
            {{ data[field.prop] ?? '-' }}
          </template>
        </el-descriptions-item>
      </template>
    </el-descriptions>
    <template #footer>
      <el-button @click="visible = false">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * CrudDetailDialog - 详情对话框
 *
 * 根据 detailFields 配置自动渲染详情描述列表，支持：
 * - tag / date / boolean / money / image / slot / default 类型
 * - 字段级插槽 #detail-{slot|prop}
 */
import { computed } from 'vue'
import { formatDate } from '@/utils/date'
import type { DetailField } from './CrudPage/types'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue: boolean
    /** 模块名称 */
    name: string
    /** 对话框宽度 */
    width?: string
    /** 详情字段配置 */
    fields?: DetailField[]
    /** 详情数据 */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>
    /** 是否加载中 */
    loading?: boolean
  }>(),
  {
    width: '520px',
    fields: () => [],
    loading: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

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
