import type { Page } from '@playwright/test'

import { endpoints } from '../../../src/api/endpoints'
import type { PermissionItem } from '../../../src/api/permission'
import { apiUrl, auth, cleanupUrl, loginAsAdmin, unwrap } from '../common/apiClient'
import { createE2ETest, workerIdPadded, expect } from '../common/e2eFixtures'
import { testPermissions } from '../fixtures/permissions'
import { LoginPage } from '../pages/LoginPage'
import { PermissionsPage } from '../pages/PermissionsPage'

const test = createE2ETest(testPermissions.admin)

// 容忍 dev server 偶发编译导致的首屏/接口慢（环境波动，非用例逻辑问题）
test.setTimeout(120000)

/**
 * 通过 API 创建一条权限（admin 令牌由 apiReady fixture 登录后保存在 apiClient）。
 * 后端创建接口直接返回新权限 ID，无需再经权限树反查。
 */
async function createPermissionViaApi(
  page: Page,
  body: Partial<PermissionItem>,
): Promise<{ id: number }> {
  const resp = await page.request.post(apiUrl(endpoints.permission.create), {
    data: body,
    headers: auth(),
  })
  return { id: await unwrap<number>(resp) }
}

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  // 注入请求上下文，登录 admin，清理本 worker 残留权限数据
  await loginAsAdmin(ctx.request, testPermissions.admin)
  await ctx.request.delete(cleanupUrl(`e2e_p_${workerIdPadded()}_`), { headers: auth() })
  // 预热：登录后访问权限页，触发 Vite 对页面 chunk 的编译并缓存，避免用例内首屏偶发卡顿
  const loginPage = new LoginPage(page)
  await page.goto('/')
  try {
    await loginPage.login(testPermissions.admin.username, testPermissions.admin.password)
    await page.goto('/system/permission')

  } catch {
    // 预热失败不影响用例（用例自身会重新加载）
  }
  await ctx.close()
})

test.describe('权限管理页面', () => {
  let loginPage: LoginPage
  let permissionsPage: PermissionsPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    permissionsPage = new PermissionsPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testPermissions.admin.username, testPermissions.admin.password)
    // 等待跳转到 dashboard（动态路由加载后侧边栏菜单才生成）
    // 必须精确判断路径为 /dashboard，否则 /login?redirect=/dashboard 会误匹配；
    // 超时取 25000：glob 误匹配会让 login() 提前返回，真正的等待压力落在这条精确断言上；
    // 25s 而非 30s 是给 beforeEach 自身超时留 5s 余量，让断言先报错、信息更清晰。
    await expect(page).toHaveURL((url) => new URL(url).pathname === '/dashboard', {
      timeout: 25000,
    })

    // 通过侧边栏菜单导航到权限管理页面（SPA 内跳转，避免整页刷新导致 token 失效被踢回登录页）
    await permissionsPage.navigateViaMenu()
    await expect(permissionsPage.treeTable).toBeVisible({ timeout: 10000 })
  })

  test('页面加载展示权限树与标题', async ({ page }) => {

    await expect(permissionsPage.pageTitle).toHaveText('权限管理')
    await expect(permissionsPage.treeTable).toBeVisible()
    // 种子数据「系统管理」顶级目录应存在
    await permissionsPage.expectNodeVisible('系统管理')
  })

  test('按名称搜索过滤权限树', async ({ page }) => {

    await permissionsPage.searchByKeyword('系统管理')
    await permissionsPage.expectNodeVisible('系统管理')

    await permissionsPage.resetSearch()
    await permissionsPage.expectNodeVisible('权限管理')
  })

  test('类型列正确显示目录/菜单/操作', async ({ page }) => {

    // 「系统管理」是目录（type=1），类型列显示「目录」
    const systemRow = permissionsPage.rowByName('系统管理')
    await expect(systemRow).toContainText('目录')

    // 「管理员管理」是菜单（type=2），类型列显示「菜单」
    const adminRow = permissionsPage.rowByName('管理员管理')
    await expect(adminRow).toContainText('菜单')

    // 「权限列表」是操作（type=3），类型列显示「操作」
    const listRow = permissionsPage.rowByName('权限列表')
    await expect(listRow).toContainText('操作')
  })

  test('查看权限详情', async ({ page }) => {

    await permissionsPage.openDetail('系统管理')
    await expect(permissionsPage.detailDialog).toContainText('系统管理')
    await permissionsPage.closeDetail()
  })

  test('新建权限并出现在权限树', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix('e2e_p_create')
    const parentName = `${prefix}_parent`
    const newName = `${prefix}_new`

    // 先 API 创建父级目录，用于验证新建后整棵树正确渲染
    await createPermissionViaApi(page, {
      permissionName: parentName,
      permissionCode: `${prefix}_parent:code`,
      permissionType: 1,
      parentId: 0,
      path: '/test/parent',
      component: 'views/test/parent/index.vue',
      icon: 'Folder',
      sortOrder: 999,
      status: 1,
      visible: 1,
    })


    // 搜索父节点确保可见
    await permissionsPage.searchByKeyword(parentName)
    await permissionsPage.expectNodeVisible(parentName)

    // 通过 UI 新建一个顶级权限（parentId 默认 0）
    await permissionsPage.openCreateDialog()
    await permissionsPage.fillCreateForm({
      name: newName,
      code: `${prefix}new:code`.replace(/_/g, ''),
      type: '菜单',
      path: '/test/new',
      component: 'views/test/new/index.vue',
      icon: 'Document',
    })
    await permissionsPage.submitCreate()
    await expect(permissionsPage.dialog).toBeHidden()
    await page.waitForTimeout(300)

    await permissionsPage.resetSearch()
    await permissionsPage.expectNodeVisible(newName)
  })

  test('删除权限节点', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix('e2e_p_delete')
    const name = `${prefix}_del`

    await createPermissionViaApi(page, {
      permissionName: name,
      permissionCode: `${prefix}_del:code`,
      permissionType: 2,
      parentId: 0,
      path: '/test/del',
      component: 'views/test/del/index.vue',
      icon: 'Delete',
      sortOrder: 999,
      status: 1,
      visible: 1,
    })


    await permissionsPage.searchByKeyword(name)
    await permissionsPage.expectNodeVisible(name)

    await permissionsPage.deleteNode(name)
    await page.waitForTimeout(500)

    await permissionsPage.resetSearch()
    await permissionsPage.expectNodeHidden(name)
  })

  test('新建权限时必填校验', async ({ page }) => {

    await permissionsPage.openCreateDialog()
    // 不填写任何内容直接提交，应触发必填校验
    await permissionsPage.submitCreate()
    await expect(permissionsPage.dialog).toContainText('请输入权限名称')
    await expect(permissionsPage.dialog).toContainText('请输入权限编码')
  })
})
