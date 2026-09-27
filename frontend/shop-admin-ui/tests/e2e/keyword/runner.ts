import { Page, expect } from '@playwright/test'
import type { APIResponse, Locator } from '@playwright/test'

import { endpoints } from '../../../src/api/endpoints'
import { PARAM_ERROR, SUCCESS, UNAUTHORIZED } from '../../../src/api/resultCode'
import { auth, apiUrl, unwrap } from '../common/apiClient'
import { testCredentials } from '../fixtures/credentials'

import type { Step } from './csv'
import { toLocator } from './locator'
import { runSetup, type Vars } from './setupRegistry'

// 将 ${var} 替换为 vars 中的值（找不到则保留原样）
function sub(v: string, vars: Vars): string {
  return v.replace(/\$\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `\${${k}`))
}

/** 按角色名（第 3 列，0-based index=2）定位表格行 */
function rowByName(page: Page, name: string) {
  return page
    .locator('.el-table__body tr')
    .filter({ has: page.locator('td').nth(2).getByText(name, { exact: true }) })
    .first()
}

/** 在分配权限树中按节点名定位树节点内容行 */
function treeNode(page: Page, name: string) {
  return page
    .locator('.el-tree-node__content')
    .filter({ has: page.getByText(name, { exact: true }) })
    .first()
}

/** 管理员行（列表接口返回的最小字段集） */
interface AdminUserRow {
  id: number
  username: string
  status: number
  deleted: number
}

/** 按用户名查询管理员（含已删除，绕过逻辑删除过滤），取精确同名记录 */
async function findAdminUser(page: Page, username: string): Promise<AdminUserRow | undefined> {
  const resp = await page.request.post(apiUrl(endpoints.adminUser.list), {
    data: { username, pageNum: 1, pageSize: 20 },
    headers: auth(),
  })
  const result = await unwrap<{ records?: AdminUserRow[] }>(resp)
  return (result.records ?? []).find((r) => r.username === username)
}

