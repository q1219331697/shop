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
  /** 权限编码（目录节点为 null，仅作导航分组，不参与授权） */
  permissionCode: string | null
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

/** 权限查询参数：全部为空时返回完整树；任一非空时返回「命中节点 + 祖先链」 */
export interface PermissionQuery {
  permissionName?: string
  permissionCode?: string
  permissionType?: number
  status?: number
}

/** 权限查询结果（无分页，total 为节点总数） */
export interface PermissionTreeResult {
  list: PermissionItem[]
  total: number
}

/**
 * 查询权限树列表
 * <p>
 * 原 /tree 与 /search 已合并：二者语义本就重叠（前者即「全条件为空的后者 + 建树」），
 * 拆开会把「要不要做层级补全」的判断推给前端。合并后层级始终完整。
 * </p>
 */
export function listPermissions(params: PermissionQuery = {}) {
  return request.post<PermissionItem[]>(endpoints.permission.list, params)
}

/** 获取当前用户菜单树（用于动态生成侧边栏菜单和路由） */
export function getUserMenus() {
  return request.post<PermissionItem[]>(endpoints.permission.menus)
}

/** 获取权限详情 */
export function getPermissionDetail(id: IdType) {
  return request.post<PermissionItem>(endpoints.permission.detail, { id })
}

/** 创建权限，返回新权限 ID */
export function createPermission(data: Partial<PermissionItem>) {
  return request.post<number>(endpoints.permission.create, data)
}

/** 更新权限 */
export function updatePermission(id: IdType, data: Partial<PermissionItem>) {
  return request.post(endpoints.permission.update, { ...data, id })
}

/** 删除权限 */
export function deletePermission(id: IdType) {
  return request.post(endpoints.permission.delete, { id })
}

/** 权限模块 API 聚合对象（供 CrudTable :api 直接使用，亦可直接调用） */
export const permissionApi = {
  list: listPermissions,
  menus: getUserMenus,
  detail: getPermissionDetail,
  create: createPermission,
  update: updatePermission,
  delete: deletePermission,
}
