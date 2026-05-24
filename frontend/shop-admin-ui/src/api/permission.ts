/**
 * 权限管理接口
 */
import { get, post, put, del } from '@/utils/http'

/** 权限信息 */
export interface PermissionItem {
  id: number
  parentId: number
  permissionName: string
  permissionCode: string
  permissionType: number // 1-菜单，2-按钮
  path: string
  icon: string
  component: string
  sortOrder: number
  visible: number // 0-隐藏，1-显示
  status: number // 0-禁用，1-正常
  deleted: number
  createTime: string
  updateTime: string
  children?: PermissionItem[]
  /** 前端扩展属性 */
  _level?: number
  _isLast?: boolean
  _treeLines?: string[]
  _hasChildren?: boolean
}

/** 获取当前用户菜单树（用于动态生成侧边栏菜单和路由） */
export function getUserMenus() {
  return get<PermissionItem[]>('/permission/menus')
}

/** 获取权限树形结构 */
export function getPermissionTree() {
  return get<PermissionItem[]>('/permission/tree')
}

/** 获取权限详情 */
export function getPermissionDetail(id: number) {
  return get<PermissionItem>(`/permission/${id}`)
}

/** 创建权限 */
export function createPermission(data: Partial<PermissionItem>) {
  return post('/permission', data)
}

/** 更新权限 */
export function updatePermission(id: number, data: Partial<PermissionItem>) {
  return put(`/permission/${id}`, data)
}

/** 删除权限 */
export function deletePermission(id: number) {
  return del(`/permission/${id}`)
}