// 将"操作"列分发为具体的 Playwright 动作
export async function dispatch(step: Step, page: Page, vars: Vars): Promise<void> {
  // 造数：注册表式调用。注册名在「定位方式」列，参数（key=value;...）在「定位值」列
  if (step.操作 === 'setupApi') {
    // 用例ID 一并传入：造数名格式为 e2e-<用例ID>-<唯一后缀>
    await runSetup(step.定位方式, page, step.定位值, vars, step.用例ID)
    return
  }

  const 定位值 = sub(step.定位值, vars)
  const 输入值 = sub(step.输入值, vars)
  const 预期 = sub(step.预期, vars)

  // 后端安全层校验的契约断言：绕过前端直接调用创建接口，断言非法入参被拒绝（HTTP 200 + code=PARAM_ERROR）
  if (step.操作 === 'apiReject') {
    await apiReject(page, step.定位方式, 输入值, 预期)
    return
  }

  // 后端自身保护契约断言：直接对「当前登录管理员」调用删除/禁用类接口（见 apiSelf 说明）
  if (step.操作 === 'apiSelf') {
    await apiSelf(page, step.定位方式, 定位值)
    return
  }

  // 后端「当前登录账号」接口契约断言：GET /adminUser/current（见 apiCurrentAdmin 说明）
  if (step.操作 === 'apiCurrentAdmin') {
    await apiCurrentAdmin(page, step.定位方式, 定位值, 输入值, vars)
    return
  }

  // 接口层登录失败契约断言：直接调 /public/login，断言失败码与文案
  // （替代「瞬时提示」断言，见 apiLoginFail 说明）
  if (step.操作 === 'apiLoginFail') {
    await apiLoginFail(page, 定位值, 预期, step.预期类型)
    return
  }

  const loc = step.定位方式 !== '-' ? toLocator(page, step.定位方式, 定位值) : null

  // goto / press / wait 等步骤本就无需定位目标，故惰性取值：
  // 读取到空值意味着用例漏写定位方式，抛出带操作名的错误好过静默的 null 引用
  const el = (): Locator => {
    if (!loc) throw new Error(`步骤「${step.操作}」未指定定位方式，无法确定操作目标`)
    return loc
  }

  switch (step.操作) {
    case 'goto':
      await page.goto(定位值)
      return
    case 'fill':
      // 输入值为 "-" 表示留空；超时继承全局 use.actionTimeout，不在此写死
      await el().fill(输入值 === '-' ? '' : 输入值)
      return
    case 'type':
      await el().type(输入值 === '-' ? '' : 输入值)
      return
    case 'click':
      // 部分按钮（如行选中后才启用的操作栏按钮）依赖 Vue 响应式启用；超时继承全局 use.actionTimeout
      await el().click()
      return
    case 'hover':
      await el().hover()
      return
    case 'select':
      await el().selectOption(输入值)
      return
    case 'press':
      await page.keyboard.press(输入值)
      return
    case 'wait':
      await page.waitForLoadState()
      return
    // 以下 expect* 断言超时统一继承全局 expect.timeout（见 playwright.config.ts），不再逐个写死
    case 'expectVisible':
      await expect(el()).toBeVisible()
      return
    case 'expectHidden':
      await expect(el()).toBeHidden()
      return
    case 'expectText':
      // 用包含匹配，容忍文案前后空白/图标差异
      await expect(el()).toContainText(预期)
      return
    case 'expectValue':
      // 编辑页字段由接口异步回填：这里也作为「等待回填完成」的同步点
      await expect(el()).toHaveValue(预期)
      return
    case 'expectURL':
      // 预期值作为正则匹配（如 /dashboard 可匹配完整 URL 中的路径）
      await expect(page).toHaveURL(new RegExp(预期))
      return
    case 'expectCount':
      // 断言匹配元素的数量（如统计卡片数量、节点隐藏时数量为 0）
      await expect(el()).toHaveCount(Number(预期))
      return
    case 'expectEnabled': {
      // 预期类型=disabled 断言禁用，否则断言启用；输入值为数字时取第 N 个匹配
      let target = el()
      if (/^\d+$/.test(输入值)) target = target.nth(Number(输入值))
      if (step.预期类型 === 'disabled') await expect(target).toBeDisabled()
      else await expect(target).toBeEnabled()
      return
    }
    case 'expectChecked': {
      // 预期=true 断言勾选，否则断言未勾选；输入值为数字时取第 N 个匹配
      let target = el()
      if (/^\d+$/.test(输入值)) target = target.nth(Number(输入值))
      if (预期 === 'true') await expect(target).toBeChecked()
      else await expect(target).not.toBeChecked()
      return
    }
    case 'selectRow': {
      // 搜索/提交后的表格重渲染会把刚勾上的选中清掉，故不能"勾选后立刻返回"：
      // 等行可见 → 勾选 → 静置一拍 → 复核仍为选中才返回，被清掉则重试
      const row = rowByName(page, 定位值)
      await row.waitFor({ state: 'visible', timeout: 10000 })
      const cb = row.locator('.el-checkbox__input').first()
      const deadline = Date.now() + 10000
      while (Date.now() < deadline) {
        const cls = (await cb.getAttribute('class')) ?? ''
        if (!cls.includes('is-checked')) {
          await cb.check({ timeout: 3000, force: true }).catch(() => {})
        }
        await page.waitForTimeout(300)
        const cls2 = (await cb.getAttribute('class')) ?? ''
        if (cls2.includes('is-checked')) return
      }
      throw new Error(`选中行 ${定位值} 失败（用例 ${step.用例ID} 步骤 ${step.序号}）`)
    }
    case 'selectAll':
      await page.locator('.el-table__header .el-checkbox__input').first().check()
      return
    case 'deselectAll':
      await page.locator('.el-table__header .el-checkbox__input').first().uncheck()
      return
    case 'clickRow':
      // 按角色名点击该行内指定文本的操作链接（详情/禁用/启用/分配权限）
      await rowByName(page, 定位值)
        .locator('.action-link')
        .filter({ hasText: 输入值 })
        .first()
        .click()
      return
    case 'expectCell': {
      // 按角色名定位行，断言第 输入值 列单元格文本；预期类型=exact 用精确匹配，否则包含
      const col = Number(输入值)
      const cell = rowByName(page, 定位值).locator('td').nth(col)
      if (step.预期类型 === 'exact') await expect(cell).toHaveText(预期)
      else await expect(cell).toContainText(预期)
      return
    }
    case 'toggleTree':
      // 勾选/取消勾选分配权限树中指定节点
      await treeNode(page, 定位值).locator('.el-checkbox__input').first().click()
      return
    case 'expectTreeChecked': {
      // 断言权限树节点勾选态（预期=true|false|half）；树为异步加载，轮询重试以容忍回显延迟
      // half = 半选：子节点只勾了一部分时父节点呈半选态（Element Plus 在 el-checkbox__input 上加 is-indeterminate）
      const want = 预期 === 'false' ? 'unchecked' : 预期 === 'half' ? 'half' : 'checked'
      const target = treeNode(page, 定位值).locator('.el-checkbox__input').first()
      let actual = 'unchecked'
      const deadline = Date.now() + 8000
      while (Date.now() < deadline) {
        const cls = (await target.getAttribute('class')) ?? ''
        actual = cls.includes('is-indeterminate')
          ? 'half'
          : cls.includes('is-checked')
            ? 'checked'
            : 'unchecked'
        if (actual === want) break
        await page.waitForTimeout(300)
      }
      if (actual !== want) {
        throw new Error(
          `权限树节点 ${定位值} 勾选态期望 ${want} 实际 ${actual}（用例 ${step.用例ID} 步骤 ${step.序号}）`,
        )
      }
      return
    }
    case 'expectRolePerms': {
      // 资源视角的数据断言：直接查角色的资源(权限)ID 列表，验证「资源归属角色」的结果（不依赖 UI 回显）
      // - 定位值：角色 ID（如 ${roleId}）
      // - 输入值：必须包含的资源 ID，用 + 连接（如 ${leafId1}+${leafId2}；- 表示不校验）
      // - 预期：必须不包含的资源 ID，用 + 连接（- 表示不校验）
      // - 预期类型=empty：断言资源列表为空（用于「取消全部」场景）
      const roleId = 定位值
      const parseIds = (raw: string): number[] =>
        raw === '' || raw === '-'
          ? []
          : raw
              .split('+')
              .map((k) => k.trim())
              .filter((k) => k.length > 0)
              .map((k) => Number(k))
              .filter((n) => Number.isFinite(n))
      const mustHave = parseIds(输入值)
      const mustNotHave = parseIds(预期)
      const wantEmpty = step.预期类型 === 'empty'

      let ids: number[] = []
      const deadline = Date.now() + 8000
      for (;;) {
        const resp = await page.request.post(apiUrl(endpoints.role.permissionIds), {
          data: { id: roleId },
          headers: auth(),
        })
        ids = await unwrap<number[]>(resp)
        const ok =
          (!wantEmpty || ids.length === 0) &&
          mustHave.every((id) => ids.includes(id)) &&
          mustNotHave.every((id) => !ids.includes(id))
        if (ok) return
        if (Date.now() > deadline) {
          throw new Error(
            `角色 ${roleId} 资源列表不符：实际 [${ids.join(',')}]` +
              `${wantEmpty ? ' 期望为空' : ''}` +
              `${mustHave.length ? ` 应含 [${mustHave.join(',')}]` : ''}` +
              `${mustNotHave.length ? ` 应不含 [${mustNotHave.join(',')}]` : ''}` +
              `（用例 ${step.用例ID} 步骤 ${step.序号}）`,
          )
        }
        await page.waitForTimeout(300)
      }
    }
    default:
      throw new Error(`未知操作: ${step.操作}（用例 ${step.用例ID} 步骤 ${step.序号}）`)
  }
}

