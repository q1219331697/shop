/**
 * 管理员用户模块：类型 + 调用内聚
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import type { IdType } from '@/components/CrudTable/types'

import { endpoints } from './endpoints'
import request from './http'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 管理员用户信息 */
export interface AdminUserItem {
  id: number
  username: string
  password?: string
  realName: string
  status: number
  deleted: boolean
  createTime: string
  updateTime: string
}

/** 管理员分页查询参数 */
export interface AdminUserPageParams extends PageParams {
  username?: string
  realName?: string
  status?: number
  /** 删除状态筛选：0-未删除，1-已删除，undefined-全部 */
  deleted?: number
}

/** 管理员用户列表（分页） */
export async function getAdminUserList(params: AdminUserPageParams): Promise<PageResult<AdminUserItem>> {
  const ipage = await request.get<IPageResult<AdminUserItem>>(endpoints.adminUser.list, params)
  return convertIPage(ipage)
}

/** 管理员用户详情 */
export function getAdminUserDetail(id: IdType) {
  return request.get<AdminUserItem>(endpoints.adminUser.detail(id))
}

/** 新增管理员用户 */
export function createAdminUser(data: Partial<AdminUserItem> & { password: string }) {
  return request.post(endpoints.adminUser.create, data)
}

/** 编辑管理员用户 */
export function updateAdminUser(id: IdType, data: Partial<AdminUserItem>) {
  return request.put(endpoints.adminUser.update(id), data)
}

/** 删除管理员用户 */
export function deleteAdminUser(id: IdType) {
  return request.delete(endpoints.adminUser.delete(id))
}

/** 批量删除管理员用户 */
export function batchDeleteAdminUser(ids: IdType[]) {
  return request.delete(endpoints.adminUser.batchDelete, { ids })
}

/** 禁用管理员用户 */
export function disableAdminUser(id: IdType) {
  return request.put(endpoints.adminUser.disable(id))
}

/** 启用管理员用户 */
export function enableAdminUser(id: IdType) {
  return request.put(endpoints.adminUser.enable(id))
}

/** 恢复管理员用户 */
export function restoreAdminUser(id: IdType) {
  return request.put(endpoints.adminUser.restore(id))
}

/** 批量禁用管理员用户 */
export function batchDisableAdminUser(ids: IdType[]) {
  return request.put(endpoints.adminUser.batchDisable, { ids })
}

/** 批量启用管理员用户 */
export function batchEnableAdminUser(ids: IdType[]) {
  return request.put(endpoints.adminUser.batchEnable, { ids })
}

/** 批量恢复管理员用户 */
export function batchRestoreAdminUser(ids: IdType[]) {
  return request.put(endpoints.adminUser.batchRestore, { ids })
}

/** 为管理员分配角色 */
export function assignAdminRoles(userId: IdType, roleIds: number[]) {
  return request.post(endpoints.adminUser.assignRoles(userId), { roleIds })
}

/** 获取管理员的角色ID列表 */
export function getAdminRoleIds(userId: IdType) {
  return request.get<number[]>(endpoints.adminUser.roleIds(userId))
}

/** 管理员用户模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const adminUserApi = {
  list: getAdminUserList,
  detail: getAdminUserDetail,
  create: createAdminUser,
  update: updateAdminUser,
  delete: deleteAdminUser,
  batchDelete: batchDeleteAdminUser,
  disable: disableAdminUser,
  enable: enableAdminUser,
  restore: restoreAdminUser,
  batchDisable: batchDisableAdminUser,
  batchEnable: batchEnableAdminUser,
  batchRestore: batchRestoreAdminUser,
  assignRoles: assignAdminRoles,
  getRoleIds: getAdminRoleIds,
}
