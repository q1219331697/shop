/**
 * 用户管理接口
 */
import { get, post, put, del } from '@/utils/request'
import type { PageParams, PageResult } from './types'

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