/**
 * 后端安全层校验的契约断言：绕过前端直接调用接口，断言非法入参被拒绝
 * （HTTP 200 + code=PARAM_ERROR + 指定错误文案）。
 *
 * - 定位方式：实体名（user / role / permission / adminPassword）
 * - 输入值：覆盖字段（key=value;key=value）。若含 `id=`，则走【更新接口】（编辑态校验）；
 *          否则走创建接口（adminPassword 走自助改密接口 PUT /adminUser/password）。
 *          其余字段用各实体的合法基线值补全，故只需关注被改动的“非法字段”。
 * - 预期：错误文案子串（可选）；断言 body.message 包含它，证明是“该字段”被拒
 *
 * 基线值已覆盖必填字段，故单测某字段时只覆盖那一个非法值即可。
 * permissionCode 必须给出（实体 @NotBlank），且为静态值——非法用例在控制器层即被拒、
 * 不会真正落库，故不与其它用例的编码冲突。
 *
 * ⚠️ adminPassword 的基线是「合法且非当前密码」，用于验证前端 maxlength / 必填拦不到的后端兜底；
 *    使用它的用例必须覆盖一个必然导致失败的字段（超长 / 空串），否则会真的改掉超管密码。
 */
async function apiReject(
  page: Page,
  entity: string,
  overrides: string,
  expectMsg: string,
): Promise<void> {
  const base: Record<string, Record<string, unknown>> = {
    user: { username: 'e2e-api-user', password: 'testpass123', realName: 'E2E', status: 1 },
    role: { roleName: 'e2e-api-role', description: 'E2E', sortOrder: 99, status: 1 },
    permission: {
      permissionName: 'E2E-权限',
      permissionCode: 'e2e-perm-code',
      permissionType: 2,
      parentId: 0,
      path: '/e2e/x',
      status: 1,
      visible: 1,
    },
    adminPassword: { oldPassword: testCredentials.admin.password, newPassword: 'e2e-newpwd' },
  }
  const epCreate: Record<string, string> = {
    user: endpoints.adminUser.create,
    role: endpoints.role.create,
    permission: endpoints.permission.create,
  }
  /** 单资源 update：路径固定，id 随 body 提交 */
  const epAction: Record<string, string> = {
    user: endpoints.adminUser.update,
    role: endpoints.role.update,
    permission: endpoints.permission.update,
  }
  /** 自定义动作（无「按 id 更新资源」语义，字段全部走 body） */
  const epSelfAction: Record<string, string> = {
    adminPassword: endpoints.adminUser.changePassword,
  }
  const body: Record<string, unknown> = { ...(base[entity] ?? {}) }
  let id: string | undefined
  for (const pair of overrides.split(';')) {
    const i = pair.indexOf('=')
    if (i > 0) {
      const k = pair.slice(0, i)
      const v = pair.slice(i + 1)
      if (k === 'id') {
        id = v
        continue
      }
      body[k] = v
    }
  }
  let resp: APIResponse
  if (epSelfAction[entity]) {
    resp = await page.request.post(apiUrl(epSelfAction[entity]), { data: body, headers: auth() })
  } else if (id !== undefined && epAction[entity]) {
    resp = await page.request.post(apiUrl(epAction[entity]), {
      data: { ...body, id },
      headers: auth(),
    })
  } else {
    resp = await page.request.post(apiUrl(epCreate[entity]), { data: body, headers: auth() })
  }
  // 后端约定：所有响应 HTTP 均为 200，失败靠 body.code 区分（PARAM_ERROR = '000002'）
  await expect(resp.status()).toBe(200)
  const b = (await resp.json()) as { code?: string; message?: string }
  await expect(b.code).toBe(PARAM_ERROR)
  if (expectMsg) {
    await expect(b.message ?? '').toContain(expectMsg)
  }
}

