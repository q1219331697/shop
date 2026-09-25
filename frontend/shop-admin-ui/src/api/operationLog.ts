/**
 * 操作日志模块：类型 + 调用内聚
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import { endpoints } from './endpoints'
import request from './http'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 操作日志信息 */
export interface OperationLogItem {
  id: number
  userId: number
  username: string
  /** 操作类型：1-登录，2-登出，3-新增，4-修改，5-删除，6-查询，7-其它 */
  operationType: number
  /** 所属模块（菜单名） */
  module: string
  /** 操作名称 */
  operation: string
  /** 操作对应权限编码 */
  permissionCode: string
  /** HTTP 方法 */
  requestMethod: string
  requestUri: string
  /** 类#方法 */
  classMethod: string
  /** 请求参数（敏感字段已脱敏，超长截断） */
  requestParams: string
  /** 响应结果（敏感字段已脱敏，超长截断） */
  responseData: string
  ip: string
  /** 耗时（毫秒） */
  duration: number
  /** 0-失败，1-成功 */
  success: number
  /** 失败原因 */
  message: string
  operationTime: string
  createDatetime: string
  updateDatetime: string
}

/** 操作日志分页查询参数 */
export interface OperationLogPageParams extends PageParams {
  username?: string
  module?: string
  operation?: string
  operationType?: number
  success?: number
  /** 开始时间：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
  startTime?: string
  /** 结束时间：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
  endTime?: string
}

/** 操作日志列表（分页） */
export async function listOperationLogs(
  params: OperationLogPageParams,
): Promise<PageResult<OperationLogItem>> {
  const ipage = await request.post<IPageResult<OperationLogItem>>(endpoints.operationLog.list, params)
  return convertIPage(ipage)
}

/** 操作日志详情 */
export async function getOperationLogDetail(id: number): Promise<OperationLogItem> {
  const data = await request.post<OperationLogItem>(endpoints.operationLog.detail, { id })
  return data
}

/** 操作日志模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const operationLogApi = {
  list: listOperationLogs,
  detail: getOperationLogDetail,
}
