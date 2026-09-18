/**
 * CrudTable 类型定义
 */
import type { FormRules } from 'element-plus'
import type { Component } from 'vue'

/** 行数据类型 - 动态键值对象，用于表格行、表单数据等场景 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RowData = Record<string, any>

/** ID 类型 */
export type IdType = string | number

// ==================== 搜索区 ====================

/** 搜索字段基础属性 */
interface SearchFieldBase {
  /** 字段属性名，对应 queryParams 的 key */
  prop: string
  /** 标签文本 */
  label: string
  /** 标签宽度 */
  labelWidth?: string | number
  /** 组件宽度 */
  width?: string | number
  /** 占位文本 */
  placeholder?: string
  /** 是否可清空，默认 true */
  clearable?: boolean
  /** 是否隐藏该字段 */
  hidden?: (queryParams: Record<string, unknown>) => boolean
}

/** 输入框 */
export interface SearchInput extends SearchFieldBase {
  type: 'input'
  maxlength?: number
}

/** 选择器 */
export interface SearchSelect extends SearchFieldBase {
  type: 'select'
  options?: { label: string; value: string | number | boolean; disabled?: boolean }[]
  /** 远程加载选项 */
  optionsLoader?: () => Promise<{ label: string; value: string | number | boolean }[]>
  multiple?: boolean
}

/** 数字输入 */
export interface SearchNumber extends SearchFieldBase {
  type: 'number'
  min?: number
  max?: number
  precision?: number
}

/** 日期选择 */
export interface SearchDatePicker extends SearchFieldBase {
  type: 'datePicker'
  /** 日期类型 */
  dateType?: 'date' | 'datetime' | 'week' | 'month' | 'year'
  /** 显示格式化 */
  format?: string
  /** 值格式化 */
  valueFormat?: string
}

/** 日期范围 - 一个字段对应两个 queryParams key */
export interface SearchDateRange extends SearchFieldBase {
  type: 'dateRange'
  /** 开始时间对应的 prop，必填 */
  startProp: string
  /** 结束时间对应的 prop，必填 */
  endProp: string
  /** 分隔符，默认 '~' */
  rangeSeparator?: string
  dateType?: 'daterange' | 'datetimerange' | 'monthrange'
  format?: string
  valueFormat?: string
}

/** 自定义插槽 - 完全自定义渲染 */
export interface SearchSlot extends SearchFieldBase {
  type: 'slot'
  /** 插槽名称，默认取 prop */
  slot?: string
}

/** 搜索字段联合类型 */
export type SearchField =
  | SearchInput
  | SearchSelect
  | SearchNumber
  | SearchDatePicker
  | SearchDateRange
  | SearchSlot

// ==================== 按钮区 ====================

/** 操作按钮上下文 */
export interface ActionContext<T = RowData> {
  /** 已选中的行数据 */
  selectedRows: T[]
  /** 已选中的 ID 列表 */
  selectedIds: (string | number)[]
  /** 已选中的行数 */
  selectedCount: number
  /** 当前是否正在加载 */
  loading: boolean
  /** 刷新列表数据 */
  refresh: () => void
}