/**
 * 登录失败契约断言：直接调用 /public/login，断言 HTTP 200 + body.code 等于期望错误码
 * （可选再断言 body.message 包含期望文案）。
 *
 * 用途：替代「fill + click + 断言瞬时提示(.el-message)」的组合。
 * - 瞬时提示由 Element Plus 默认 3s 自动消失，拿它当断言结果天然存在竞态；
 * - 本函数每次调用恰好等价「一次登录失败尝试」（后端仅在该路径递增失败计数），
 *   故不改变登录锁定用例的「第 N 次失败」语义，也不依赖任何 UI 时序。
 *
 * 用法（steps.csv）：操作=apiLoginFail，定位值=username=<账号或 ${var}>;password=<密码>，
 * 预期=错误码（010002 密码错误 / 010005 账号已被锁定），预期类型=文案子串（- 表示不校验）。
 *
 * @param page Playwright 页面
 * @param credentials 账号密码参数串（key=value;key=value）
 * @param expectedCode 期望的错误码
 * @param expectMsg 期望的文案子串；'-' 或空表示不校验
 */
async function apiLoginFail(
  page: Page,
  credentials: string,
  expectedCode: string,
  expectMsg: string,
): Promise<void> {
  const params = new Map<string, string>()
  for (const pair of credentials.split(';')) {
    const i = pair.indexOf('=')
    if (i > 0) params.set(pair.slice(0, i), pair.slice(i + 1))
  }
  const username = params.get('username')
  const resp = await page.request.post(apiUrl(endpoints.auth.login), {
    data: { username, password: params.get('password') },
  })
  await expect(resp.status()).toBe(200)
  const b = (await resp.json()) as { code?: string; message?: string }
  const detail =
    `登录失败断言不符：username=${username} 期望 code=${expectedCode} ` +
    `实际 code=${b.code} message=${b.message ?? ''}`
  await expect(b.code, detail).toBe(expectedCode)
  if (expectMsg && expectMsg !== '-') {
    await expect(b.message ?? '').toContain(expectMsg)
  }
}

