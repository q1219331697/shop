/**
 * useCrud - CRUD 页面核心逻辑
 *
 * 封装列表/分页/选择/操作状态管理，
 * 供 CrudPage 和自由组装页面使用。
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ActionContext, SearchField, SearchDateRange } from '../components/CrudPage/types'

type RowData = Record<string, unknown>

interface UseCrudOptions<T extends RowData = RowData> {
  /** 列表请求 */
  listApi: (params: Record<string, unknown>) => Promise<{ list: T[]; total: number }>
  /** 详情请求 */
  detailApi?: (id: string | number) => Promise<T>
  /** 新增请求 */
  createApi?: (data: Record<string, unknown>) => Promise<unknown>
  /** 编辑请求 */
  updateApi?: (id: string | number, data: Record<string, unknown>) => Promise<unknown>
  /** 删除请求 */
  deleteApi?: (id: string | number) => Promise<unknown>
  /** 批量删除请求 */
  batchDeleteApi?: (ids: (string | number)[]) => Promise<unknown>
  /** 默认分页大小 */
  defaultPageSize?: number
  /** 默认查询参数 */
  defaultParams?: Record<string, unknown>
  /** 搜索字段配置（用于重置时清空） */
  searchFields?: SearchField[]
  /** 行唯一键，默认 id */
  rowKey?: string
}

