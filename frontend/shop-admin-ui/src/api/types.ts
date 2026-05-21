/**
 * API 通用类型定义
 */

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

/** 将 IPage 转换为 PageResult */
export function convertIPage<T>(ipage: IPageResult<T>): PageResult<T> {
  return {
    list: ipage.records,
    total: ipage.total,
    page: ipage.current,
    pageSize: ipage.size,
  }
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
export type LoginResult = string