/**
 * 后端「自身保护」契约断言：对当前登录管理员调用删除/禁用类接口，断言三件事：
 * 1. 接口静默成功（code=SUCCESS）：自身被过滤掉，不返回任何错误提示；
 * 2. 自身数据未被改动（deleted 仍为 0、status 仍为 1，且账号仍能登录）；
 * 3. 批量场景下，非自身的其他目标照常生效（证明只是「剔除自己」而非整体跳过）。
 *
 * 定位方式：动作（delete / disable / batchDelete / batchDisable）
 * 定位值：批量场景下「其他目标」的用户名（如 ${userName}；- 表示目标只有自己）
 */
async function apiSelf(page: Page, action: string, otherUsername: string): Promise<void> {
  const me = await unwrap<AdminUserRow>(
    await page.request.post(apiUrl(endpoints.adminUser.current), { headers: auth() }),
  )

  const hasOther = !!otherUsername && otherUsername !== '-'
  const other = hasOther ? await findAdminUser(page, otherUsername) : undefined
  if (hasOther && !other) {
    throw new Error(`apiSelf 未找到其他目标用户: ${otherUsername}`)
  }
  const ids = [me.id, ...(other ? [other.id] : [])]

  let resp: APIResponse
  switch (action) {
    case 'delete':
      resp = await page.request.post(apiUrl(endpoints.adminUser.delete), {
        data: { id: me.id },
        headers: auth(),
      })
      break
    case 'disable':
      resp = await page.request.post(apiUrl(endpoints.adminUser.disable), {
        data: { id: me.id },
        headers: auth(),
      })
      break
    case 'batchDelete':
      resp = await page.request.post(apiUrl(endpoints.adminUser.batchDelete), {
        data: { ids },
        headers: auth(),
      })
      break
    case 'batchDisable':
      resp = await page.request.post(apiUrl(endpoints.adminUser.batchDisable), {
        data: { ids },
        headers: auth(),
      })
      break
    default:
      throw new Error(`未知 apiSelf 动作: ${action}`)
  }

  const body = (await resp.json()) as { code?: string; message?: string }
  if (body.code !== SUCCESS) {
    throw new Error(
      `apiSelf(${action}) 期望静默成功，实际 code=${body.code} message=${body.message ?? ''}`,
    )
  }

  // 自身既不能被逻辑删除，也不能被禁用
  const meAfter = await findAdminUser(page, me.username)
  if (!meAfter || meAfter.deleted !== 0 || meAfter.status !== 1) {
    throw new Error(`apiSelf(${action}) 自身数据被改动: ${JSON.stringify(meAfter)}`)
  }

  // 自身账号仍能登录（被禁用/删除都会导致登录失败）；仅超管账号可校验密码
  if (me.username === testCredentials.admin.username) {
    const login = await page.request.post(apiUrl(endpoints.auth.login), {
      data: { username: me.username, password: testCredentials.admin.password },
    })
    const loginBody = (await login.json()) as { code?: string }
    if (loginBody.code !== SUCCESS) {
      throw new Error(`apiSelf(${action}) 自身账号已无法登录: code=${loginBody.code}`)
    }
  }

  // 批量场景：其他目标必须照常生效
  if (other) {
    const otherAfter = await findAdminUser(page, other.username)
    if (action === 'batchDelete' && (!otherAfter || otherAfter.deleted !== 1)) {
      throw new Error(`apiSelf(${action}) 其他目标未被删除: ${JSON.stringify(otherAfter)}`)
    }
    if (action === 'batchDisable' && (!otherAfter || otherAfter.status !== 0)) {
      throw new Error(`apiSelf(${action}) 其他目标未被禁用: ${JSON.stringify(otherAfter)}`)
    }
  }
}

