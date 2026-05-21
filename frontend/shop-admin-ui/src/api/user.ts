/**
 * 用户管理接口
 */
import { get, post, put, del } from '@/utils/request'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 用户信息 */
export interface UserItem {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  status: number
  createTime: string
}

/** 用户列表 */
export function getUserList(params: PageParams & { keyword?: string; status?: number }) {
  return get<PageResult<UserItem>>('/user/list', params)
}

/** 用户详情 */
export function getUserDetail(id: number) {
  return get<UserItem>(`/user/${id}`)
}

/** 新增用户 */
export function createUser(data: Partial<UserItem> & { password: string }) {
  return post('/user', data)
}

/** 编辑用户 */
export function updateUser(id: number, data: Partial<UserItem>) {
  return put(`/user/${id}`, data)
}

/** 删除用户 */
export function deleteUser(id: number) {
  return del(`/user/${id}`)
}

// ==================== 管理员用户接口 ====================

/** 管理员用户信息 */
export interface AdminUserItem {
  id: number
  username: string
  password?: string
  realName: string
  status: number
  createTime: string
  updateTime: string
}

/** 管理员角色信息 */
export interface RoleItem {
  id: number
  name: string
  code: string
  description: string
  status: number
}

/** 管理员分页查询参数 */
export interface AdminUserPageParams extends PageParams {
  username?: string
  realName?: string
  status?: number
}

/** 管理员用户列表 */
export async function getAdminUserList(params: AdminUserPageParams) {
  const ipage = await get<IPageResult<AdminUserItem>>('/adminUser/list', params)
  return convertIPage(ipage)
}

/** 管理员用户详情 */
export function getAdminUserDetail(id: number) {
  return get<AdminUserItem>(`/adminUser/${id}`)
}

/** 新增管理员用户 */
export function createAdminUser(data: Partial<AdminUserItem> & { password: string }) {
  return post('/adminUser/create', data)
}

/** 编辑管理员用户 */
export function updateAdminUser(data: Partial<AdminUserItem>) {
  return put('/adminUser/update', data)
}

/** 删除管理员用户 */
export function deleteAdminUser(id: number) {
  return del(`/adminUser/${id}`)
}

/** 批量删除管理员用户 */
export function batchDeleteAdminUser(ids: number[]) {
  return del('/adminUser/batch', ids)
}

/** 禁用管理员用户 */
export function disableAdminUser(id: number) {
  return put(`/adminUser/${id}/disable`)
}

/** 启用管理员用户 */
export function enableAdminUser(id: number) {
  return put(`/adminUser/${id}/enable`)
}

/** 恢复管理员用户 */
export function restoreAdminUser(id: number) {
  return put(`/adminUser/${id}/restore`)
}

/** 为管理员分配角色 */
export function assignAdminRoles(userId: number, roleIds: number[]) {
  return post(`/adminUser/${userId}/roles`, roleIds)
}

/** 获取管理员的角色ID列表 */
export function getAdminRoleIds(userId: number) {
  return get<number[]>(`/adminUser/${userId}/roles`)
}

/** 获取所有角色列表（下拉选择用） */
export function getAllRoles() {
  return get<RoleItem[]>('/role/all')
}
