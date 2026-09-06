/**
 * 接口层统一出口（聚合层）
 *
 * 设计约定：
 * - 各业务模块的「类型 + 调用」内聚在对应模块文件（auth / adminUser / role / permission）
 * - 本文件只做聚合：把各模块调用挂到 api 对象，并把类型再导出供业务组件 `import type` 使用
 * - 业务组件通过自动导入使用 api（无需 import）；类型需显式 `import type { ... } from '@/api'`
 * - 接口地址统一定义在 @/api/endpoints，生产与 E2E 测试共用同一份地址
 */
import { adminUserApi } from './adminUser'
import { authApi } from './auth'
import { permissionApi } from './permission'
import { roleApi } from './role'

// ==================== 类型再导出（业务组件 `import type { ... } from '@/api'`） ====================

// 通用类型
export type {
  PageParams,
  PageResult,
  IPageResult,
  ApiResponse,
} from './types'
// 各模块类型
export type { LoginParams, LoginResult } from './auth'
export type { AdminUserItem, AdminUserPageParams } from './adminUser'
export type { RoleItem, RolePageParams } from './role'
export type { PermissionItem, PermissionPageParams, PermissionTreeResult } from './permission'

// ==================== api 聚合对象 ====================

/**
 * 全部后端接口的唯一入口
 * 业务组件通过自动导入直接使用（无需 import）
 */
export const api = {
  auth: authApi,
  adminUser: adminUserApi,
  role: roleApi,
  permission: permissionApi,
}
