/**
 * 基础组件统一出口
 *
 * 列表页体系：PageContainer / SearchBar / ActionBar / DataArea / CrudTable
 * 任务页体系：SubPage（骨架）/ CrudForm / CrudDetailContent / InfoBar
 * 弹窗体系：CrudFormDialog / CrudDetailDialog
 *
 * 页面按需引入，布局与样式规格都封装在组件内，页面不再自行定义。
 */
export { default as CrudTable } from '../CrudTable.vue'
export { default as PageContainer } from '../PageContainer.vue'
export { default as SearchBar } from '../SearchBar.vue'
export { default as ActionBar } from '../ActionBar.vue'
export { default as DataArea } from '../DataArea.vue'
export { default as SubPage } from '../SubPage.vue'
export { default as InfoBar } from '../InfoBar.vue'
export { default as CrudForm } from '../CrudForm.vue'
export { default as CrudDetailContent } from '../CrudDetailContent.vue'
export { default as CrudFormDialog } from '../CrudFormDialog.vue'
export { default as CrudDetailDialog } from '../CrudDetailDialog.vue'

export type {
  SearchField,
  SearchInput,
  SearchSelect,
  SearchNumber,
  SearchDatePicker,
  SearchDateRange,
  SearchSlot,
  ActionContext,
  ActionItem,
  ActionHandlers,
  ActionsConfig,
  ColumnType,
  TagType,
  TagMap,
  TableColumn,
  FormFieldType,
  FormField,
  DetailFieldType,
  DetailField,
  CrudApi,
  CrudSchema,
  CrudMethods,
} from './types'