/**
 * 后端「当前登录账号」接口契约断言（GET /adminUser/current）：
 * - 定位方式=auth：以全局超管 Token 调用，断言返回超管本人、ID 非空、密码字段已置空（不泄漏凭据）；
 * - 定位方式=anonymous：不带 Token 调用，断言被安全层拒绝（HTTP 200 + code=UNAUTHORIZED）；
 * - 定位方式=var：以「定位值」指定的变量中的 Token 调用（如 userToken），断言返回「输入值」指定的用户名
 *   ——证明该接口按 Token 归属返回，而不是硬编码当前超管。
 *
 * 定位值：var 模式下的 Token 变量名；输入值：var 模式下的期望用户名
 */
async function apiCurrentAdmin(
  page: Page,
  mode: string,
  tokenVar: string,
  expectUsername: string,
  vars: Vars,
): Promise<void> {
  const options =
    mode === 'anonymous'
      ? {}
      : { headers: mode === 'var' ? { Authorization: `Bearer ${vars[tokenVar] ?? ''}` } : auth() }
  const resp = await page.request.post(apiUrl(endpoints.adminUser.current), options)
  const body = (await resp.json()) as {
    code?: string
    message?: string
    data?: { id?: number; username?: string; password?: string }
  }

  // 未登录：安全层统一返回 HTTP 200 + UNAUTHORIZED，浏览器不被中断
  if (mode === 'anonymous') {
    if (body.code !== UNAUTHORIZED) {
      throw new Error(`apiCurrentAdmin 未携带 Token 未被拒绝: code=${body.code}`)
    }
    return
  }

  if (body.code !== SUCCESS) {
    throw new Error(`apiCurrentAdmin 调用失败: code=${body.code} message=${body.message ?? ''}`)
  }
  const me = body.data ?? {}
  if (me.password) {
    throw new Error('apiCurrentAdmin 返回体泄漏了密码字段')
  }
  const wantUsername = mode === 'var' ? expectUsername : testCredentials.admin.username
  if (me.username !== wantUsername) {
    throw new Error(`apiCurrentAdmin 返回账号不符: 期望 ${wantUsername} 实际 ${me.username}`)
  }
  if (!me.id) {
    throw new Error('apiCurrentAdmin 未返回账号ID')
  }
}
