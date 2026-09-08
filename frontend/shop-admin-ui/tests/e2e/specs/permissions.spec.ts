import { auth, cleanupUrl, loginAsAdmin } from '../common/apiClient'
import {
  assignPermissionsToRole,
  createPermissionTreeFixture,
  createPermissionViaApi,
  createTestRole,
  findRoleIdByName,
  getRolePermissionIds,
} from '../common/dataFactory'
import { casePrefix, createE2ETest, expect, moduleCleanupPrefix } from '../common/e2eFixtures'
import { testPermissions } from '../fixtures/permissions'
import { LoginPage } from '../pages/LoginPage'
import { PermissionsPage } from '../pages/PermissionsPage'

const test = createE2ETest(testPermissions.admin)

// 容忍 dev server 偶发编译导致的首屏/接口慢（环境波动，非用例逻辑问题）
test.setTimeout(120000)

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  // 注入请求上下文，登录 admin，清理本 worker 残留权限数据
  await loginAsAdmin(ctx.request, testPermissions.admin)
  await ctx.request.delete(cleanupUrl(moduleCleanupPrefix(testPermissions.module)), { headers: auth() })
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

  test('页面加载展示权限树与标题', async () => {
    await expect(permissionsPage.pageTitle).toHaveText('权限管理')
    await expect(permissionsPage.treeTable).toBeVisible()
    // 种子基础权限「系统管理」顶级目录应存在（只读断言，不依赖本用例造数）
    await permissionsPage.expectNodeVisible('系统管理')
  })

  test('按名称搜索过滤权限树', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('p', 's', 'search'))
    // 自建数据：搜索目标为用例自己创建的目录节点，不依赖种子权限
    const { dirName } = await createPermissionTreeFixture(page, prefix)

    await permissionsPage.searchByKeyword(dirName)
    await permissionsPage.expectNodeVisible(dirName)

    // 搜索一个不存在的名称，应过滤为空（验证搜索确有过滤能力）
    await permissionsPage.searchByKeyword(`${dirName}_none`)
    await permissionsPage.expectNodeHidden(dirName)

    await permissionsPage.resetSearch()
    await permissionsPage.expectNodeVisible(dirName)
  })

  test('类型列正确显示目录/菜单/操作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('p', 's', 'type'))
    // 自建一棵三类型子树：目录 → 菜单 → 操作
    const { dirName, menuName, actionName } = await createPermissionTreeFixture(page, prefix)

    // 按共用前缀搜索，一次命中三个节点
    await permissionsPage.searchByKeyword(prefix)

    await expect(permissionsPage.rowByName(dirName)).toContainText('目录')
    await expect(permissionsPage.rowByName(menuName)).toContainText('菜单')
    await expect(permissionsPage.rowByName(actionName)).toContainText('操作')
  })

  test('查看权限详情', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('p', 's', 'detail'))
    const { dirName } = await createPermissionTreeFixture(page, prefix)

    await permissionsPage.searchByKeyword(dirName)
    await permissionsPage.openDetail(dirName)
    await expect(permissionsPage.detailDialog).toContainText(dirName)
    await permissionsPage.closeDetail()
  })

  test('新建权限并出现在权限树', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('p', 's', 'create'))
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
    const prefix = isolatedPrefix(casePrefix('p', 's', 'delete'))
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

  test('新建权限可授权给独立角色', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('p', 's', 'grant'))
    const permName = `${prefix}_perm`

    // 1) 用例自建权限（不依赖种子）
    const permId = await createPermissionViaApi(page, {
      permissionName: permName,
      permissionCode: `${prefix}_perm:code`,
      permissionType: 3,
      parentId: 0,
      sortOrder: 999,
      status: 1,
      visible: 1,
    })

    // 2) 用例自建独立角色（归属权限管理模块前缀，随本用例清理）
    const roleName = await createTestRole(page, `${prefix}_role`, 'E2E-权限授权')
    const roleId = await findRoleIdByName(page, roleName)
    if (!roleId) {
      throw new Error(`[e2e] 独立角色创建后未查到：${roleName}`)
    }

    // 3) 授权给角色（API 按 ID 精确授权，无 UI 竞争）
    await assignPermissionsToRole(page, roleId, [permId])

    // 4) 断言角色权限列表已包含该权限（轮询确认写入生效）
    await expect
      .poll(async () => (await getRolePermissionIds(page, roleId)).includes(permId), {
        timeout: 15000,
        intervals: [200, 400, 800],
      })
      .toBe(true)
  })

  test('新建权限时必填校验', async () => {
    await permissionsPage.openCreateDialog()
    // 不填写任何内容直接提交，应触发必填校验
    await permissionsPage.submitCreate()
    await expect(permissionsPage.dialog).toContainText('请输入权限名称')
    await expect(permissionsPage.dialog).toContainText('请输入权限编码')
  })
})
