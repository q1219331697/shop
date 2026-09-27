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
  /** 是否记录操作日志：0-不记录，1-记录（菜单里可配置） */
  logFlag: number
  deleted: number
  createDatetime: string
  updateDatetime: string
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

/** 权限模块 API（CrudTable :api 直接使用） */
export const permissionApi = {
  // ==================== CrudTable 契约键 ====================
  /**
   * 查询权限树列表
   * <p>
   * 原 /tree 与 /search 已合并：二者语义本就重叠（前者即「全条件为空的后者 + 建树」），
   * 拆开会把「要不要做层级补全」的判断推给前端。合并后层级始终完整。
   * </p>
   */
  list: (params: PermissionQuery = {}) =>
    request.post<PermissionItem[]>(endpoints.permission.list, params),
  /** 获取权限详情 */
  detail: (id: IdType) => request.post<PermissionItem>(endpoints.permission.detail, { id }),
  /** 创建权限，返回新权限 ID */
  create: (data: Partial<PermissionItem>) =>
    request.post<number>(endpoints.permission.create, data),
  /** 更新权限 */
  update: (id: IdType, data: Partial<PermissionItem>) =>
    request.post(endpoints.permission.update, { ...data, id }),
  /** 删除权限 */
  delete: (id: IdType) => request.post(endpoints.permission.delete, { id }),

  // ==================== 业务扩展键（CrudTable 不消费，侧边栏菜单使用） ====================
  /** 获取当前用户菜单树（用于动态生成侧边栏菜单和路由） */
  menus: () => request.post<PermissionItem[]>(endpoints.permission.menus),
}
