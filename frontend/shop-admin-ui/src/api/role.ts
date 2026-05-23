
/**
 * 角色管理接口
 */
import { get, post, put, del } from '@/utils/http'
import type { PageParams, IPageResult } from './types'
import { convertIPage } from './types'

/** 角色信息 */
export interface RoleItem {
  id: number
  roleName: string
  roleCode: string
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
  roleCode?: string
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
export function getRoleDetail(id: number) {
  return get<RoleItem>(`/role/${id}`)
}

/** 创建角色 */
export function createRole(data: Partial<RoleItem>) {
  return post('/role', data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<RoleItem>) {
  return put(`/role/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return del(`/role/${id}`)
}

/** 为角色分配权限 */
export function assignRolePermissions(roleId: number, permissionIds: number[]) {
  return post(`/role/${roleId}/permissions`, { permissionIds })
}

/** 获取角色的权限ID列表 */
export function getRolePermissionIds(roleId: number) {
  return get<number[]>(`/role/${roleId}/permissions`)
}
