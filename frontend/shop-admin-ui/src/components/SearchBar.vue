<template>
  <div v-if="visibleFields.length > 0 || $slots['search-extra']" class="search-bar">
    <el-form :model="localParams" inline>
      <!-- 动态渲染搜索字段 -->
      <template v-for="field in visibleFields" :key="field.prop">
        <!-- 插槽类型：完全自定义 -->
        <el-form-item
          v-if="field.type === 'slot'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <slot
            :name="`field-${field.slot || field.prop}`"
            :model="localParams"
            :prop="field.prop"
          />
        </el-form-item>

        <!-- 输入框 -->
        <el-form-item
          v-else-if="field.type === 'input'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <el-input
            v-model="localParams[field.prop]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :clearable="field.clearable !== false"
            :maxlength="field.maxlength"
            :style="{ width: field.width || '180px' }"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <!-- 选择器 -->
        <el-form-item
          v-else-if="field.type === 'select'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <el-select
            v-model="localParams[field.prop]"
            :placeholder="field.placeholder || '全部'"
            :clearable="field.clearable !== false"
            :multiple="field.multiple"
            :style="{ width: field.width || '120px' }"
          >
            <el-option
              v-for="opt in getFieldOptions(field)"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
              :disabled="opt.disabled"
            />
          </el-select>
        </el-form-item>

        <!-- 数字输入 -->
        <el-form-item
          v-else-if="field.type === 'number'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <el-input-number
            v-model="localParams[field.prop]"
            :placeholder="field.placeholder"
            :min="field.min"
            :max="field.max"
            :precision="field.precision"
            :controls="false"
            :style="{ width: field.width || '150px' }"
          />
        </el-form-item>

        <!-- 日期选择 -->
        <el-form-item
          v-else-if="field.type === 'datePicker'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <el-date-picker
            v-model="localParams[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :format="field.format"
            :value-format="field.valueFormat"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '180px' }"
          />
        </el-form-item>

        <!-- 日期范围 -->
        <el-form-item
          v-else-if="field.type === 'dateRange'"
          :label="field.label"
          :label-width="field.labelWidth"
        >
          <el-date-picker
            v-model="dateRangeValues[field.prop]"
            :type="field.dateType || 'daterange'"
            :range-separator="field.rangeSeparator || '~'"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :format="field.format"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
            :clearable="field.clearable !== false"
            :style="{ width: field.width || '260px' }"
            @change="handleDateRangeChange(field, $event)"
          />
        </el-form-item>
      </template>

      <!-- 区域级插槽：追加额外搜索条件 -->
      <slot name="search-extra" />

      <!-- 搜索/重置按钮 -->
      <el-form-item v-if="showButtons">
        <slot name="search-buttons" :search="handleSearch" :reset="handleReset">
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
        </slot>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchBar - 搜索区组件
 *
 * 根据 searchFields 配置自动渲染搜索表单，支持：
 * - input / select / number / datePicker / dateRange / slot 类型
 * - dateRange 自动拆分为 startProp/endProp
 * - select 支持 optionsLoader 异步加载
 * - 字段级 hidden 动态显隐
 * - 字段级插槽 #field-{slot|prop}
 * - 区域级插槽 #search-extra
 * - 按钮插槽 #search-buttons
 */
import { Search, Refresh } from '@element-plus/icons-vue'
import { reactive, computed, onMounted, watch } from 'vue'

import type { SearchField, SearchSelect, SearchDateRange, RowData } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 搜索字段配置 */
    fields?: SearchField[]
    /** 查询参数对象（v-model） */
    queryParams: RowData
    /** 是否显示搜索/重置按钮 */
    showButtons?: boolean
    /** 搜索按钮文本 */
    searchText?: string
    /** 重置按钮文本 */
    resetText?: string
  }>(),
  {
    fields: () => [],
    showButtons: true,
    searchText: '搜索',
    resetText: '重置',
  },
)

const emit = defineEmits<{
  (e: 'search' | 'reset'): void
  (e: 'update:queryParams', params: RowData): void
}>()

/** 本地查询参数副本，避免直接修改 prop */
const localParams = reactive<RowData>({})

/** 同步 prop 到本地副本 */
watch(
  () => props.queryParams,
  (val) => {
    Object.keys(localParams).forEach((key) => {
      localParams[key] = undefined
    })
    Object.assign(localParams, val)
  },
  { immediate: true, deep: true },
)

/** 同步本地修改回父组件（合并父组件原有字段，避免丢失 pageNum/pageSize 等） */
function syncParams() {
  emit('update:queryParams', { ...props.queryParams, ...localParams })
}

/** 日期范围的本地值（数组形式） */
const dateRangeValues = reactive<Record<string, [string, string] | null>>({})

/** 各字段的异步选项 */
const asyncOptions = reactive<
  Record<string, { label: string; value: string | number | boolean; disabled?: boolean }[]>
>({})

/** 过滤可见字段 */
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (typeof field.hidden === 'function') {
      return !field.hidden(localParams)
    }
    return true
  })
})

/** 获取字段选项（静态或异步） */
function getFieldOptions(field: SearchSelect) {
  if (field.optionsLoader && asyncOptions[field.prop]) {
    return asyncOptions[field.prop]
  }
  return field.options || []
}

/** 日期范围变化时，拆分到 queryParams */
function handleDateRangeChange(field: SearchDateRange, val: [string, string] | null) {
  if (val && val.length === 2) {
    localParams[field.startProp] = val[0]
    localParams[field.endProp] = val[1]
  } else {
    localParams[field.startProp] = undefined
    localParams[field.endProp] = undefined
  }
  syncParams()
}

/** 搜索 */
function handleSearch() {
  // 先把本地搜索条件同步回父组件 queryParams，再触发搜索请求
  syncParams()
  emit('search')
}

/** 重置 */
function handleReset() {
  // 重置所有搜索字段
  props.fields.forEach((field) => {
    if (field.type === 'dateRange') {
      const dr = field as SearchDateRange
      localParams[dr.startProp] = undefined
      localParams[dr.endProp] = undefined
      dateRangeValues[field.prop] = null
    } else {
      localParams[field.prop] = undefined
    }
  })
  syncParams()
  emit('reset')
}

/** 异步加载选项 */
onMounted(() => {
  props.fields.forEach((field) => {
    if (field.type === 'select') {
      const selectField = field as SearchSelect
      if (selectField.optionsLoader) {
        selectField
          .optionsLoader()
          .then((options) => {
            asyncOptions[field.prop] = options
          })
          .catch(() => {
            asyncOptions[field.prop] = []
          })
      }
    }
  })
})

// 同步日期范围的初始值
watch(
  () => props.queryParams,
  () => {
    props.fields.forEach((field) => {
      if (field.type === 'dateRange') {
        const dr = field as SearchDateRange
        const start = localParams[dr.startProp]
        const end = localParams[dr.endProp]
        if (start && end) {
          dateRangeValues[field.prop] = [start, end]
        }
      }
    })
  },
  { immediate: true, deep: true },
)
</script>

<style lang="scss" scoped>
.search-bar {
  width: 100%;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}
</style>