/** 操作按钮配置 */
export interface ActionItem<T = RowData> {
  /** 操作标识 */
  action: string
  /** 按钮文本（与默认按钮合并时可省略） */
  label?: string
  /** 图标组件名 */
  icon?: string | Component
  /** 按钮类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  /** 浅色（plain）形态：用于低频的次要操作，把视觉重心让给高频操作 */
  plain?: boolean
  /**
   * 自定义按钮样式类名：Element Plus 内置语义色之外的形态变体
   * （见 global.scss 的 .el-button.btn-outline —— 白底 + 主色文字的线框按钮）。
   * 特异性高于按钮自身的 type，会覆盖其填充色与边框。
   */
  colorClass?: string
  /** 是否显示，默认 true */
  visible?: boolean | ((ctx: ActionContext<T>) => boolean)
  /** 是否禁用 */
  disabled?: boolean | ((ctx: ActionContext<T>) => boolean)
  /** 确认提示文案，有值则点击弹出确认框 */
  confirm?: string | ((ctx: ActionContext<T>) => string)
  /**
   * 自定义处理函数，配置后直接调用，不再 emit action 事件
   * - 工具栏按钮：接收 ActionContext
   * - 行操作按钮：接收当前行数据
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler?: (ctx: any) => void
}

/** 操作 handler 映射，key 为 action 标识，value 为处理函数 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionHandlers = Record<string, (ctx: any) => void>

/** CRUD 方法约定 - 使用方实现固定名称的方法，CrudTable 在对应时机自动调用 */
export interface CrudMethods<T = RowData> {
  /** 页面加载时自动调用 */
  onList?: () => void
  /** 新增操作，点击新增按钮时调用 */
  onCreate?: () => void
  /** 详情操作，点击详情按钮时调用 */
  onDetail?: (row: T) => void
  /** 编辑操作，点击编辑按钮时调用 */
  onUpdate?: (row: T) => void
  /** 删除操作，点击删除按钮时调用 */
  onDelete?: (row: T) => void
}

/** ActionBar 完整配置 */
export interface ActionsConfig<T = RowData> {
  /** 工具栏按钮（不配置则默认4个：新增/编辑/详情/删除） */
  toolbar?: ActionItem<T>[]
  /** 追加到默认工具栏后面的额外按钮 */
  extraToolbar?: ActionItem<T>[]
  /** 行操作按钮（不配置则默认3个：编辑/详情/删除） */
  rowActions?: ActionItem<T>[]
}

// ==================== 数据区 ====================

/** 列类型 */
export type ColumnType = 'default' | 'index' | 'tag' | 'date' | 'boolean' | 'image' | 'money'

/** Tag 映射配置 */
export interface TagMap {
  [value: string | number]: [string, string]
}

/** 表格列配置 */
export interface TableColumn<T = RowData> {
  /** 字段属性名 */
  prop: string
  /** 列标题 */
  label: string
  /** 列类型，默认 'default' */
  type?: ColumnType
  /** 列宽度 */
  width?: number | string
  /** 最小列宽度 */
  minWidth?: number | string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否固定列 */
  fixed?: 'left' | 'right' | boolean
  /** 是否溢出提示 */
  showOverflowTooltip?: boolean

  // ---- type: 'tag' ----
  tagMap?: TagMap

  // ---- type: 'date' ----
  dateFormat?: string

  // ---- type: 'boolean' ----
  trueText?: string
  falseText?: string
  trueType?: string
  falseType?: string

  // ---- type: 'money' ----
  prefix?: string
  precision?: number

  // ---- type: 'image' ----
  imageWidth?: number
  imageHeight?: number

  // ---- 通用扩展 ----
  formatter?: (value: unknown, row: T, column: TableColumn<T>) => string
  /** 是否显示该列 */
  visible?: boolean | ((row: T) => boolean)
  /** 自定义单元格插槽名，默认取 prop */
  slot?: string
}

// ==================== 表单区 ====================

/** 表单字段类型 */
export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'datePicker'
  | 'dateRange'
  | 'switch'
  | 'slot'

/** 表单字段配置 */
export interface FormField {
  /** 字段属性名 */
  prop: string
  /** 标签文本 */
  label: string
  /** 字段类型 */
  type: FormFieldType
  /** 标签宽度 */
  labelWidth?: string | number
  /** 占位文本 */
  placeholder?: string
  /** 是否必填（仅UI提示，校验由 rules 控制） */
  required?: boolean
  /** 校验规则（字符串则使用内置规则，如 'required'） */
  rules?: string | FormRules
  /** 是否隐藏 */
  hidden?: (formData: Record<string, unknown>, isEdit: boolean) => boolean
  /** 组件宽度 */
  width?: string | number
  /** 是否可清空 */
  clearable?: boolean

