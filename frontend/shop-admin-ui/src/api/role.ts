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
  createDatetime: string
  updateDatetime?: string
}

/** 角色分页查询参数 */
export interface RolePageParams extends PageParams {
  roleName?: string
  status?: number
}

/** 角色列表（分页） */
export async function listRoles(params: RolePageParams): Promise<PageResult<RoleItem>> {
  const ipage = await request.post<IPageResult<RoleItem>>(endpoints.role.list, params)
  return convertIPage(ipage)
}

/** 查询所有角色（下拉选择用） */
export function listAllRoles() {
  return request.post<RoleItem[]>(endpoints.role.listAll)
}

/** 角色详情 */
export function getRoleDetail(id: number) {
  return request.post<RoleItem>(endpoints.role.detail, { id })
}

/** 创建角色 */
export function createRole(data: Partial<RoleItem>) {
  return request.post(endpoints.role.create, data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<RoleItem>) {
  return request.post(endpoints.role.update, { ...data, id })
}

/** 删除角色 */
export function deleteRole(id: number) {
  return request.post(endpoints.role.delete, { id })
}

/** 禁用角色 */
export function disableRole(id: number) {
  return request.post(endpoints.role.disable, { id })
}

/** 启用角色 */
export function enableRole(id: number) {
  return request.post(endpoints.role.enable, { id })
}

/** 批量禁用角色 */
export function batchDisableRole(ids: number[]) {
  return request.post(endpoints.role.batchDisable, { ids })
}

/** 批量启用角色 */
export function batchEnableRole(ids: number[]) {
  return request.post(endpoints.role.batchEnable, { ids })
}

/** 为角色分配权限 */
export function assignRolePermissions(roleId: number, permissionIds: number[]) {
  return request.post(endpoints.role.assignPermissions, { id: roleId, permissionIds })
}

/** 查询角色的权限ID列表 */
export function listRolePermissionIds(roleId: number) {
  return request.post<number[]>(endpoints.role.permissionIds, { id: roleId })
}

/**
 * 角色模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用）
 * <p>
 * 契约键统一用「资源/动作」命名（list / detail / create / permissionIds …），不带 get 等动词前缀，
 * 与 permission / loginLog 模块保持一致。
 * </p>
 */
export const roleApi = {
  list: listRoles,
  all: listAllRoles,
  detail: getRoleDetail,
  create: createRole,
  update: updateRole,
  delete: deleteRole,
  disable: disableRole,
  enable: enableRole,
  batchDisable: batchDisableRole,
  batchEnable: batchEnableRole,
  assignPermissions: assignRolePermissions,
  permissionIds: listRolePermissionIds,
}