export function useCrud<T extends RowData = RowData>(options: UseCrudOptions<T>) {
  const {
    listApi,
    detailApi,
    createApi,
    updateApi,
    deleteApi,
    batchDeleteApi,
    defaultPageSize = 10,
    defaultParams = {},
    searchFields = [],
    rowKey = 'id',
  } = options

  // ==================== 列表相关 ====================
  const loading = ref(false)
  const tableData = ref<T[]>([])
  const total = ref(0)

  const queryParams = reactive<Record<string, unknown>>({
    pageNum: 1,
    pageSize: defaultPageSize,
    ...getDefaultSearchValues(),
    ...defaultParams,
  })

  /** 获取搜索字段默认值 */
  function getDefaultSearchValues(): Record<string, unknown> {
    const values: Record<string, unknown> = {}
    searchFields.forEach((field) => {
      if (field.type === 'dateRange') {
        const dr = field as SearchDateRange
        values[dr.startProp] = undefined
        values[dr.endProp] = undefined
      } else {
        values[field.prop] = undefined
      }
    })
    return values
  }

  /** 获取列表数据 */
  async function fetchData() {
    loading.value = true
    try {
      const result = await listApi(queryParams)
      tableData.value = result.list || []
      total.value = result.total || 0
    } catch {
      tableData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 搜索 */
  function handleSearch() {
    queryParams.pageNum = 1
    fetchData()
  }

  /** 重置 */
  function handleReset() {
    const defaults = getDefaultSearchValues()
    Object.keys(defaults).forEach((key) => {
      queryParams[key] = defaults[key]
    })
    queryParams.pageNum = 1
    queryParams.pageSize = defaultPageSize
    Object.keys(defaultParams).forEach((key) => {
      queryParams[key] = defaultParams[key]
    })
    fetchData()
  }

  /** 分页变化 */
  function handlePageChange(page: number) {
    queryParams.pageNum = page
    fetchData()
  }

  /** 每页条数变化 */
  function handleSizeChange(size: number) {
    queryParams.pageSize = size
    queryParams.pageNum = 1
    fetchData()
  }

  // ==================== 选择相关 ====================
  const selectedRows = ref<T[]>([])
  const selectedIds = ref<(string | number)[]>([])

  function handleSelectionChange(rows: T[]) {
    selectedRows.value = rows
    selectedIds.value = rows.map((r) => r[rowKey] as string | number)
  }

  /** 操作上下文 */
  const actionContext = computed(() => ({
    selectedRows: selectedRows.value as T[],
    selectedIds: selectedIds.value,
    selectedCount: selectedIds.value.length,
    loading: loading.value,
  }) as ActionContext<T>)

  // ==================== 操作处理 ====================

  /** 处理工具栏操作 */
  async function handleToolbarAction(action: string) {
    switch (action) {
      case 'create':
        openFormDialog(false)
        break
      case 'edit':
        if (selectedRows.value.length !== 1) return
        openFormDialog(true, selectedRows.value[0] as T)
        break
      case 'detail':
        if (selectedRows.value.length !== 1) return
        openDetailDialog(selectedRows.value[0] as T)
        break
      case 'delete':
        await handleBatchDelete()
        break
      default:
        // 自定义操作由外部处理
        break
    }
  }

  /** 处理行操作 */
  async function handleRowAction(action: string, row: T) {
    switch (action) {
      case 'edit':
        openFormDialog(true, row)
        break
      case 'detail':
        openDetailDialog(row)
        break
      case 'delete':
        await handleSingleDelete(row)
        break
      default:
        // 自定义操作由外部处理
        break
    }
  }

  /** 单条删除 */
  async function handleSingleDelete(row: T) {
    if (!deleteApi) return
    try {
      await deleteApi(row[rowKey] as string | number)
      ElMessage.success('删除成功')
      fetchData()
    } catch {
      // 请求工具已处理错误提示
    }
  }

  /** 批量删除 */
  async function handleBatchDelete() {
    if (selectedIds.value.length === 0) return
    try {
      await ElMessageBox.confirm(
        `确定删除选中的 ${selectedIds.value.length} 条数据吗？`,
        '删除',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
      )
    } catch {
      return
    }
    try {
      if (batchDeleteApi) {
        await batchDeleteApi(selectedIds.value)
      } else if (deleteApi) {
        await Promise.all(selectedIds.value.map((id) => deleteApi(id)))
      }
      ElMessage.success('删除成功')
      selectedIds.value = []
      selectedRows.value = []
      fetchData()
    } catch {
      // 请求工具已处理错误提示
    }
  }

  // ==================== 表单对话框 ====================
  const formDialogVisible = ref(false)
  const isEdit = ref(false)
  const submitting = ref(false)
  const formData = reactive<Record<string, unknown>>({})

  /** 打开表单对话框 */
  function openFormDialog(edit: boolean, row?: T) {
    isEdit.value = edit
    if (edit && row) {
      Object.keys(formData).forEach((key) => {
        formData[key] = undefined
      })
      Object.assign(formData, { ...row })
    } else {
      Object.keys(formData).forEach((key) => {
        formData[key] = undefined
      })
    }
    formDialogVisible.value = true
  }

  /** 提交表单 */
  async function handleSubmitForm(data: Record<string, unknown>) {
    submitting.value = true
    try {
      if (isEdit.value && updateApi) {
        const id = data[rowKey] as string | number
        await updateApi(id, data)
        ElMessage.success('更新成功')
      } else if (createApi) {
        await createApi(data)
        ElMessage.success('创建成功')
      }
      formDialogVisible.value = false
      fetchData()
    } catch {
      // 请求工具已处理错误提示
    } finally {
      submitting.value = false
    }
  }

  // ==================== 详情对话框 ====================
  const detailDialogVisible = ref(false)
  const detailLoading = ref(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailData = ref<any>({})

  /** 打开详情对话框 */
  async function openDetailDialog(row: T) {
    detailDialogVisible.value = true
    detailLoading.value = true
    try {
      if (detailApi) {
        const data = await detailApi(row[rowKey] as string | number)
        detailData.value = data
      } else {
        detailData.value = { ...row }
      }
    } catch {
      detailData.value = { ...row }
    } finally {
      detailLoading.value = false
    }
  }

  // ==================== 初始化 ====================
  onMounted(() => {
    fetchData()
  })

  return {
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
    handleToolbarAction,
    handleRowAction,
    handleSingleDelete,
    handleBatchDelete,

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
  }
}
