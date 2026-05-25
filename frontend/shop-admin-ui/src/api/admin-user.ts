/**
 * 管理员用户管理接口
 */
import { get, post, put, del } from '@/utils/http'
import type { PageParams, IPageResult } from './types'
import { convertIPage } from './types'
import type { IdType } from '@/components/CrudTable/types'

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

/** 管理员角色信息 */
export interface RoleItem {
  id: number
  roleName: string
  description: string
  status: number
}

/** 管理员分页查询参数 */
export interface AdminUserPageParams extends PageParams {
  username?: string
  realName?: string
  status?: number
  deleted?: number // 删除状态筛选：0-未删除，1-已删除，undefined-全部
}

/** 管理员用户列表 */
export async function getAdminUserList(params: AdminUserPageParams) {
  const ipage = await get<IPageResult<AdminUserItem>>('/adminUser', params)
  return convertIPage(ipage)
}

/** 管理员用户详情 */
export function getAdminUserDetail(id: IdType) {
  return get<AdminUserItem>(`/adminUser/${id}`)
}

/** 新增管理员用户 */
export function createAdminUser(data: Partial<AdminUserItem> & { password: string }) {
  return post('/adminUser', data)
}

/** 编辑管理员用户 */
export function updateAdminUser(id: IdType, data: Partial<AdminUserItem>) {
  return put(`/adminUser/${id}`, data)
}

/** 删除管理员用户 */
export function deleteAdminUser(id: IdType) {
  return del(`/adminUser/${id}`)
}

/** 批量删除管理员用户 */
export function batchDeleteAdminUser(ids: IdType[]) {
  return del('/adminUser/batch', { ids })
}

/** 禁用管理员用户 */
export function disableAdminUser(id: IdType) {
  return put(`/adminUser/${id}/disable`)
}

/** 启用管理员用户 */
export function enableAdminUser(id: IdType) {
  return put(`/adminUser/${id}/enable`)
}

/** 恢复管理员用户 */
export function restoreAdminUser(id: IdType) {
  return put(`/adminUser/${id}/restore`)
}

/** 批量禁用管理员用户 */
export function batchDisableAdminUser(ids: IdType[]) {
  return put('/adminUser/batch-disable', { ids })
}

/** 批量启用管理员用户 */
export function batchEnableAdminUser(ids: IdType[]) {
  return put('/adminUser/batch-enable', { ids })
}

/** 批量恢复管理员用户 */
export function batchRestoreAdminUser(ids: IdType[]) {
  return put('/adminUser/batch-restore', { ids })
}

/** 为管理员分配角色 */
export function assignAdminRoles(userId: IdType, roleIds: number[]) {
  return post(`/adminUser/${userId}/roles`, { roleIds })
}

/** 获取管理员的角色ID列表 */
export function getAdminRoleIds(userId: IdType) {
  return get<number[]>(`/adminUser/${userId}/roles`)
}

/** 获取所有角色列表（下拉选择用） */
export function getAllRoles() {
  return get<RoleItem[]>('/role/all')
}

/** 管理员用户 API 模块（遵循 CrudApi 契约） */
export const adminUserApi = {
  list: getAdminUserList,
  detail: getAdminUserDetail,
  create: createAdminUser,
  update: updateAdminUser,
  delete: deleteAdminUser,
  batchDelete: batchDeleteAdminUser,
}