  // ---- type: 'input' ----
  maxlength?: number
  /** 是否密码框 */
  password?: boolean

  // ---- type: 'textarea' ----
  rows?: number

  // ---- type: 'number' ----
  min?: number
  max?: number
  precision?: number

  // ---- type: 'select' ----
  options?: { label: string; value: string | number | boolean; disabled?: boolean }[]
  optionsLoader?: () => Promise<{ label: string; value: string | number | boolean }[]>
  multiple?: boolean

  // ---- type: 'radio' ----
  radios?: { label: string; value: string | number | boolean }[]

  // ---- type: 'datePicker' ----
  dateType?: 'date' | 'datetime' | 'week' | 'month' | 'year'
  format?: string
  valueFormat?: string

  // ---- type: 'dateRange' ----
  startProp?: string
  endProp?: string
  rangeSeparator?: string

  // ---- type: 'switch' ----
  activeValue?: string | number | boolean
  inactiveValue?: string | number | boolean

  // ---- type: 'slot' ----
  slot?: string
}

// ==================== 详情区 ====================

/** 详情字段类型 */
export type DetailFieldType = 'default' | 'tag' | 'date' | 'boolean' | 'money' | 'image' | 'slot'

/** 详情字段配置 */
export interface DetailField<T = RowData> {
  /** 字段属性名 */
  prop: string
  /** 标签文本 */
  label: string
  /** 字段类型 */
  type?: DetailFieldType
  /** 格式化函数 */
  formatter?: (value: unknown, row: T) => string

  // ---- type: 'tag' ----
  tagMap?: TagMap

  // ---- type: 'date' ----
  dateFormat?: string

  // ---- type: 'boolean' ----
  trueText?: string
  falseText?: string
  trueType?: string
  falseType?: string

  // ---- type: 'money' ----
  prefix?: string
  precision?: number

  // ---- type: 'slot' ----
  slot?: string
}

// ==================== Schema ====================

/** CRUD API 契约接口 - 遵循此契约的 API 模块可直接传给 schema.api */

export interface CrudApi<T = RowData, Id = IdType> {
  /** 列表请求 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params: any) => Promise<{ list: T[]; total: number }>
  /** 详情请求 */
  detail?: (id: Id) => Promise<T>
  /** 新增请求 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create?: (data: any) => Promise<unknown>
  /** 编辑请求 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update?: (id: Id, data: any) => Promise<unknown>
  /** 删除请求 */
  delete?: (id: Id) => Promise<unknown>
  /** 批量删除请求 */
  batchDelete?: (ids: Id[]) => Promise<unknown>
}

/** CRUD Schema 完整配置 */
export interface CrudSchema<T extends RowData = RowData> {
  /** 模块名称（用于对话框标题等） */
  name: string
  /** 行唯一键，默认 'id' */
  rowKey?: string

  // ---- 搜索区 ----
  searchFields?: SearchField[]

  // ---- 按钮区 ----
  actions?: ActionsConfig<T>

  // ---- 数据区 ----
  columns: TableColumn<T>[]
  /** 是否支持多选，默认 true */
  selectable?: boolean
  /** 是否支持展开行 */
  expandable?: boolean
  /** 是否显示边框，默认 true */
  border?: boolean
  /** 是否显示斑马纹，默认 true */
  stripe?: boolean
  /** 行操作列宽度 */
  rowActionsWidth?: number
  /** 行操作列是否固定，默认 'right' */
  rowActionsFixed?: 'left' | 'right' | boolean

  // ---- 表单区 ----
  formFields?: FormField[]
  /** 表单校验规则 */
  formRules?: FormRules
  /** 表单默认数据 */
  defaultFormData?: Record<string, unknown>
  /** 对话框宽度 */
  formDialogWidth?: string

  // ---- 详情区 ----
  detailFields?: DetailField<T>[]
  /** 详情对话框宽度 */
  detailDialogWidth?: string
  /** 是否启用详情功能，默认 true */
  detailEnabled?: boolean
}
