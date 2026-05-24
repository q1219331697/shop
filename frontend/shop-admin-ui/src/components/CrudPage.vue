<template>
  <PageContainer>
    <!-- 搜索区 -->
    <template v-if="schema.searchFields && schema.searchFields.length > 0" #search>
      <SearchBar
        :fields="schema.searchFields"
        :query-params="queryParams"
        :show-buttons="true"
        @search="handleSearch"
        @reset="handleReset"
      >
        <!-- 透传搜索字段插槽 -->
        <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData" />
        </template>
      </SearchBar>
    </template>

    <!-- 按钮区 -->
    <template #actions>
      <ActionBar
        :actions="schema.actions?.toolbar ?? undefined"
        :extra-actions="schema.actions?.extraToolbar"
        :context="actionContext"
        @action="handleToolbarAction"
      >
        <!-- 透传工具栏插槽 -->
        <template v-if="$slots['toolbar-prefix']" #toolbar-prefix>
          <slot name="toolbar-prefix" />
        </template>
        <template v-if="$slots['toolbar-suffix']" #toolbar-suffix>
          <slot name="toolbar-suffix" />
        </template>
      </ActionBar>
    </template>

    <!-- 数据展示区 -->
    <template #data>
      <DataArea
        :columns="schema.columns"
        :data="tableData"
        :loading="loading"
        :selectable="schema.selectable !== false"
        :expandable="schema.expandable || false"
        :border="schema.border !== false"
        :stripe="schema.stripe !== false"
        :row-key="schema.rowKey || 'id'"
        :row-actions="schema.actions?.rowActions"
        :row-actions-width="schema.rowActionsWidth || 200"
        :row-actions-fixed="schema.rowActionsFixed || 'right'"
        :pagination="{
          total: total,
          pageNum: queryParams.pageNum as number,
          pageSize: queryParams.pageSize as number,
        }"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @action="handleRowAction"
      >
        <!-- 透传列级插槽 -->
        <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData" />
        </template>
      </DataArea>
    </template>

    <!-- 默认插槽：对话框等 -->
    <slot name="default" />

    <!-- 新增/编辑对话框 -->
    <CrudFormDialog
      v-if="schema.formFields && schema.formFields.length > 0"
      v-model="formDialogVisible"
      :name="schema.name"
      :width="schema.formDialogWidth || '520px'"
      :fields="schema.formFields"
      :form-data="formData"
      :rules="schema.formRules"
      :is-edit="isEdit"
      :submitting="submitting"
      :label-width="formLabelWidth"
      @submit="handleSubmitForm"
    >
      <!-- 透传表单字段插槽 -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </CrudFormDialog>

    <!-- 详情对话框 -->
    <CrudDetailDialog
      v-if="schema.detailEnabled !== false && schema.detailFields && schema.detailFields.length > 0"
      v-model="detailDialogVisible"
      :name="schema.name"
      :width="schema.detailDialogWidth || '520px'"
      :fields="schema.detailFields"
      :data="detailData"
      :loading="detailLoading"
    >
      <!-- 透传详情字段插槽 -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </CrudDetailDialog>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * CrudPage - CRUD 页面编排组件
 *
 * 一键组装：SearchBar + ActionBar + DataArea + CrudFormDialog + CrudDetailDialog
 * 通过 schema 配置驱动，同时支持插槽扩展。
 *
 * 使用方式：
 * <CrudPage :schema="roleSchema" @action="onCustomAction" />
 */
import { computed } from 'vue'
import PageContainer from './PageContainer.vue'
import SearchBar from './SearchBar.vue'
import ActionBar from './ActionBar.vue'
import DataArea from './DataArea.vue'
import CrudFormDialog from './CrudFormDialog.vue'
import CrudDetailDialog from './CrudDetailDialog.vue'
import { useCrud } from '@/composables/use-crud'
import type { CrudSchema, RowData } from './CrudPage/types'

const props = defineProps<{
  /** CRUD Schema 配置 */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: CrudSchema<any, any>
}>()

const emit = defineEmits<{
  /** 自定义操作事件（非内置的 create/edit/detail/delete） */
  (e: 'action', action: string, data?: unknown): void
}>()

/** 表单标签宽度 - 根据字段 label 自动估算 */
const formLabelWidth = computed(() => {
  if (!props.schema.formFields) return '80px'
  const maxLen = props.schema.formFields.reduce((max, f) => {
    return Math.max(max, f.label.length)
  }, 0)
  // 每个中文字符约 14px + 12px 间距
  return Math.max(80, maxLen * 14 + 12) + 'px'
})

/** 初始化 useCrud */
const {
  // 列表
  loading,
  tableData,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  // 选择
  selectedRows,
  selectedIds,
  handleSelectionChange,
  actionContext,
  // 操作
  handleToolbarAction: crudHandleToolbarAction,
  handleRowAction: crudHandleRowAction,
  // 表单对话框
  formDialogVisible,
  isEdit,
  submitting,
  formData,
  openFormDialog,
  handleSubmitForm,
  // 详情对话框
  detailDialogVisible,
  detailLoading,
  detailData,
  openDetailDialog,
} = useCrud({
  listApi: props.schema.listApi,
  detailApi: props.schema.detailApi,
  createApi: props.schema.createApi,
  updateApi: props.schema.updateApi,
  deleteApi: props.schema.deleteApi,
  batchDeleteApi: props.schema.batchDeleteApi,
  defaultPageSize: 10,
  searchFields: props.schema.searchFields || [],
  rowKey: props.schema.rowKey || 'id',
})

/** 初始化 formData 默认值 */
if (props.schema.defaultFormData) {
  Object.keys(props.schema.defaultFormData).forEach((key) => {
    formData[key] = props.schema.defaultFormData?.[key]
  })
}

/** 处理工具栏操作 */
function handleToolbarAction(action: string) {
  const builtinActions = ['create', 'edit', 'detail', 'delete']
  if (builtinActions.includes(action)) {
    crudHandleToolbarAction(action)
  } else {
    emit('action', action)
  }
}

/** 处理行操作 */
function handleRowAction(action: string, row: RowData) {
  const builtinActions = ['edit', 'detail', 'delete']
  if (builtinActions.includes(action)) {
    crudHandleRowAction(action, row)
  } else {
    emit('action', action, row)
  }
}

/** 暴露实例供外部使用 */
defineExpose({
  crud: {
    loading,
    tableData,
    total,
    queryParams,
    fetchData,
    selectedRows,
    selectedIds,
    handleSelectionChange,
    actionContext,
    formDialogVisible,
    isEdit,
    submitting,
    formData,
    openFormDialog,
    handleSubmitForm,
    detailDialogVisible,
    detailLoading,
    detailData,
    openDetailDialog,
  },
  refresh: fetchData,
  openFormDialog,
  openDetailDialog,
})
</script>
