/**
 * 角色模块：类型 + 调用内聚
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import { endpoints } from './endpoints'
import request from './http'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 角色信息（id 与后端 Long 一致，统一为 number） */
export interface RoleItem {
  id: number
  roleName: string
  description: string
  sortOrder: number
  /** 0-禁用，1-正常 */
  status: number
  deleted: number
  createTime: string
}

/** 角色分页查询参数 */
export interface RolePageParams extends PageParams {
  roleName?: string
  status?: number
}

/** 角色列表（分页） */
export async function getRoleList(params: RolePageParams): Promise<PageResult<RoleItem>> {
  const ipage = await request.get<IPageResult<RoleItem>>(endpoints.role.list, params)
  return convertIPage(ipage)
}

/** 查询所有角色（下拉选择用） */
export function getAllRoles() {
  return request.get<RoleItem[]>(endpoints.role.all)
}

/** 角色详情 */
export function getRoleDetail(id: number) {
  return request.get<RoleItem>(endpoints.role.detail(id))
}

/** 创建角色 */
export function createRole(data: Partial<RoleItem>) {
  return request.post(endpoints.role.create, data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<RoleItem>) {
  return request.put(endpoints.role.update(id), data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return request.delete(endpoints.role.delete(id))
}

/** 禁用角色 */
export function disableRole(id: number) {
  return request.put(endpoints.role.disable(id))
}

/** 启用角色 */
export function enableRole(id: number) {
  return request.put(endpoints.role.enable(id))
}

/** 批量禁用角色 */
export function batchDisableRole(ids: number[]) {
  return request.put(endpoints.role.batchDisable, { ids })
}

/** 批量启用角色 */
export function batchEnableRole(ids: number[]) {
  return request.put(endpoints.role.batchEnable, { ids })
}

/** 为角色分配权限 */
export function assignRolePermissions(roleId: number, permissionIds: number[]) {
  return request.post(endpoints.role.assignPermissions(roleId), { permissionIds })
}

/** 获取角色的权限ID列表 */
export function getRolePermissionIds(roleId: number) {
  return request.get<number[]>(endpoints.role.permissionIds(roleId))
}

/** 角色模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const roleApi = {
  list: getRoleList,
  all: getAllRoles,
  detail: getRoleDetail,
  create: createRole,
  update: updateRole,
  delete: deleteRole,
  disable: disableRole,
  enable: enableRole,
  batchDisable: batchDisableRole,
  batchEnable: batchEnableRole,
  assignPermissions: assignRolePermissions,
  getPermissionIds: getRolePermissionIds,
}
