/**
 * 权限判断组合式函数
 * TODO: 后端提供权限接口后补充实际逻辑
 */

/** 判断是否拥有指定权限 */
export function hasPermission(_permission: string): boolean {
  // 后端暂无权限接口，默认放行
  return true
}

/** 判断是否拥有指定角色 */
export function hasRole(_role: string): boolean {
  // 后端暂无角色接口，默认放行
  return true
}

export function usePermission() {
  return {
    hasPermission,
    hasRole,
  }
}
