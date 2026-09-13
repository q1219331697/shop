<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? `编辑${name}` : `新增${name}`"
    :width="width"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <CrudForm
      ref="formRef"
      :fields="fields"
      :form-data="formData"
      :rules="rules"
      :is-edit="isEdit"
      :submitting="submitting"
      :label-width="labelWidth"
      @submit="emit('submit', $event)"
    >
      <!-- 透传表单字段插槽 -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </CrudForm>
    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '确 定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * CrudFormDialog - 新增/编辑表单对话框
 *
 * 仅保留 el-dialog 外壳，内层表单委托 CrudForm 渲染，
 * 保证与「独立页面」复用同一套字段渲染与校验逻辑。
 */
import type { FormRules } from 'element-plus'
import { ref, computed } from 'vue'

import CrudForm from './CrudForm.vue'
import type { FormField, RowData } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue: boolean
    /** 模块名称 */
    name: string
    /** 对话框宽度 */
    width?: string
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
    width: '520px',
    fields: () => [],
    submitting: false,
    labelWidth: '80px',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', data: RowData): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const formRef = ref<InstanceType<typeof CrudForm>>()

/** 触发表单提交 */
function handleSubmit() {
  formRef.value?.submit()
}

/** 关闭后重置 */
function handleClosed() {
  formRef.value?.resetFields()
}
</script>
