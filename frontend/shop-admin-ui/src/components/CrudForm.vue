<template>
  <el-form ref="formRef" :model="localFormData" :rules="rules" :label-width="labelWidth">
    <template v-for="field in visibleFields" :key="field.prop">
      <!-- 插槽类型 -->
      <el-form-item
        v-if="field.type === 'slot'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <slot
          :name="`form-${field.slot || field.prop}`"
          :model="localFormData"
          :prop="field.prop"
          :is-edit="isEdit"
        />
      </el-form-item>

      <!-- 输入框 -->
      <el-form-item
        v-else-if="field.type === 'input'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-input
          v-model="localFormData[field.prop]"
          :type="field.password ? 'password' : undefined"
          :show-password="field.password"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :maxlength="field.maxlength"
          :clearable="field.clearable !== false"
          :style="{ width: field.width || '100%' }"
        />
      </el-form-item>

      <!-- 文本域 -->
      <el-form-item
        v-else-if="field.type === 'textarea'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-input
          v-model="localFormData[field.prop]"
          type="textarea"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :maxlength="field.maxlength"
          :rows="field.rows || 3"
          :style="{ width: field.width || '100%' }"
        />
      </el-form-item>

      <!-- 数字输入 -->
      <el-form-item
        v-else-if="field.type === 'number'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-input-number
          v-model="localFormData[field.prop]"
          :min="field.min"
          :max="field.max"
          :precision="field.precision"
          :style="{ width: field.width || '100%' }"
        />
      </el-form-item>

      <!-- 选择器 -->
      <el-form-item
        v-else-if="field.type === 'select'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-select
          v-model="localFormData[field.prop]"
          :placeholder="field.placeholder || `请选择${field.label}`"
          :clearable="field.clearable !== false"
          :multiple="field.multiple"
          :style="{ width: field.width || '100%' }"
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

      <!-- 单选 -->
      <el-form-item
        v-else-if="field.type === 'radio'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-radio-group v-model="localFormData[field.prop]">
          <el-radio
            v-for="radio in field.radios || []"
            :key="String(radio.value)"
            :value="radio.value"
          >
            {{ radio.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 日期选择 -->
      <el-form-item
        v-else-if="field.type === 'datePicker'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-date-picker
          v-model="localFormData[field.prop]"
          :type="field.dateType || 'date'"
          :placeholder="field.placeholder || `请选择${field.label}`"
          :format="field.format"
          :value-format="field.valueFormat"
          :clearable="field.clearable !== false"
          :style="{ width: field.width || '100%' }"
        />
      </el-form-item>

      <!-- 日期范围 -->
      <el-form-item
        v-else-if="field.type === 'dateRange'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-date-picker
          v-model="localFormData[field.prop]"
          :type="field.dateType || 'daterange'"
          :range-separator="field.rangeSeparator || '~'"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :format="field.format"
          :value-format="field.valueFormat"
          :clearable="field.clearable !== false"
          :style="{ width: field.width || '100%' }"
        />
      </el-form-item>

      <!-- 开关 -->
      <el-form-item
        v-else-if="field.type === 'switch'"
        :label="field.label"
        :label-width="field.labelWidth"
        :prop="field.prop"
      >
        <el-switch
          v-model="localFormData[field.prop]"
          :active-value="field.activeValue ?? 1"
          :inactive-value="field.inactiveValue ?? 0"
        />
      </el-form-item>
    </template>
  </el-form>
</template>

<script setup lang="ts">
/**
 * CrudForm - 表单本体（无弹窗外壳）
 *
 * 从 CrudFormDialog 抽取内层表单，供「弹窗」与「独立页面」共用，
 * 保证两种载体下的字段渲染与校验完全一致。
 *
 * 支持：input / textarea / number / select / radio / datePicker / dateRange / switch / slot
 */
import type { FormInstance, FormRules } from 'element-plus'
import { ref, reactive, computed, onMounted, watch } from 'vue'

import type { FormField, RowData } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 表单字段配置 */
    fields?: FormField[]
    /** 表单数据 */
    formData: RowData
    /** 校验规则 */
    rules?: FormRules
    /** 是否编辑模式 */
    isEdit: boolean
    /** 是否提交中 */
    submitting?: boolean
    /** 标签宽度 */
    labelWidth?: string
  }>(),
  {
    fields: () => [],
    submitting: false,
    labelWidth: '80px',
  },
)

const emit = defineEmits<{
  (e: 'submit', data: RowData): void
}>()

const formRef = ref<FormInstance>()

/** 本地表单数据副本，避免直接修改 prop */
const localFormData = reactive<RowData>({})

/** 同步 prop 到本地副本 */
watch(
  () => props.formData,
  (val) => {
    Object.keys(localFormData).forEach((key) => {
      localFormData[key] = undefined
    })
    Object.assign(localFormData, val)
  },
  { immediate: true, deep: true },
)

/** 异步选项 */
const asyncOptions = reactive<
  Record<string, { label: string; value: string | number | boolean; disabled?: boolean }[]>
>({})

/** 过滤可见字段 */
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (typeof field.hidden === 'function') {
      return !field.hidden(localFormData, props.isEdit)
    }
    return true
  })
})

/** 获取字段选项 */
function getFieldOptions(field: FormField) {
  if (field.optionsLoader && asyncOptions[field.prop]) {
    return asyncOptions[field.prop]
  }
  return field.options || []
}

/** 提交表单（校验失败不向上抛出） */
async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('submit', { ...localFormData })
}

/** 重置表单 */
function resetFields() {
  formRef.value?.resetFields()
}

/** 异步加载选项 */
function loadAsyncOptions() {
  props.fields.forEach((field) => {
    if (field.type === 'select' && field.optionsLoader && !asyncOptions[field.prop]) {
      field
        .optionsLoader()
        .then((options) => {
          asyncOptions[field.prop] = options
        })
        .catch(() => {
          asyncOptions[field.prop] = []
        })
    }
  })
}

onMounted(loadAsyncOptions)

defineExpose({ formRef, submit: handleSubmit, resetFields })
</script>
