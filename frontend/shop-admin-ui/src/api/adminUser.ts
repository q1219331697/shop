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
  /** 删除标记：0-未删除，1-已删除（后端 number；此处不用 boolean，与 role/permission 保持一致） */
  deleted: number
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
export async function listAdminUsers(params: AdminUserPageParams): Promise<PageResult<AdminUserItem>> {
  const ipage = await request.post<IPageResult<AdminUserItem>>(endpoints.adminUser.list, params)
  return convertIPage(ipage)
}

/** 管理员用户详情 */
export function getAdminUserDetail(id: IdType) {
  return request.post<AdminUserItem>(endpoints.adminUser.detail, { id })
}

/** 新增管理员用户（密码可不传，由后端使用系统默认密码） */
export function createAdminUser(data: Partial<AdminUserItem>) {
  return request.post(endpoints.adminUser.create, data)
}

/** 重置管理员密码为系统默认密码 */
export function resetAdminPassword(id: IdType) {
  return request.post(endpoints.adminUser.resetPassword, { id })
}

/** 获取系统默认密码（新增/重置密码提示展示用） */
export function getAdminDefaultPassword() {
  return request.post<string>(endpoints.adminUser.defaultPassword)
}

/** 修改密码参数 */
export interface ChangePasswordParams {
  /** 原密码 */
  oldPassword: string
  /** 新密码 */
  newPassword: string
}

/** 修改当前登录管理员密码（自助改密，失败原因由后端返回：如原密码错误） */
export function changeAdminPassword(data: ChangePasswordParams) {
  return request.post(endpoints.adminUser.changePassword, data)
}

/** 编辑管理员用户 */
export function updateAdminUser(id: IdType, data: Partial<AdminUserItem>) {
  return request.post(endpoints.adminUser.update, { ...data, id })
}

/** 删除管理员用户 */
export function deleteAdminUser(id: IdType) {
  return request.post(endpoints.adminUser.delete, { id })
}

/** 批量删除管理员用户 */
export function batchDeleteAdminUser(ids: IdType[]) {
  return request.post(endpoints.adminUser.batchDelete, { ids })
}

/** 禁用管理员用户 */
export function disableAdminUser(id: IdType) {
  return request.post(endpoints.adminUser.disable, { id })
}

/** 启用管理员用户 */
export function enableAdminUser(id: IdType) {
  return request.post(endpoints.adminUser.enable, { id })
}

/** 恢复管理员用户 */
export function restoreAdminUser(id: IdType) {
  return request.post(endpoints.adminUser.restore, { id })
}

/** 批量禁用管理员用户 */
export function batchDisableAdminUser(ids: IdType[]) {
  return request.post(endpoints.adminUser.batchDisable, { ids })
}

/** 批量启用管理员用户 */
export function batchEnableAdminUser(ids: IdType[]) {
  return request.post(endpoints.adminUser.batchEnable, { ids })
}

/** 批量恢复管理员用户 */
export function batchRestoreAdminUser(ids: IdType[]) {
  return request.post(endpoints.adminUser.batchRestore, { ids })
}

/** 为管理员分配角色 */
export function assignAdminRoles(userId: IdType, roleIds: number[]) {
  return request.post(endpoints.adminUser.assignRoles, { id: userId, roleIds })
}

/** 查询管理员的角色ID列表 */
export function listAdminRoleIds(userId: IdType) {
  return request.post<number[]>(endpoints.adminUser.roleIds, { id: userId })
}

/**
 * 获取当前登录用户的权限编码列表
 *
 * 区别于菜单树：菜单树只含目录/菜单（type 1、2），此处返回角色关联的全部编码
 * （含按钮级 system:xxx:update 等），供路由级权限校验使用。
 */
export function getMyPermissionCodes() {
  return request.post<string[]>(endpoints.adminUser.permissions)
}

/** 获取当前登录管理员信息（密码已由后端置空） */
export function getCurrentAdminUser() {
  return request.post<AdminUserItem>(endpoints.adminUser.current)
}

/** 管理员用户模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const adminUserApi = {
  list: listAdminUsers,
  detail: getAdminUserDetail,
  create: createAdminUser,
  update: updateAdminUser,
  delete: deleteAdminUser,
  batchDelete: batchDeleteAdminUser,
  disable: disableAdminUser,
  enable: enableAdminUser,
  restore: restoreAdminUser,
  resetPassword: resetAdminPassword,
  defaultPassword: getAdminDefaultPassword,
  changePassword: changeAdminPassword,
  batchDisable: batchDisableAdminUser,
  batchEnable: batchEnableAdminUser,
  batchRestore: batchRestoreAdminUser,
  assignRoles: assignAdminRoles,
  roleIds: listAdminRoleIds,
  permissions: getMyPermissionCodes,
  current: getCurrentAdminUser,
}
