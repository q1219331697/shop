/**
 * 权限管理接口
 */
import { get, post, put, del } from '@/utils/http'
import type { IdType } from '@/components/CrudTable/types'

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

/** 获取当前用户菜单树（用于动态生成侧边栏菜单和路由） */
export function getUserMenus() {
  return get<PermissionItem[]>('/permission/menus')
}

/** 获取权限树形结构 */
export function getPermissionTree() {
  return get<PermissionItem[]>('/permission/tree')
}

/** 获取权限详情 */
export function getPermissionDetail(id: IdType) {
  return get<PermissionItem>(`/permission/${id}`)
}

/** 创建权限 */
export function createPermission(data: Partial<PermissionItem>) {
  return post('/permission', data)
}

/** 更新权限 */
export function updatePermission(id: IdType, data: Partial<PermissionItem>) {
  return put(`/permission/${id}`, data)
}

/** 删除权限 */
export function deletePermission(id: IdType) {
  return del(`/permission/${id}`)
}

// ==================== 树形结构工具 ====================

/**
 * 规范化权限树：剔除空的 children 数组
 * 后端叶子节点会返回空数组，树形控件会据此渲染多余的展开箭头
 */
export function normalizePermissionTree(nodes: PermissionItem[]): PermissionItem[] {
  return nodes.map((node) => {
    const children = normalizePermissionTree(node.children ?? [])
    if (children.length > 0) {
      return { ...node, children }
    }
    const clone: PermissionItem = { ...node }
    delete clone.children
    return clone
  })
}

/** 展平权限树为一维数组（含自身与所有子孙） */
export function flattenPermissionTree(nodes: PermissionItem[]): PermissionItem[] {
  return nodes.reduce<PermissionItem[]>((acc, node) => {
    acc.push(node)
    if (node.children?.length) {
      acc.push(...flattenPermissionTree(node.children))
    }
    return acc
  }, [])
}

/** 统计权限树节点总数 */
export function countPermissionTree(nodes: PermissionItem[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countPermissionTree(node.children ?? []), 0)
}

/** 判断单个权限节点是否命中查询条件 */
function matchPermission(node: PermissionItem, params: PermissionPageParams): boolean {
  if (params.permissionType != null && node.permissionType !== params.permissionType) {
    return false
  }
  if (params.status != null && node.status !== params.status) {
    return false
  }
  const name = params.permissionName?.trim().toLowerCase()
  if (name && !String(node.permissionName ?? '').toLowerCase().includes(name)) {
    return false
  }
  const code = params.permissionCode?.trim().toLowerCase()
  if (code && !String(node.permissionCode ?? '').toLowerCase().includes(code)) {
    return false
  }
  return true
}

/**
 * 按条件过滤权限树：节点自身命中或子孙命中即保留，保证层级链路完整
 * 节点自身命中时保留其完整子树，不再逐层过滤
 */
function filterPermissionTree(
  nodes: PermissionItem[],
  params: PermissionPageParams,
): PermissionItem[] {
  return nodes.reduce<PermissionItem[]>((acc, node) => {
    if (matchPermission(node, params)) {
      acc.push({ ...node })
      return acc
    }
    const children = filterPermissionTree(node.children ?? [], params)
    if (children.length > 0) {
      acc.push({ ...node, children })
    }
    return acc
  }, [])
}

/**
 * 查询权限列表（树形，无分页）
 * 后端仅提供全量权限树接口，此处在前端完成条件过滤
 *
 * 同一刷新周期内多次调用会复用已拉到的全量树，避免重复请求后端。
 */
let cachedTree: PermissionItem[] | null = null

export async function getPermissionList(
  params: PermissionPageParams = {},
): Promise<PermissionTreeResult> {
  if (!cachedTree) {
    cachedTree = normalizePermissionTree(await getPermissionTree())
  }
  const list = filterPermissionTree(cachedTree, params)
  return { list, total: countPermissionTree(list), rawTree: cachedTree }
}

/** 失效缓存：增删改后调用，使下次 getPermissionList 重新拉取 */
export function invalidatePermissionTreeCache(): void {
  cachedTree = null
}

/** 权限 API 模块（遵循 CrudApi 契约） */
export const permissionApi = {
  list: getPermissionList,
  detail: getPermissionDetail,
  create: createPermission,
  update: updatePermission,
  delete: deletePermission,
}
