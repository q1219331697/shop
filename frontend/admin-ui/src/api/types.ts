/**
 * API 通用类型定义
 */

/** 通用分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 通用分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

/** 登录请求 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应（后端 data 直接返回 token 字符串） */
export interface LoginResult {
  token: string
}
