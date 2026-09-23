/**
 * 权限树前端处理逻辑（非接口调用）
 *
 * 过滤已下沉到后端：
 * - 无条件查询走 /permission/tree，返回完整树；
 * - 带条件查询走 /permission/search，返回命中节点平铺列表（不做层级补全）。
 * 因此本文件不再缓存数据，只保留渲染需要的纯函数（规范化 / 展平 / 计数）。
 *
 * 注意：本文件只做前端数据处理，不直接发请求；发请求统一走 @/api/permission。
 */
import { getPermissionTree, searchPermissions } from '@/api/permission'
import type { PermissionItem, PermissionPageParams, PermissionTreeResult } from '@/api/permission'

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

/** 是否携带查询条件（名称/编码关键字、类型、状态） */
function hasSearchCondition(params: PermissionPageParams): boolean {
  const name = params.permissionName?.trim()
  const code = params.permissionCode?.trim()
  return Boolean(name || code || params.permissionType != null || params.status != null)
}

/**
 * 查询权限列表（树形，无分页）
 * <p>
 * 无查询条件：取完整树，规范化后交给树形表格渲染；
 * 有查询条件：走后端搜索，返回命中节点平铺列表（不做层级补全）。
 * </p>
 */
export async function getPermissionList(
  params: PermissionPageParams = {},
): Promise<PermissionTreeResult> {
  if (hasSearchCondition(params)) {
    const list = await searchPermissions(params)
    return { list, total: list.length }
  }
  const tree = normalizePermissionTree(await getPermissionTree())
  return { list: tree, total: countPermissionTree(tree) }
}
