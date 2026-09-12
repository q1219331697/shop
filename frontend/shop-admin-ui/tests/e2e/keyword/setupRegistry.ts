import type { Page } from '@playwright/test'

import {
  createPermissionTreeFixture,
  createPermissionViaApi,
  createTestRole,
  createTestUser,
  findAdminUserId,
  findRoleIdByName,
} from '../common/dataFactory'
import { newPrefix } from '../common/e2eFixtures'

/**
 * 造数注册表：CSV 步骤通过 操作=setupApi + 定位值=<注册名> + 输入值=<key=value;...> 调用。
 *
 * 设计要点：
 * - 造数逻辑留在 TS（数据工厂本就是代码），CSV 只负责"准备什么数据 + 后续 UI 步骤"。
 * - 造出的实体名以隔离前缀派生，并写入 vars（如 dirName / createdName / roleName），
 *   后续 UI 步骤用 ${...} 变量回灌，避免把动态名写死进 CSV。
 * - 清理由 excel-driven.spec 统一按「用例ID 前缀」e2e-<用例ID>- 处理（用例前后各一次），
 *   造数侧无需登记前缀：本用例的多次造数会各自生成带时间戳的前缀，登记单个值会被后者覆盖而漏清。
 *
 * 参数格式：输入值用 `key=value;key=value` 分隔（避免 JSON 逗号破坏 CSV，无需引号转义）。
 */
export type Vars = Record<string, string>

function parseArgs(raw: string): Record<string, string> {
  if (!raw || raw === '-') return {}
  const out: Record<string, string> = {}
  for (const pair of raw.split(';')) {
    const i = pair.indexOf('=')
    if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1)
  }
  return out
}

export const setupRegistry: Record<
  string,
  (page: Page, args: Record<string, string>, vars: Vars) => Promise<void>
