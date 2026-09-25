/**
 * 登录日志模块：类型 + 调用内聚
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import { endpoints } from './endpoints'
import request from './http'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 登录日志信息 */
export interface LoginLogItem {
  id: number
  userId: number
  username: string
  /** 登录IP（可能为 null，历史日志无 IP） */
  ip: string
  loginTime: string
  /** 0-失败，1-成功 */
  success: number
  message: string
  createTime: string
}

/** 登录日志分页查询参数 */
export interface LoginLogPageParams extends PageParams {
  username?: string
  ip?: string
  success?: number
  /** 开始时间：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
  startTime?: string
  /** 结束时间：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss */
  endTime?: string
}

/** 登录日志列表（分页） */
export async function listLoginLogs(params: LoginLogPageParams): Promise<PageResult<LoginLogItem>> {
  const ipage = await request.post<IPageResult<LoginLogItem>>(endpoints.loginLog.list, params)
  return convertIPage(ipage)
}

/** 登录日志模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const loginLogApi = {
  list: listLoginLogs,
}
