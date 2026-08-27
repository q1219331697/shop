<template>
  <PageContainer>
    <!-- 搜索区 -->
    <template v-if="resolvedSchema.searchFields && resolvedSchema.searchFields.length > 0" #search>
      <SearchBar
        v-model:query-params="queryParams"
        :fields="resolvedSchema.searchFields"
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
        :actions="resolvedSchema.actions?.toolbar ?? undefined"
        :extra-actions="resolvedSchema.actions?.extraToolbar"
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
        :columns="resolvedSchema.columns"
        :data="tableData"
        :loading="loading"
        :selectable="resolvedSchema.selectable !== false"
        :expandable="resolvedSchema.expandable || false"
        :border="resolvedSchema.border !== false"
        :stripe="resolvedSchema.stripe !== false"
        :row-key="resolvedSchema.rowKey || 'id'"
        :row-actions="resolvedSchema.actions?.rowActions"
        :row-actions-width="resolvedSchema.rowActionsWidth || 200"
        :row-actions-fixed="resolvedSchema.rowActionsFixed || 'right'"
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
      v-if="resolvedSchema.formFields && resolvedSchema.formFields.length > 0"
      v-model="formDialogVisible"
      :name="resolvedSchema.name"
      :width="resolvedSchema.formDialogWidth || '520px'"
      :fields="resolvedSchema.formFields"
      :form-data="formData"
      :rules="resolvedSchema.formRules"
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
      v-if="
        resolvedSchema.detailEnabled !== false &&
        resolvedSchema.detailFields &&
        resolvedSchema.detailFields.length > 0
      "
      v-model="detailDialogVisible"
      :name="resolvedSchema.name"
      :width="resolvedSchema.detailDialogWidth || '520px'"
      :fields="resolvedSchema.detailFields"
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
 * CrudTable - CRUD 表格编排组件
 *
 * 一键组装：SearchBar + ActionBar + DataArea + CrudFormDialog + CrudDetailDialog
 * 通过 schema 配置驱动，同时支持插槽扩展。
 *
 * 使用方式：
 * <CrudTable :schema="roleSchema" @action="onCustomAction" />
 */
import { computed, onMounted } from 'vue'
import PageContainer from './PageContainer.vue'
import SearchBar from './SearchBar.vue'
import ActionBar from './ActionBar.vue'
import DataArea from './DataArea.vue'
import CrudFormDialog from './CrudFormDialog.vue'
import CrudDetailDialog from './CrudDetailDialog.vue'
import { useCrud } from '@/composables/use-crud'
import type {
  CrudApi,
  CrudSchema,
  RowData,
  ActionHandlers,
  ActionItem,
  CrudMethods,
} from './CrudTable/types'

const props = defineProps<{
  /** CRUD Schema 配置 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: CrudSchema<any>
  /** API 模块，遵循 CrudApi 契约 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api?: CrudApi<any, any>
  /** 操作 handler 映射，按 action 标识自动注入到 toolbar/rowActions */
  handlers?: ActionHandlers
  /** CRUD 方法约定，实现固定名称的方法，CrudTable 在对应时机自动调用 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods?: CrudMethods<any>
}>()

const emit = defineEmits<{
  /** 自定义操作事件（非内置的 create/edit/detail/delete） */
  (e: 'action', action: string, data?: unknown): void
}>()

/** 将 handlers 按 action 匹配注入到 actions 配置中 */
const resolvedSchema = computed(() => {
  if (!props.handlers) return props.schema
  const handlers = props.handlers
  const schema = { ...props.schema }
  const injectHandlers = (items: ActionItem[] | undefined) => {
    if (!items) return items
    return items.map((item) =>
      item.action in handlers ? { ...item, handler: handlers[item.action] } : item,
    )
  }
  if (schema.actions) {
    schema.actions = {
      ...schema.actions,
      toolbar: injectHandlers(schema.actions.toolbar),
      extraToolbar: injectHandlers(schema.actions.extraToolbar),
      rowActions: injectHandlers(schema.actions.rowActions),
    }
  }
  return schema
})

/** 表单标签宽度 - 根据字段 label 自动估算 */
const formLabelWidth = computed(() => {
  if (!resolvedSchema.value.formFields) return '80px'
  const maxLen = resolvedSchema.value.formFields.reduce((max: number, f) => {
    return Math.max(max, f.label.length)
  }, 0)
  // 每个中文字符约 14px + 12px 间距
  return Math.max(80, maxLen * 14 + 12) + 'px'
})

/** 初始化 useCrud */
const crudApi = props.api

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
  listApi: crudApi?.list,
  detailApi: crudApi?.detail,
  createApi: crudApi?.create,
  updateApi: crudApi?.update,
  deleteApi: crudApi?.delete,
  batchDeleteApi: crudApi?.batchDelete,
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

/** 组件挂载后加载列表数据 */
onMounted(() => {
  if (props.methods?.onList) {
    props.methods.onList()
  } else {
    fetchData()
  }
})

/** 处理工具栏操作 */
function handleToolbarAction(action: string) {
  // 优先调用 methods 约定方法
  if (action === 'create' && props.methods?.onCreate) {
    props.methods.onCreate()
    return
  }
  const builtinActions = ['create', 'edit', 'detail', 'delete']
  if (builtinActions.includes(action)) {
    crudHandleToolbarAction(action)
  } else {
    emit('action', action)
  }
}

/** 处理行操作 */
function handleRowAction(action: string, row: RowData) {
  // 优先调用 methods 约定方法
  if (action === 'detail' && props.methods?.onDetail) {
    props.methods.onDetail(row)
    return
  }
  if (action === 'edit' && props.methods?.onUpdate) {
    props.methods.onUpdate(row)
    return
  }
  if (action === 'delete' && props.methods?.onDelete) {
    props.methods.onDelete(row)
    return
  }
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
