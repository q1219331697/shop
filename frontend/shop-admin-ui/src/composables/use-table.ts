/**
 * 表格通用逻辑
 */
import { ref, reactive, toRaw } from 'vue'
import type { PageParams, PageResult } from '@/api/types'

interface UseTableOptions<T, P> {
  /** 请求方法 */
  fetchApi: (params: P & PageParams) => Promise<PageResult<T>>
  /** 默认分页大小 */
  defaultPageSize?: number
  /** 默认查询参数 */
  defaultParams?: Partial<P>
}

export function useTable<T, P extends Record<string, unknown> = Record<string, unknown>>(
  options: UseTableOptions<T, P>,
) {
  const { fetchApi, defaultPageSize = 10, defaultParams = {} as Partial<P> } = options

  const loading = ref(false)
  const tableData = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)

  const queryParams = reactive<P & PageParams>({
    page: 1,
    pageSize: defaultPageSize,
    ...defaultParams,
  } as P & PageParams)

  /** 获取列表数据 */
  async function fetchData() {
    loading.value = true
    try {
      const result = await fetchApi(toRaw(queryParams) as P & PageParams)
      tableData.value = result.list
      total.value = result.total
    } catch {
      tableData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  /** 搜索 */
  function handleSearch() {
    queryParams.page = 1
    fetchData()
  }

  /** 重置 */
  function handleReset() {
    Object.assign(queryParams, {
      page: 1,
      pageSize: defaultPageSize,
      ...defaultParams,
    })
    fetchData()
  }

  /** 分页变化 */
  function handlePageChange(page: number) {
    queryParams.page = page
    fetchData()
  }

  /** 每页条数变化 */
  function handleSizeChange(size: number) {
    queryParams.pageSize = size
    queryParams.page = 1
    fetchData()
  }

  return {
    loading,
    tableData,
    total,
    queryParams,
    fetchData,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange,
  }
}