> = {
  // 创建一棵「目录→菜单→操作」权限子树，暴露 dirName / menuName / actionName / treePrefix
  async permTree(page, _args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const { dirName, menuName, actionName } = await createPermissionTreeFixture(page, prefix)
    vars.dirName = dirName
    vars.menuName = menuName
    vars.actionName = actionName
    vars.treePrefix = prefix
  },

  // 创建单条权限（删除 / 父级用例用），暴露 createdName / nodePrefix / nodeCode
  async permCreate(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const name = `${prefix}-node`
    const permId = await createPermissionViaApi(page, {
      permissionName: name,
      permissionCode: `${prefix}-node:code`,
      permissionType: Number(args.type ?? 2),
      parentId: args.parentId ? Number(args.parentId) : 0,
      path: args.path ?? '/e2e/node',
      component: args.component ?? 'views/error/404.vue',
      icon: args.icon ?? 'Document',
      sortOrder: 999,
      status: 1,
      visible: 1,
    })
    vars.createdName = name
    vars.nodePrefix = prefix
    // 暴露权限 ID，供「编辑态后端拒绝」用例（apiReject 更新接口）定位目标实体
    vars.permissionId = String(permId)
    // 权限编码与 API 造数保持同一「中杠+案例ID」形态，一眼可辨为同一批 E2E 测试数据；
    // UI 表单编码校验已放开允许中杠与大写（见 schema.ts）。
    // 注意：步骤 7 的 API 父权限已占用 e2e-TC-PERM-04-<ts>-node:code，这里子节点必须用不同后缀
    // （-new:code）以避免与父节点编码冲突（后端校验权限编码唯一），同时仍能溯源到同一用例。
    // 后端清理按 permission_name 前缀匹配，与编码无关。
    vars.nodeCode = `${prefix}-new:code`
  },

  // 批量创建共享前缀的权限（操作类型，无子节点），暴露 permName0..N / permPrefix
  async permBatch(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const count = Number(args.count ?? 2)
    const type = Number(args.type ?? 3)
    for (let i = 0; i < count; i++) {
      vars['permName' + i] = await createPermissionViaApi(page, {
        permissionName: `${prefix}-${i}`,
        permissionCode: `${prefix}-${i}:code`,
        permissionType: type,
        parentId: 0,
        path: '/e2e/batch',
        component: 'views/error/404.vue',
        icon: 'Document',
        sortOrder: 999,
        status: 1,
        visible: 1,
      })
    }
    vars.permPrefix = prefix
  },

  // 仅生成一个角色名（不落库）：供 UI 表单新增用例回灌搜索与清理前缀
  async roleNameGen(_page, _args, vars) {
    const prefix = newPrefix(vars.用例ID)
    vars.newRoleName = prefix
  },

  // 创建单条角色，暴露 roleName
  async roleCreate(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const name = await createTestRole(page, prefix, args.desc ?? `E2E-${vars.用例ID}`, Number(args.status ?? 1))
    vars.roleName = name
    // 暴露角色 ID，供「编辑态后端拒绝」用例（apiReject 更新接口）定位目标实体
    const rid = await findRoleIdByName(page, name)
    if (rid !== undefined) vars.roleId = String(rid)
  },

  // 批量创建共享前缀的角色，暴露 roleName0..N
  async roleBatch(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const count = Number(args.count ?? 2)
    for (let i = 0; i < count; i++) {
      vars['roleName' + i] = await createTestRole(
        page,
        `${prefix}-${i}`,
        args.desc ?? `E2E-${vars.用例ID}`,
        Number(args.status ?? 1),
      )
    }
    vars.rolePrefix = prefix
  },

  // 创建「角色 + 权限子树（菜单 + 3 个同级最底层操作）」，供分配权限回显用例
  // 角色与权限共用同一用例前缀（e2e-<用例ID>-<ts>），用例前后按用例ID统一清理
  async rolePermLeaf(page, _args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const menuName = `${prefix}-menu`
    const leafNames = [`${prefix}-leaf1`, `${prefix}-leaf2`, `${prefix}-leaf3`]
    const menuId = await createPermissionViaApi(page, {
      permissionName: menuName,
      permissionCode: `${prefix}-menu`,
      permissionType: 2,
      parentId: 0,
      path: '/e2e/assign',
      component: 'views/error/404.vue',
      icon: 'Menu',
      sortOrder: 999,
      status: 1,
      visible: 0,
    })
    for (let i = 0; i < leafNames.length; i++) {
      await createPermissionViaApi(page, {
        permissionName: leafNames[i],
        permissionCode: `${prefix}-leaf${i + 1}`,
        permissionType: 3,
        parentId: menuId,
        sortOrder: i + 1,
        status: 1,
        visible: 0,
      })
    }
    const roleName = await createTestRole(page, prefix, 'E2E-单选最底层权限', 1)
    vars.roleName = roleName
    vars.menuName = menuName
    vars.leaf1 = leafNames[0]
    vars.leaf2 = leafNames[1]
    vars.leaf3 = leafNames[2]
  },

  // 仅生成一个用户名（不落库）：供 UI 表单新增用例回灌搜索与清理前缀
  async userGen(_page, _args, vars) {
    const prefix = newPrefix(vars.用例ID)
    vars.newUserName = prefix
  },

  // 创建单条管理员用户，暴露 userName
  async userCreate(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const username = await createTestUser(
      page,
      prefix,
      args.desc ?? `E2E-${vars.用例ID}`,
      Number(args.status ?? 1),
      args.deleted === 'true',
    )
    vars.userName = username
    // 暴露用户 ID，供「编辑态后端拒绝」用例（apiReject 更新接口）定位目标实体
    const uid = await findAdminUserId(page, username)
    if (uid !== undefined) vars.userId = String(uid)
  },

  // 批量创建共享前缀的管理员用户，暴露 user0..N / userPrefix
  async userBatch(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const count = Number(args.count ?? 2)
    for (let i = 0; i < count; i++) {
      vars['user' + i] = await createTestUser(
        page,
        `${prefix}-${i}`,
        args.desc ?? `E2E-${vars.用例ID}`,
        Number(args.status ?? 1),
        args.deleted === 'true',
      )
    }
    vars.userPrefix = prefix
  },

  // UI 登录（整页刷新会清空登录态，admin 模块每个用例独立 context，需各自登录）
  async uiLogin(page, _args, _vars) {
    await page.goto('/login')
    await page
      .locator(".el-input__inner[placeholder='请输入用户名']")
      .fill('admin')
    await page
      .locator(".el-input__inner[placeholder='请输入密码']")
      .fill('admin123')
    await page.locator('.login-btn').click()
    // 必须等登录真正跳转完成（写 Cookie）后再整页刷新，否则刷新会打断登录请求
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    await page.goto('/system/admin')
    // admin 页面为懒加载 chunk，等表格真正渲染再返回，避免首屏竞态
    await page.waitForSelector('.el-table', { timeout: 30000 })
  },
}

export function runSetup(key: string, page: Page, rawArgs: string, vars: Vars, caseId: string): Promise<void> {
  const fn = setupRegistry[key]
  if (!fn) throw new Error(`未知 setupApi: ${key}`)
  // 用例ID 作为造数名一部分（e2e-<用例ID>-<后缀>），保证造数与清理前缀一致
  vars.用例ID = caseId
  return fn(page, parseArgs(rawArgs), vars)
}
