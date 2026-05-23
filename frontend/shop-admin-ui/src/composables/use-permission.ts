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

export function usePermission() {
  return {
    hasPermission,
    hasRole,
  }
}

