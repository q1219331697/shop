/**
 * 角色管理接口
 */
import { get, post, put, del } from '@/utils/http'
import type { PageParams, IPageResult } from './types'
import { convertIPage } from './types'
/** 角色信息 */
export interface RoleItem {
  id: string
  roleName: string
  description: string
  sortOrder: number
  status: number // 0-禁用，1-正常
  deleted: number
  createTime: string
  updateTime: string
}

/** 角色分页查询参数 */
export interface RolePageParams extends PageParams {
  roleName?: string
  status?: number
}

/** 角色列表（分页） */
export async function getRoleList(params: RolePageParams) {
  const ipage = await get<IPageResult<RoleItem>>('/role', params)
  return convertIPage(ipage)
}

/** 查询所有角色（下拉选择用） */
export function getAllRoles() {
  return get<RoleItem[]>('/role/all')
}

/** 获取角色详情 */
export function getRoleDetail(id: string) {
  return get<RoleItem>(`/role/${id}`)
}

/** 创建角色 */
export function createRole(data: Partial<RoleItem>) {
  return post('/role', data)
}

/** 更新角色 */
export function updateRole(id: string, data: Partial<RoleItem>) {
  return put(`/role/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: string) {
  return del(`/role/${id}`)
}

/** 禁用角色 */
export function disableRole(id: string) {
  return put(`/role/${id}/disable`)
}

/** 启用角色 */
export function enableRole(id: string) {
  return put(`/role/${id}/enable`)
}

/** 批量禁用角色 */
export function batchDisableRole(ids: string[]) {
  return put('/role/batch-disable', { ids })
}

/** 批量启用角色 */
export function batchEnableRole(ids: string[]) {
  return put('/role/batch-enable', { ids })
}

/** 为角色分配权限 */
export function assignRolePermissions(roleId: string, permissionIds: number[]) {
  return post(`/role/${roleId}/permissions`, { permissionIds })
}

/** 获取角色的权限ID列表 */
export function getRolePermissionIds(roleId: string) {
  return get<number[]>(`/role/${roleId}/permissions`)
}
