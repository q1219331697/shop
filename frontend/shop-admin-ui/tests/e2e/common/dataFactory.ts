/**
 * E2E 造数工厂（三个数据类模块共用的唯一入口）
 *
 * 管理员 / 角色 / 权限的「准备数据」全部收敛到这里，统一保证三件事：
 *
 * 1. 名称同源：入参 casePrefix 既是数据名称前缀，也是 isolatedPrefix 注册的清理前缀，
 *    因此「造出来的数据」与「清理时匹配的数据」必然一致，不会出现造数后清不干净的残留。
 * 2. 创建即确认：统一在创建后轮询列表接口，确认数据已提交可查再返回。
 *    少了这一步，用例进入 UI 搜索时后端数据可能尚未可见，是并行下最常见的偶发失败源。
 * 3. 唯一性：名称统一追加 Date.now().toString(36)，跨批次、跨用例、跨 worker 都不重合。
 *
 * ⚠️ 这里只造「用例自己会清理」的临时数据（e2e_ 前缀），不依赖任何数据库种子数据。
 */
import type { Page } from '@playwright/test'

import type { AdminUserItem } from '../../../src/api/adminUser'
import { endpoints } from '../../../src/api/endpoints'
import type { PermissionItem } from '../../../src/api/permission'
import type { RoleItem } from '../../../src/api/role'
import type { IPageResult } from '../../../src/api/types'

import { apiUrl, auth, unwrap } from './apiClient'
import { expect } from './e2eFixtures'

/** 造数后「确认数据可查」的轮询预算（毫秒） */
const CONFIRM_TIMEOUT = 15000

/** 时间戳后缀：保证同名前缀的多次造数互不重合 */
const uniqueSuffix = (): string => Date.now().toString(36)

/** 轮询确认造数结果已在列表中可查 */
async function confirmCreated(page: Page, probe: () => Promise<boolean>): Promise<void> {
  await expect.poll(probe, { timeout: CONFIRM_TIMEOUT, intervals: [200, 400, 800] }).toBe(true)
}

/** 查询管理员用户 ID（创建后如需立即删除/关联时使用） */
async function findAdminUserId(page: Page, username: string): Promise<number | undefined> {
  const resp = await page.request.get(apiUrl(endpoints.adminUser.list), {
    params: { username, pageNum: 1, pageSize: 10 },
    headers: auth(),
  })
  const result = await unwrap<IPageResult<AdminUserItem>>(resp)
  return (result.records ?? []).find((r) => r.username === username)?.id
}

/** 按角色名查询角色 ID（不存在返回 undefined） */
export async function findRoleIdByName(page: Page, roleName: string): Promise<number | undefined> {
  const resp = await page.request.get(apiUrl(endpoints.role.list), {
    params: { roleName, pageNum: 1, pageSize: 10 },
    headers: auth(),
  })
  const result = await unwrap<IPageResult<RoleItem>>(resp)
  return (result.records ?? []).find((r) => r.roleName === roleName)?.id
}

/**
 * 创建临时后台管理员用户，返回用户名
 *
 * @param casePrefix 用例前缀（须为 isolatedPrefix() 返回值，含 workerId）
 * @param realName 真实姓名（传中文用例名，如 E2E-禁用用户，便于库内区分）
 * @param status 1-正常，0-禁用
 * @param deleted 创建后立即逻辑删除（用于已删除态用例）
 */
export async function createTestUser(
  page: Page,
  casePrefix: string,
  realName: string,
  status = 1,
  deleted = false,
): Promise<string> {
  const username = `${casePrefix}_${uniqueSuffix()}`
  await page.request.post(apiUrl(endpoints.adminUser.create), {
    data: { username, password: 'testpass123', realName, status },
    headers: auth(),
  })

  if (deleted) {
    const id = await findAdminUserId(page, username)
    if (id) {
      await page.request.delete(apiUrl(endpoints.adminUser.delete(id)), { headers: auth() })
    }
  }

  await confirmCreated(page, async () => {
    const resp = await page.request.get(apiUrl(endpoints.adminUser.list), {
      params: { username, pageNum: 1, pageSize: 10 },
      headers: auth(),
    })
    const result = await unwrap<IPageResult<AdminUserItem>>(resp)
    return (result.records ?? []).some((r) => r.username === username)
  })
  return username
}

/**
 * 批量创建共享前缀的临时管理员用户（序号拼在前缀之后，一次清理即可命中全部）
 */
