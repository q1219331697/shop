import type { Page } from '@playwright/test'

import { endpoints } from '../../../src/api/endpoints'

import { SUCCESS } from '../../../src/api/resultCode'

import { apiUrl, auth, unwrap } from '../common/apiClient'
import {
  createPermissionTreeFixture,
  createPermissionViaApi,
  createTestRole,
  createTestUser,
  findAdminUserId,
  findRoleIdByName,
} from '../common/dataFactory'
import { expect, newPrefix } from '../common/e2eFixtures'
import { testCredentials } from '../fixtures/credentials'

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

  // 批量创建共享前缀的角色，暴露 roleName0..N / roleId0..N
  async roleBatch(page, args, vars) {
    const prefix = newPrefix(vars.用例ID)
    const count = Number(args.count ?? 2)
    for (let i = 0; i < count; i++) {
      const name = await createTestRole(
        page,
        `${prefix}-${i}`,
        args.desc ?? `E2E-${vars.用例ID}`,
        Number(args.status ?? 1),
      )
      vars['roleName' + i] = name
      // 暴露角色 ID：分配角色类用例需要用它预置「已分配 N 个角色」的前置
      const rid = await findRoleIdByName(page, name)
      if (rid !== undefined) vars['roleId' + i] = String(rid)
    }
    vars.rolePrefix = prefix
  },

  // 创建「角色 + 权限子树（菜单 + 3 个同级最底层操作）」，供分配权限回显用例
  // 角色与权限共用同一用例前缀（e2e-<用例ID>-<ts>），用例前后按用例ID统一清理
  // 暴露：roleName / roleId、menuName、leaf1..3（名称）、leafId1..3（ID，供接口预置授权）
  async rolePermLeaf(page, args, vars) {
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
    const leafIds: number[] = []
    for (let i = 0; i < leafNames.length; i++) {
      leafIds.push(
        await createPermissionViaApi(page, {
          permissionName: leafNames[i],
          permissionCode: `${prefix}-leaf${i + 1}`,
          permissionType: 3,
          parentId: menuId,
          sortOrder: i + 1,
          status: 1,
          visible: 0,
        }),
      )
    }
    const roleName = await createTestRole(page, prefix, args.desc ?? 'E2E-单选最底层权限', 1)
    vars.roleName = roleName
    // 暴露角色 ID：分配权限类用例需要用它预置「已分配 N 个资源」的前置
    const rid = await findRoleIdByName(page, roleName)
    if (rid !== undefined) vars.roleId = String(rid)
    vars.menuName = menuName
    vars.leaf1 = leafNames[0]
    vars.leaf2 = leafNames[1]
    vars.leaf3 = leafNames[2]
    vars.leafId1 = String(leafIds[0])
    vars.leafId2 = String(leafIds[1])
    vars.leafId3 = String(leafIds[2])
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

  // 预置「用户已分配 N 个角色」的前置（走接口，避免重复一遍 UI 分配链路）
  // 参数：user=用户名变量名（默认 user0）；roles=角色ID变量名，用 + 连接（如 roles=roleId0+roleId1）
  // 为什么用 + 而不是逗号：CSV 字段不能出现半角逗号，+ 不会破坏列切分
  async userAssignRoles(page, args, vars) {
    const username = vars[args.user ?? 'user0'] ?? vars.userName
    const userId = vars.userId ?? (username ? await findAdminUserId(page, username) : undefined)
    if (userId === undefined) {
      throw new Error(`userAssignRoles 未找到用户（用例 ${vars.用例ID}）`)
    }

    const roleIds = (args.roles ?? '')
      .split('+')
      .map((key) => key.trim())
      .filter((key) => key.length > 0)
      .map((key) => Number(vars[key] ?? key))
      .filter((id) => Number.isFinite(id))
    if (roleIds.length === 0) {
      throw new Error(`userAssignRoles 未解析到角色（用例 ${vars.用例ID}，roles=${args.roles ?? ''}）`)
    }

    await page.request.post(apiUrl(endpoints.adminUser.assignRoles(userId)), {
      data: { roleIds },
      headers: auth(),
    })

    // 确认已落库再返回：分配页的回显读的是后端数据，未确认就进 UI 会偶发断不到勾选
    await expect
      .poll(
        async () => {
          const resp = await page.request.get(apiUrl(endpoints.adminUser.roleIds(userId)), {
            headers: auth(),
          })
          const ids = await unwrap<number[]>(resp)
          return [...ids].sort().join(',') === [...roleIds].sort().join(',')
        },
        { timeout: 15000, intervals: [200, 400, 800] },
      )
      .toBe(true)
  },

  // 预置「角色已分配 N 个资源（权限）」的前置（走接口，避免重复一遍 UI 授权链路）
  // 参数：role=角色名变量名（默认 roleName，优先用 vars.roleId）；perms=权限ID变量名，用 + 连接（如 perms=leafId1+leafId2）
  // 为什么用 + 而不是逗号：CSV 字段不能出现半角逗号，+ 不会破坏列切分
  async roleAssignPermissions(page, args, vars) {
    const roleName = vars[args.role ?? 'roleName']
    const roleId = vars.roleId ?? (roleName ? await findRoleIdByName(page, roleName) : undefined)
    if (roleId === undefined) {
      throw new Error(`roleAssignPermissions 未找到角色（用例 ${vars.用例ID}）`)
    }

    const permissionIds = (args.perms ?? '')
      .split('+')
      .map((key) => key.trim())
      .filter((key) => key.length > 0)
      .map((key) => Number(vars[key] ?? key))
      .filter((id) => Number.isFinite(id))
    if (permissionIds.length === 0) {
      throw new Error(`roleAssignPermissions 未解析到权限（用例 ${vars.用例ID}，perms=${args.perms ?? ''}）`)
    }

    await page.request.post(apiUrl(endpoints.role.assignPermissions(roleId)), {
      data: { permissionIds },
      headers: auth(),
    })

    // 确认已落库再返回：分配页回显读的是后端数据，未确认就进 UI 会偶发断不到勾选
    await expect
      .poll(
        async () => {
          const resp = await page.request.get(apiUrl(endpoints.role.permissionIds(roleId)), {
            headers: auth(),
          })
          const ids = await unwrap<number[]>(resp)
          return [...ids].sort().join(',') === [...permissionIds].sort().join(',')
        },
        { timeout: 15000, intervals: [200, 400, 800] },
      )
      .toBe(true)
  },

  // 用「用户名 + 密码」直接调登录接口，验证该账号密码可用
  // （新增默认密码 / 重置密码类用例的收口断言：密码真的能登录，而不只是接口返回成功）
  // 参数：user=用户名变量名（默认 userName，其次 newUserName）；password=密码（默认系统默认密码）；
  //       tokenVar=Token 存放的变量名（默认 userToken），供「以该账号身份调接口」的用例复用
  async loginAs(page, args, vars) {
    const username = vars[args.user ?? ''] ?? vars.userName ?? vars.newUserName
    if (!username) {
      throw new Error(`loginAs 未找到用户（用例 ${vars.用例ID}）`)
    }
    const password = args.password ?? testCredentials.defaultAdminPassword
    const resp = await page.request.post(apiUrl(endpoints.auth.login), {
      data: { username, password },
    })
    const body = (await resp.json()) as { code?: string; message?: string; data?: string }
    if (body.code !== SUCCESS) {
      throw new Error(
        `loginAs 登录失败：username=${username} code=${body.code} message=${body.message ?? ''}` +
          `（用例 ${vars.用例ID}）`,
      )
    }
    vars[args.tokenVar ?? 'userToken'] = String(body.data ?? '')
  },

  // 以指定账号的 Token 调「自助改密」接口（接口级正向），断言接口返回成功
  // 参数：token=Token 变量名（默认 userToken）；old=原密码（默认系统默认密码）；new=新密码（必填）
  async changePasswordAs(page, args, vars) {
    const token = vars[args.token ?? 'userToken']
    if (!token) {
      throw new Error(`changePasswordAs 未找到 Token（用例 ${vars.用例ID}）`)
    }
    const newPassword = args.new
    if (!newPassword) {
      throw new Error(`changePasswordAs 缺少新密码 new（用例 ${vars.用例ID}）`)
    }
    const resp = await page.request.put(apiUrl(endpoints.adminUser.changePassword), {
      data: { oldPassword: args.old ?? testCredentials.defaultAdminPassword, newPassword },
      headers: { Authorization: `Bearer ${token}` },
    })
    await unwrap(resp)
  },

  // UI 登录（整页刷新会清空登录态，admin 模块每个用例独立 context，需各自登录）
  // 参数：path=登录后要进入的目标页（默认 /system/admin）
  async uiLogin(page, args, _vars) {
    const path = args.path ?? '/system/admin'
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
    await page.goto(path)
    // 目标页为懒加载 chunk，等表格渲染再返回，避免首屏竞态
    // （权限管理页是 el-table 树形表格，同属 .el-table）
    await page.waitForSelector('.el-table', { timeout: 30000 })
  },

  // 指定账号的 UI 登录：uiLogin 固定用超管 admin，改密类用例绝不能改超管密码
  // （否则后续所有依赖 admin/admin123 的用例都会失败），故需以「被造账号」身份操作 UI。
  // 参数：user=用户名变量名（默认 userName，其次 newUserName）；password=密码（默认系统默认密码）；
  //       path=登录后要进入的目标页（默认 /dashboard，纯登录态校验可不传）
  async uiLoginAs(page, args, vars) {
    const username = vars[args.user ?? ''] ?? vars.userName ?? vars.newUserName
    if (!username) {
      throw new Error(`uiLoginAs 未找到用户（用例 ${vars.用例ID}）`)
    }
    const password = args.password ?? testCredentials.defaultAdminPassword
    const path = args.path ?? '/dashboard'

    await page.goto('/login')
    await page.locator(".el-input__inner[placeholder='请输入用户名']").fill(username)
    await page.locator(".el-input__inner[placeholder='请输入密码']").fill(password)
    await page.locator('.login-btn').click()
    // 必须等登录真正跳转完成（写 Cookie）后再 goto，否则会打断登录请求
    await page.waitForURL('**/dashboard', { timeout: 30000 })

    if (path !== '/dashboard') {
      await page.goto(path)
      // 无权限账号的菜单为空，任务页是静态注册路由；等 SubPage 骨架渲染再返回
      await page.waitForSelector('.sub-page', { timeout: 30000 })
    }
  },
}

export function runSetup(key: string, page: Page, rawArgs: string, vars: Vars, caseId: string): Promise<void> {
  const fn = setupRegistry[key]
  if (!fn) throw new Error(`未知 setupApi: ${key}`)
  // 用例ID 作为造数名一部分（e2e-<用例ID>-<后缀>），保证造数与清理前缀一致
  vars.用例ID = caseId
  return fn(page, parseArgs(rawArgs), vars)
}
