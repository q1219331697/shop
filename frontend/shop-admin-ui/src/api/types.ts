/**
 * API 通用类型与分页工具
 *
 * 只放跨模块复用的通用类型与工具；各业务域的专属类型见对应模块文件
 * （auth / adminUser / role / permission），由 index.ts 统一再导出。
 */

// ==================== 通用类型 ====================

/** 通用分页请求参数 */
export interface PageParams {
  pageNum: number
  pageSize: number
}

/** 通用分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** MyBatis-Plus IPage 分页响应（后端原始格式） */
export interface IPageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

/** 将 IPage 转换为 PageResult（后端返回 IPage，前端统一用 PageResult） */
export function convertIPage<T>(ipage: IPageResult<T>): PageResult<T> {
  return {
    list: ipage.records,
    total: ipage.total,
    page: ipage.current,
    pageSize: ipage.size,
  }
}