export async function createBatchUsers(
  page: Page,
  prefix: string,
  count: number,
  realName: string,
  status = 1,
  deleted = false,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await createTestUser(page, `${prefix}_${i}`, realName, status, deleted)
  }
}

/**
 * 创建临时角色，返回角色名
 *
 * @param casePrefix 用例前缀（须为 isolatedPrefix() 返回值，含 workerId）
 * @param description 角色描述（传中文用例名，如 E2E-禁用角色）
 * @param status 1-正常，0-禁用
 */
export async function createTestRole(
  page: Page,
  casePrefix: string,
  description: string,
  status = 1,
): Promise<string> {
  const roleName = `${casePrefix}_${uniqueSuffix()}`
  await page.request.post(apiUrl(endpoints.role.create), {
    data: { roleName, description, sortOrder: 99, status },
    headers: auth(),
  })

  await confirmCreated(page, async () => {
    const resp = await page.request.get(apiUrl(endpoints.role.list), {
      params: { roleName, pageNum: 1, pageSize: 10 },
      headers: auth(),
    })
    const result = await unwrap<IPageResult<RoleItem>>(resp)
    return (result.records ?? []).some((r) => r.roleName === roleName)
  })
  return roleName
}

/** 批量创建共享前缀的临时角色（序号拼在前缀之后，一次清理即可命中全部） */
export async function createBatchRoles(
  page: Page,
  prefix: string,
  count: number,
  description: string,
  status = 1,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await createTestRole(page, `${prefix}_${i}`, description, status)
  }
}

/**
 * 创建一条权限，返回新权限 ID
 *
 * 权限名称由调用方传入（须用 e2e_ 前缀派生，才能随用例前缀一并清理）。
 * 后端创建接口直接返回新 ID，无需再从权限树反查。
 */
export async function createPermissionViaApi(
  page: Page,
  body: Partial<PermissionItem>,
): Promise<number> {
  const resp = await page.request.post(apiUrl(endpoints.permission.create), {
    data: body,
    headers: auth(),
  })
  return await unwrap<number>(resp)
}

/** 一棵自建权限子树的节点名（目录 → 菜单 → 操作） */
export interface PermissionFixture {
  /** 目录节点名（type=1） */
  dirName: string
  /** 菜单节点名（type=2） */
  menuName: string
  /** 操作节点名（type=3） */
  actionName: string
}

/**
 * 创建一棵三类型权限子树（目录 → 菜单 → 操作），供只读用例（类型列 / 详情 / 搜索）断言使用
 *
 * 三个节点名共用 casePrefix，一次搜索即可全部命中；随该前缀一并清理。
 */
export async function createPermissionTreeFixture(
  page: Page,
  casePrefix: string,
): Promise<PermissionFixture> {
  const dirName = `${casePrefix}_dir`
  const menuName = `${casePrefix}_menu`
  const actionName = `${casePrefix}_act`

  const dirId = await createPermissionViaApi(page, {
    permissionName: dirName,
    permissionCode: `${casePrefix}_dir`,
    permissionType: 1,
    parentId: 0,
    path: '/e2e/dir',
    icon: 'Folder',
    sortOrder: 999,
    status: 1,
    visible: 1,
  })
  const menuId = await createPermissionViaApi(page, {
    permissionName: menuName,
    permissionCode: `${casePrefix}_menu`,
    permissionType: 2,
    parentId: dirId,
    path: '/e2e/menu',
    component: 'views/error/404.vue',
    icon: 'Menu',
    sortOrder: 1,
    status: 1,
    visible: 1,
  })
  await createPermissionViaApi(page, {
    permissionName: actionName,
    permissionCode: `${casePrefix}_act`,
    permissionType: 3,
    parentId: menuId,
    sortOrder: 1,
    status: 1,
    visible: 1,
  })

  return { dirName, menuName, actionName }
}

/** 给角色全量授权（授权链路用例用） */
export async function assignPermissionsToRole(
  page: Page,
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  await page.request.post(apiUrl(endpoints.role.assignPermissions(roleId)), {
    data: { permissionIds },
    headers: auth(),
  })
}

/** 查询角色已授权的权限 ID 列表 */
export async function getRolePermissionIds(page: Page, roleId: number): Promise<number[]> {
  const resp = await page.request.get(apiUrl(endpoints.role.permissionIds(roleId)), {
    headers: auth(),
  })
  return await unwrap<number[]>(resp)
}
