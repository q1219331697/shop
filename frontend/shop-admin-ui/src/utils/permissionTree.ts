/**
 * 权限树前端处理逻辑（非接口调用）
 *
 * 后端仅提供全量树接口（api.permission.tree），树不做分页；
 * 规范化、展平、计数、条件过滤均在前端完成，并缓存全量树以避免重复请求。
 * 增删改后需调用 invalidatePermissionTreeCache 使缓存失效。
 *
 * 注意：本文件只做前端数据处理，不直接发请求；发请求统一走 @/api/permission。
 */
import { getPermissionTree } from '@/api/permission'
import type { PermissionItem, PermissionPageParams, PermissionTreeResult } from '@/api/permission'

/** 权限树缓存（模块级单例，跨组件共享） */
let cachedTree: PermissionItem[] | null = null

/**
 * 规范化权限树：剔除空的 children 数组
 * 后端叶子节点会返回空数组，树形控件会据此渲染多余的展开箭头
 */
function normalizePermissionTree(nodes: PermissionItem[]): PermissionItem[] {
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
function countPermissionTree(nodes: PermissionItem[]): number {
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
 */
export async function getPermissionList(
  params: PermissionPageParams = {},
): Promise<PermissionTreeResult> {
  if (!cachedTree) {
    cachedTree = normalizePermissionTree(await getPermissionTree())
  }
  const list = filterPermissionTree(cachedTree, params)
  return { list, total: countPermissionTree(list), rawTree: cachedTree }
}

/** 失效缓存：增删改后调用，使下次 list 重新拉取 */
export function invalidatePermissionTreeCache(): void {
  cachedTree = null
}
