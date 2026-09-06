/**
 * 权限模块：仅接口调用
 *
 * 前端树处理（规范化 / 展平 / 过滤 / 缓存）不属于接口调用，已移至 src/utils/permissionTree.ts。
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import type { IdType } from '@/components/CrudTable/types'

import { endpoints } from './endpoints'
import request from './http'

/** 权限信息 */
export interface PermissionItem {
  id: number
  parentId: number
  permissionName: string
  permissionCode: string
  /** 1-目录，2-菜单，3-操作 */
  permissionType: number
  path: string
  icon: string
  component: string
  sortOrder: number
  /** 0-隐藏，1-显示 */
  visible: number
  /** 0-禁用，1-正常 */
  status: number
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

/** 权限查询参数（后端仅提供全量树接口，条件过滤在前端完成） */
export interface PermissionPageParams {
  permissionName?: string
  permissionCode?: string
  permissionType?: number
  status?: number
}

/** 权限树查询结果（树不做分页，total 为节点总数） */
export interface PermissionTreeResult {
  list: PermissionItem[]
  total: number
  /** 后端返回的原始全量树，未受搜索条件过滤；用于上级权限选择等不受搜索影响的场景 */
  rawTree?: PermissionItem[]
}

/** 获取权限树形结构（原始全量树） */
export function getPermissionTree() {
  return request.get<PermissionItem[]>(endpoints.permission.tree)
}

/** 获取当前用户菜单树（用于动态生成侧边栏菜单和路由） */
export function getUserMenus() {
  return request.get<PermissionItem[]>(endpoints.permission.menus)
}

/** 获取权限详情 */
export function getPermissionDetail(id: IdType) {
  return request.get<PermissionItem>(endpoints.permission.detail(id))
}

/** 创建权限，返回新权限 ID */
export function createPermission(data: Partial<PermissionItem>) {
  return request.post<number>(endpoints.permission.create, data)
}

/** 更新权限 */
export function updatePermission(id: IdType, data: Partial<PermissionItem>) {
  return request.put(endpoints.permission.update(id), data)
}

/** 删除权限 */
export function deletePermission(id: IdType) {
  return request.delete(endpoints.permission.delete(id))
}

/** 权限模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const permissionApi = {
  menus: getUserMenus,
  tree: getPermissionTree,
  detail: getPermissionDetail,
  create: createPermission,
  update: updatePermission,
  delete: deletePermission,
}
