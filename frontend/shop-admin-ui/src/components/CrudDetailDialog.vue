<template>
  <el-dialog v-model="visible" :title="`${name}详情`" :width="width" destroy-on-close>
    <CrudDetailContent :fields="fields" :data="data" :loading="loading">
      <!-- 透传详情字段插槽 -->
      <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotData">
        <slot :name="slotName" v-bind="slotData" />
      </template>
    </CrudDetailContent>
    <template #footer>
      <el-button @click="visible = false">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" generic="T extends RowData">
/**
 * CrudDetailDialog - 详情对话框
 *
 * 仅保留 el-dialog 外壳，内层描述列表委托 CrudDetailContent 渲染，
 * 保证与「独立页面」复用同一套详情渲染逻辑。
 */
import { computed } from 'vue'

import CrudDetailContent from './CrudDetailContent.vue'
import type { DetailField, RowData } from './CrudTable/types'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue: boolean
    /** 模块名称 */
    name: string
    /** 对话框宽度 */
    width?: string
    /** 详情字段配置 */
    fields?: DetailField<T>[]
    /** 详情数据，未加载完成时为 null */
    data: T | null
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
</script>
