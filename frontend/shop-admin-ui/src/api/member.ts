/**
 * 会员管理接口（C端用户）
 */
import { get, post, put, del } from '@/utils/http'
import type { PageParams, PageResult } from './types'
import type { IdType } from '@/components/CrudTable/types'

/** 会员信息 */
export interface MemberItem {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  status: number
  createTime: string
}

/** 会员列表 */
export function getMemberList(params: PageParams & { keyword?: string; status?: number }) {
  return get<PageResult<MemberItem>>('/member', params)
}

/** 会员详情 */
export function getMemberDetail(id: IdType) {
  return get<MemberItem>(`/member/${id}`)
}

/** 新增会员 */
export function createMember(data: Partial<MemberItem> & { password: string }) {
  return post('/member', data)
}

/** 编辑会员 */
export function updateMember(id: IdType, data: Partial<MemberItem>) {
  return put(`/member/${id}`, data)
}

/** 删除会员 */
export function deleteMember(id: IdType) {
  return del(`/member/${id}`)
}
