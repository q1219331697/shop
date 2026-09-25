/**
 * 权限判断组合式函数
 * 基于后端返回的用户菜单权限编码进行判断
 */
import { usePermissionStore } from '@/stores/modules/permission'

/** 判断是否拥有指定权限编码 */
export function hasPermission(permissionCode: string): boolean {
  const permissionStore = usePermissionStore()
  return permissionStore.hasPermission(permissionCode)
}

/** 判断是否拥有指定角色（预留，后续可扩展） */
export function hasRole(_role: string): boolean {
  // 角色判断暂未实现，默认放行
  return true
}

/**
 * 按资源名自动拼接权限码的判定函数，口径与 ActionBar / DataArea 完全一致
 * （均为 `system:{resource}:{action}`）。
 *
 * 面向 CrudTable 的 row-actions-extra 插槽：该插槽由页面手写 el-button，
 * 不属于 schema 的 rowActions，因此享受不到自动接线，需显式补判定，
 * 否则会出现「工具栏按钮已按权限隐藏、行内按钮却仍可点击」的漏拦。
 *
 * @param resource 资源名，与 CrudTable 的 resource 属性保持一致
 * @returns 传入 action（权限码末段）返回是否拥有该权限
 */
export function useResourcePermission(resource: string) {
  return (action: string): boolean => hasPermission(`system:${resource}:${action}`)
}

export function usePermission() {
  return {
    hasPermission,
    hasRole,
  }
}
