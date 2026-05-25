/**
 * CrudTable 组件导出
 */
export { default as CrudTable } from '../CrudTable.vue'
export { default as PageContainer } from '../PageContainer.vue'
export { default as SearchBar } from '../SearchBar.vue'
export { default as ActionBar } from '../ActionBar.vue'
export { default as DataArea } from '../DataArea.vue'
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
