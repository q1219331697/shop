/**
 * 权限树前端处理逻辑（非接口调用）
 *
 * 原 /permission/tree 与 /permission/search 两个端点已合并为单一 POST /permission/list：
 * 无条件返回完整树，有任一条件返回「命中节点 + 其祖先链」（层级始终完整，不做平铺）。
 * 因此本文件不再承担「按有无条件决定调哪个端点」的分流职责，也不缓存数据，
 * 只保留渲染与统计需要的纯函数（规范化 / 展平 / 计数）。
 *
 * 注意：本文件只做前端数据处理，不直接发请求；发请求统一走 @/api/permission。
 */
import type { PermissionItem } from '@/api/permission'

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
