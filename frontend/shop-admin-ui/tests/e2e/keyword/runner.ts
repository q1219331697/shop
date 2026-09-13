import { Page, expect } from '@playwright/test'
import { toLocator } from './locator'
import { runSetup, type Vars } from './setupRegistry'
import { auth, apiUrl, unwrap } from '../common/apiClient'
import { endpoints } from '../../../src/api/endpoints'
import { PARAM_ERROR } from '../../../src/api/resultCode'
import type { Step } from './csv'

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

  const loc = step.定位方式 !== '-' ? toLocator(page, step.定位方式, 定位值) : null

  switch (step.操作) {
    case 'goto':
      await page.goto(定位值)
      return
    case 'fill':
      // 输入值为 "-" 表示留空
      // 同 click：并行负载下搜索栏等表单元素可能晚于默认 5s actionTimeout 才渲染完成，放宽至 15s
      await loc!.fill(输入值 === '-' ? '' : 输入值, { timeout: 15000 })
      return
    case 'type':
      await loc!.type(输入值 === '-' ? '' : 输入值, { timeout: 15000 })
      return
    case 'click':
      // 部分按钮（如行选中后才启用的操作栏按钮）依赖 Vue 响应式启用，
      // 并行负载下可能晚于默认 5s actionTimeout 才变为可点，故放宽至 15s
      await loc!.click({ timeout: 15000 })
      return
    case 'hover':
      await loc!.hover()
      return
    case 'select':
      await loc!.selectOption(输入值)
      return
    case 'press':
      await page.keyboard.press(输入值)
      return
    case 'wait':
      await page.waitForLoadState()
      return
    case 'expectVisible':
      // 并行负载下对话框挂载/过渡可能晚于默认 5s，放宽至 15s
      await expect(loc!).toBeVisible({ timeout: 15000 })
      return
    case 'expectHidden':
      // 同上，放宽至 15s
      await expect(loc!).toBeHidden({ timeout: 15000 })
      return
    case 'expectText':
      // 用包含匹配，容忍文案前后空白/图标差异
      await expect(loc!).toContainText(预期)
      return
    case 'expectValue':
      // 编辑页字段由接口异步回填：这里也用于「等待回填完成」的同步点，故放宽至 15s
      await expect(loc!).toHaveValue(预期, { timeout: 15000 })
      return
    case 'expectURL':
      // 预期值作为正则匹配（如 /dashboard 可匹配完整 URL 中的路径）
      // 并行负载下登录重定向 + 动态路由生成可能晚于默认 5s，放宽至 15s
      await expect(page).toHaveURL(new RegExp(预期), { timeout: 15000 })
      return
    case 'expectCount':
      // 断言匹配元素的数量（如统计卡片数量、节点隐藏时数量为 0）
      await expect(loc!).toHaveCount(Number(预期))
      return
    case 'expectEnabled': {
      // 预期类型=disabled 断言禁用，否则断言启用；输入值为数字时取第 N 个匹配
      let target = loc!
      if (/^\d+$/.test(输入值)) target = target.nth(Number(输入值))
      if (step.预期类型 === 'disabled') await expect(target).toBeDisabled()
      else await expect(target).toBeEnabled()
      return
    }
    case 'expectChecked': {
      // 预期=true 断言勾选，否则断言未勾选；输入值为数字时取第 N 个匹配
      let target = loc!
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
        const resp = await page.request.get(apiUrl(endpoints.role.permissionIds(roleId)), {
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
 * - 定位方式：实体名（user / role / permission）
 * - 输入值：覆盖字段（key=value;key=value）。若含 `id=`，则走【更新接口】（编辑态校验）；
 *          否则走创建接口。其余字段用各实体的合法基线值补全，故只需关注被改动的“非法字段”。
 * - 预期：错误文案子串（可选）；断言 body.message 包含它，证明是“该字段”被拒
 *
 * 基线值已覆盖必填字段，故单测某字段时只覆盖那一个非法值即可。
 * permissionCode 必须给出（实体 @NotBlank），且为静态值——非法用例在控制器层即被拒、
 * 不会真正落库，故不与其它用例的编码冲突。
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
  }
  const epCreate: Record<string, string> = {
    user: endpoints.adminUser.create,
    role: endpoints.role.create,
    permission: endpoints.permission.create,
  }
  const epUpdate: Record<string, (id: string) => string> = {
    user: endpoints.adminUser.update,
    role: endpoints.role.update,
    permission: endpoints.permission.update,
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
  const resp =
    id !== undefined
      ? await page.request.put(apiUrl(epUpdate[entity](id)), { data: body, headers: auth() })
      : await page.request.post(apiUrl(epCreate[entity]), { data: body, headers: auth() })
  // 后端约定：所有响应 HTTP 均为 200，失败靠 body.code 区分（PARAM_ERROR = '000002'）
  await expect(resp.status()).toBe(200)
  const b = (await resp.json()) as { code?: string; message?: string }
  await expect(b.code).toBe(PARAM_ERROR)
  if (expectMsg) {
    await expect(b.message ?? '').toContain(expectMsg)
  }
}
