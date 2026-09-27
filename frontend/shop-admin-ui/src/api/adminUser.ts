/**
 * 管理员用户模块：类型 + 调用内聚
 * 接口地址统一取自 @/api/endpoints（不在本文件重复书写）
 */
import type { IdType } from '@/components/CrudTable/types'

import { endpoints } from './endpoints'
import request from './http'
import type { PageParams, PageResult, IPageResult } from './types'
import { convertIPage } from './types'

/** 管理员用户信息 */
export interface AdminUserItem {
  id: number
  username: string
  password?: string
  realName: string
  status: number
  /** 登录锁定：true-已锁定，false-未锁定（取自 Redis，非数据库字段） */
  locked?: boolean
  /** 删除标记：0-未删除，1-已删除（后端 number；此处不用 boolean，与 role/permission 保持一致） */
  deleted: number
  createDatetime: string
  updateDatetime: string
}

/** 管理员分页查询参数 */
export interface AdminUserPageParams extends PageParams {
  username?: string
  realName?: string
  status?: number
  /** 删除状态筛选：0-未删除，1-已删除，undefined-全部 */
  deleted?: number
}

/** 修改密码参数 */
export interface ChangePasswordParams {
  /** 原密码 */
  oldPassword: string
  /** 新密码 */
  newPassword: string
}

/**
 * 管理员用户模块 API（CrudTable :api 直接使用）
 * <p>
 * 键名即契约：前 6 个键供 CrudTable 消费（list / detail / create / update / delete / batchDelete），
 * 其余为业务扩展键。全部用箭头属性定义，不依赖 this，可安全地被组件解构后单独调用。
 * </p>
 */
export const adminUserApi = {
  // ==================== CrudTable 契约键 ====================
  /** 列表（分页）：后端返回 IPage，转前端统一 PageResult */
  list: async (params: AdminUserPageParams): Promise<PageResult<AdminUserItem>> => {
    const ipage = await request.post<IPageResult<AdminUserItem>>(endpoints.adminUser.list, params)
    return convertIPage(ipage)
  },
  /** 详情 */
  detail: (id: IdType) => request.post<AdminUserItem>(endpoints.adminUser.detail, { id }),
  /** 新增（密码可不传，由后端使用系统默认密码） */
  create: (data: Partial<AdminUserItem>) => request.post(endpoints.adminUser.create, data),
  /** 编辑 */
  update: (id: IdType, data: Partial<AdminUserItem>) =>
    request.post(endpoints.adminUser.update, { ...data, id }),
  /** 删除 */
  delete: (id: IdType) => request.post(endpoints.adminUser.delete, { id }),
  /** 批量删除 */
  batchDelete: (ids: IdType[]) => request.post(endpoints.adminUser.batchDelete, { ids }),

  // ==================== 业务扩展键（CrudTable 不消费，页面 / schema / store 使用） ====================
  /** 禁用 */
  disable: (id: IdType) => request.post(endpoints.adminUser.disable, { id }),
  /** 启用 */
  enable: (id: IdType) => request.post(endpoints.adminUser.enable, { id }),
  /** 恢复（还原已删除） */
  restore: (id: IdType) => request.post(endpoints.adminUser.restore, { id }),
  /** 重置密码为系统默认密码（提示文案取 defaultPassword） */
  resetPassword: (id: IdType) => request.post(endpoints.adminUser.resetPassword, { id }),
  /** 解锁登录锁定（清除失败计数与锁定状态，解锁后可立即登录） */
  unlock: (id: IdType) => request.post(endpoints.adminUser.unlock, { id }),
  /** 获取系统默认密码（新增/重置密码提示展示用） */
  defaultPassword: () => request.post<string>(endpoints.adminUser.defaultPassword),
  /** 修改当前登录管理员密码（失败原因由后端返回：如原密码错误） */
  changePassword: (data: ChangePasswordParams) =>
    request.post(endpoints.adminUser.changePassword, data),
  /** 批量禁用 */
  batchDisable: (ids: IdType[]) => request.post(endpoints.adminUser.batchDisable, { ids }),
  /** 批量启用 */
  batchEnable: (ids: IdType[]) => request.post(endpoints.adminUser.batchEnable, { ids }),
  /** 批量恢复 */
  batchRestore: (ids: IdType[]) => request.post(endpoints.adminUser.batchRestore, { ids }),
  /** 为管理员分配角色 */
  assignRoles: (userId: IdType, roleIds: number[]) =>
    request.post(endpoints.adminUser.assignRoles, { id: userId, roleIds }),
  /** 查询管理员的角色ID列表 */
  roleIds: (userId: IdType) => request.post<number[]>(endpoints.adminUser.roleIds, { id: userId }),
  /** 获取当前登录用户的权限编码列表（区别于菜单树：含按钮级编码，供路由级权限校验） */
  permissions: () => request.post<string[]>(endpoints.adminUser.permissions),
  /** 获取当前登录管理员信息（密码已由后端置空） */
  current: () => request.post<AdminUserItem>(endpoints.adminUser.current),
}
