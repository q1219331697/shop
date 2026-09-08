/**
 * 角色管理 E2E 用例
 *
 * 数据编码规则、造数工厂、清理机制与断言原则统一维护在
 * tests/e2e/common/e2eFixtures.ts 与 tests/e2e/common/dataFactory.ts，本文件不重复维护，避免多处漂移。
 *
 * 本模块案例简码（单条 s / 批量 b）：
 *     单条(s)：detail / search / dis / en / add / del / edit / tag_n / tag_d（状态标签：正常 / 禁用）
 *              assign_leaf（分配权限：单选最底层权限后回显不连带同级）
 *     批量(b)：list / selectall / page / dis / en / assign
 *
 * - description 用中文用例名：E2E-禁用角色 / E2E-批量禁用 等
 * - sort_order 统一用 99（造数工厂已固定，便于核对库内临时数据）
 *
 * ⚠️ 角色名长度：数据库上限 50，但前端表单校验为 ≤30。
 *    API 造数不受前端校验约束，故批量 selectall（约 31 字符）可正常创建；
 *    但若要改用 UI 表单新增角色，必须控制在 30 字符以内。
 */
import { auth, cleanupUrl, loginAsAdmin } from '../common/apiClient'
import {
  createBatchRoles,
  createPermissionViaApi,
  createTestRole,
} from '../common/dataFactory'
import { casePrefix, createE2ETest, expect, moduleCleanupPrefix } from '../common/e2eFixtures'
import { testRoles } from '../fixtures/roles'
import { LoginPage } from '../pages/LoginPage'
import { RolesPage } from '../pages/RolesPage'

// roles 模块用 testRoles.admin；createE2ETest 在编译期强制传入 admin，避免漏配
const test = createE2ETest(testRoles.admin)

test.describe('角色管理', () => {
  // 每个测试用例通过 API 自建独立角色数据（批次号含 workerId+时间戳），
  // 数据天然隔离，无需串行，可并行执行以提升测试速度

  let loginPage: LoginPage
  let rolesPage: RolesPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    rolesPage = new RolesPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testRoles.admin.username, testRoles.admin.password)
    // 等待跳转到 dashboard（登录成功后动态路由已加载，侧边栏菜单已生成）
    // 该精确断言是必要的：LoginPage.login() 内部用的是 waitForURL('**/dashboard')，
    // glob 会误匹配 /login?redirect=/dashboard，需要此处精确校验登录确实成功。
    // 超时取 25000：glob 误匹配会让 login() 提前返回，真正的等待压力全部落在这条
    // 精确断言上；高并发下后端响应变慢，20s 曾实测不够。
    // 之所以是 25s 而非 30s：beforeEach 自身的超时也是 30s，若断言同样设 30s，
    // 两者会同时触发并报成 hook 超时，错误信息反而更模糊；留 5s 余量可让断言先报错。
    await expect(page).toHaveURL((url) => new URL(url).pathname === '/dashboard', {
      timeout: 25000,
    })
    // 通过侧边栏菜单导航到角色管理页面（SPA 内跳转，避免整页刷新导致 token 失效被踢回登录页）
    await rolesPage.navigateViaMenu()
    // 等待表格加载
    await expect(rolesPage.table).toBeVisible({ timeout: 10000 })
    // 数据操作测试通过 API 自建临时角色，不依赖数据库种子，因此无需重置种子
  })

  // 测试套件运行前清理「本 worker」的历史残留，作为每轮执行的初始化
  // （失败用例产生的数据保留在库里便于排查，故 afterAll 兜底清理已禁用；
  //   成功用例各自在执行后清理自身数据，失败用例则保留现场）
  //
  // ⚠️ 清理范围必须是 e2e_r_<workerId>_（本 worker 专属），不能是全量 e2e_r_：
  // 并行下每个 worker 都会执行一次 beforeAll，若清理全量，
  // 后启动的 worker 会删掉先启动 worker 正在使用的数据，并发越大破坏越严重。
  test.beforeAll(async ({ browser }) => {
    // beforeAll 只能用 worker 级 fixture，故自行开上下文取 request；登录后清理本 worker 残留
    const ctx = await browser.newContext()
    await loginAsAdmin(ctx.request, testRoles.admin)
    await ctx.request.delete(cleanupUrl(moduleCleanupPrefix(testRoles.module)), { headers: auth() })
    await ctx.close()
  })

  // 测试套件执行后兜底清理本模块残留（各用例已自行清理，此处仅兜底）
  // 已禁用：失败用例产生的数据需保留在库里便于排查，不在此处兜底清理
  // test.afterAll(async ({ request }) => {
  //   const loginResp = await request.post('/api/public/login', {
  //     data: { username: testRoles.admin.username, password: testRoles.admin.password },
  //   })
  //   const loginData = await loginResp.json()
  //   const token = loginData.data as string
  //   await request.delete('/api/internal/test/cleanup-e2e', {
  //     headers: { Authorization: `Bearer ${token}` },
  //     params: { prefix: 'e2e_r_' },
  //   })
  // })

  test('页面容器和各区域存在', async () => {
    // 验证页面容器存在
    await expect(rolesPage.pageContainer).toBeVisible()

    // 验证搜索区存在
    await expect(rolesPage.searchArea).toBeVisible()

    // 验证按钮区存在
    await expect(rolesPage.actionsArea).toBeVisible()

    // 验证数据区存在
    await expect(rolesPage.dataArea).toBeVisible()

    // 验证表格存在
    await expect(rolesPage.table).toBeVisible()
  })

  test('搜索字段存在', async () => {
    // 验证角色名输入框存在
    await expect(rolesPage.getRoleNameInput()).toBeVisible()

    // 验证状态选择器存在
    await expect(rolesPage.getStatusSelect()).toBeVisible()

    // 验证搜索按钮存在
    await expect(rolesPage.getSearchButton()).toBeVisible()

    // 验证重置按钮存在
    await expect(rolesPage.getResetButton()).toBeVisible()
  })

  test('按钮区按钮存在', async () => {
    // 验证新增按钮存在
    await expect(rolesPage.getAddButton()).toBeVisible()

    // 验证编辑按钮存在
    await expect(rolesPage.getEditButton()).toBeVisible()

    // 验证删除按钮存在
    await expect(rolesPage.getDeleteButton()).toBeVisible()

    // 验证禁用按钮存在
    await expect(rolesPage.getBatchDisableButton()).toBeVisible()

    // 验证启用按钮存在
    await expect(rolesPage.getBatchEnableButton()).toBeVisible()

    // 验证分配权限按钮存在
    await expect(rolesPage.getBatchAssignPermissionButton()).toBeVisible()
  })

  test('表格复选框存在', async () => {
    // 验证表头复选框存在
    await expect(rolesPage.getTableHeaderCheckbox()).toBeVisible()
  })

  test('分页组件存在', async () => {
    // 验证分页组件存在
    await expect(rolesPage.getPagination()).toBeVisible()

    // 验证上一页按钮存在
    await expect(rolesPage.getPrevPageButton()).toBeVisible()

    // 验证下一页按钮存在
    await expect(rolesPage.getNextPageButton()).toBeVisible()
  })

  test('角色列表正确显示', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('r', 'b', 'list'))
    // ===== 准备数据 =====
    // 自建 2 条数据并搜索过滤，使列表内容与行数只由本用例决定，
    // 避免并行下遍历到其他 worker 的行导致遍历次数不一致
    await createBatchRoles(page, prefix, 2, 'E2E-列表显示', 1)

    // ===== 执行案例 =====
    await rolesPage.findRowsByPrefixViaSearch(prefix)
    const rowCount = await rolesPage.getRowCount()
    expect(rowCount).toBe(2)

    // 验证每行包含角色信息
    for (let i = 0; i < rowCount; i++) {
      const row = rolesPage.getTableRow(i)
      await expect(row).toBeVisible()
      const rowText = await row.textContent()
      expect(rowText).toBeTruthy()
    }
  })

  test('搜索功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('r', 's', 'search'))
    // ===== 准备数据 =====
    // 前缀由案例明确传递（与用户管理一致），描述用用例名
    await createTestRole(page, prefix, 'E2E-搜索功能', 1)

    // ===== 执行案例 =====
    // 按本用例前缀搜索：结果只由本用例数据决定，
    // 不受其他 worker 数据影响，保证串行/并行执行结论一致
    await rolesPage.findRowsByPrefixViaSearch(prefix)
    const hitCount = await rolesPage.findRowCountByPrefix(prefix)
    expect(hitCount).toBe(1)

    // 验证搜索具备过滤能力：搜一个不存在的角色名，结果应为 0
    await rolesPage.getRoleNameInput().fill(`${prefix}_notexist`)
    await rolesPage.getSearchButton().click()
    await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBe(0)
  })

  test('全选功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('r', 'b', 'selectall'))
    // ===== 准备数据 =====
    // 自建 2 条数据并先搜索过滤，使"全选"的作用范围只含本用例数据，
    // 避免并行下选中其他 worker 的数据导致选中范围不一致
    await createBatchRoles(page, prefix, 2, 'E2E-全选功能', 1)

    // ===== 执行案例 =====
    await rolesPage.findRowsByPrefixViaSearch(prefix)

    // 全选当前过滤后的行
    await rolesPage.selectAllRows()

    // 验证表格头部复选框被选中
    await expect(rolesPage.getTableHeaderCheckbox()).toBeChecked()

    // 验证至少有一个复选框被选中
    const firstCheckbox = rolesPage.getTableBodyCheckbox(0)
    await expect(firstCheckbox).toBeChecked()

    // 取消全选
    await rolesPage.deselectAllRows()

    // 验证表格头部复选框未被选中
    await expect(rolesPage.getTableHeaderCheckbox()).not.toBeChecked()
  })

  test('翻页功能正常工作', async ({ page, isolatedPrefix }) => {
    // 本用例需批量造 11 条数据（每条约 1 次 POST + 多次 GET 轮询确认），
    // API 调用量远高于其他用例；高并发下后端负载升高会更慢，
    // 故标记为 slow（超时放宽至 3 倍），保证任意并发数下都能稳定通过。
    test.slow()
    const prefix = isolatedPrefix(casePrefix('r', 'b', 'page'))

    // ===== 准备数据 =====
    // 自建 11 条数据（超过每页 10 条），保证无论串行/并行都必然存在第二页。
    // 原实现用 if (nextButton.isEnabled()) 条件分支：串行数据少时不翻页、并行才翻页，
    // 导致两种模式执行路径不同（结论可能不一致）。自造足量数据后翻页每次都被真实执行。
    await createBatchRoles(page, prefix, 11, 'E2E-翻页功能', 1)

    // ===== 执行案例 =====
    await rolesPage.findRowsByPrefixViaSearch(prefix)
    const pagination = rolesPage.getPagination()
    await expect(pagination).toBeVisible()

    const prevButton = rolesPage.getPrevPageButton()
    const nextButton = rolesPage.getNextPageButton()

    // 第 1 页：10 条
    await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBe(10)

    // 下一页：翻页保留搜索条件，第 2 页仅剩 1 条本用例数据
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBe(1)

    // 验证翻页后URL不变（当前路由在分页内）
    await expect(page).toHaveURL('/system/role')

    // 上一页：回到第 1 页 10 条
    await expect(prevButton).toBeEnabled()
    await prevButton.click()
    await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBe(10)
  })

  test('查看角色详情功能正常', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('r', 's', 'detail'))
    // ===== 准备数据 =====
    // 自建数据并先搜索过滤，保证查看详情的目标是本用例的数据，
    // 避免并行下列表第一行是其他 worker 的数据导致结论不一致
    const targetRoleName = await createTestRole(page, prefix, 'E2E-查看详情', 1)

    // ===== 执行案例 =====
    await rolesPage.findRowByRoleNameViaSearch(targetRoleName)

    // 选择第一个角色
    await rolesPage.selectRow(0)

    // 点击详情按钮
    await rolesPage.clickRowDetail(0)

    // 等待详情对话框出现
    const dialog = rolesPage.getFormDialog()
    await expect(dialog).toBeVisible()

    // 验证对话框内容包含本用例的角色名
    await expect(dialog).toContainText(targetRoleName)
  })

  // 数据操作测试：每个用例自建独立角色数据（批次号含 workerId+时间戳），数据隔离，可并行
  test.describe('数据操作测试', () => {
    test('状态标签-正常角色正确显示', async ({ page, isolatedPrefix }) => {
      const normalPrefix = isolatedPrefix(casePrefix('r', 's', 'tag_n'))
      // ===== 准备数据 =====
      const normalRole = await createTestRole(page, normalPrefix, 'E2E-状态正常', 1)

      // ===== 执行案例 =====
      // 精确搜索正常角色，验证状态标签为"正常"
      await rolesPage.findRowByRoleNameViaSearch(normalRole)
      const normalTag = rolesPage.getStatusNormalTag(normalRole)
      await expect(normalTag).toBeVisible()
    })

    test('状态标签-禁用角色正确显示', async ({ page, isolatedPrefix }) => {
      const disabledPrefix = isolatedPrefix(casePrefix('r', 's', 'tag_d'))
      // ===== 准备数据 =====
      const disabledRole = await createTestRole(page, disabledPrefix, 'E2E-状态禁用', 0)

      // ===== 执行案例 =====
      // 精确搜索禁用角色，验证状态标签为"禁用"
      await rolesPage.findRowByRoleNameViaSearch(disabledRole)
      const disabledTag = rolesPage.getStatusDisabledTag(disabledRole)
      await expect(disabledTag).toBeVisible()
    })

    test('禁用角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 's', 'dis'))
      // ===== 准备数据 =====
      const targetRoleName = await createTestRole(page, prefix, 'E2E-禁用角色', 1)

      // ===== 执行案例 =====
      // 搜索过滤到目标角色，使其在列表中可见（按角色名定位，不依赖行索引）
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      // 选择目标角色
      await rolesPage.selectRowByRoleName(targetRoleName)
      await page.waitForTimeout(300)
      // 点击禁用按钮
      await rolesPage.clickRowDisableByRoleName(targetRoleName)
      await page.waitForTimeout(500)
      // 重新搜索定位，确保读到最新列表（避免操作后列表未刷新导致读到旧状态）
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      // 轮询等待状态列（第 4 列）变为"禁用"
      await rolesPage.expectCellTextContainByRoleName(targetRoleName, 4, '禁用')
    })

    test('启用角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 's', 'en'))
      // ===== 准备数据 =====
      const targetRoleName = await createTestRole(page, prefix, 'E2E-启用角色', 0)

      // ===== 执行案例 =====
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.selectRowByRoleName(targetRoleName)
      await page.waitForTimeout(300)
      await rolesPage.clickRowEnableByRoleName(targetRoleName)
      await page.waitForTimeout(500)
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.expectCellTextContainByRoleName(targetRoleName, 4, '正常')
    })

    test('添加角色功能正常工作', async ({ isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 's', 'add'))
      // ===== 准备数据 =====
      const newRoleName = `${prefix}_${Date.now().toString(36)}`

      // ===== 执行案例 =====
      // 点击新增按钮
      await rolesPage.clickAdd()
      const addDialog = rolesPage.getFormDialog()
      await expect(addDialog).toBeVisible()
      // 填写角色表单（角色名基于清理前缀派生，与用户管理一致）
      // sortOrder 用 99，与 API 造数（createTestRole 的 sortOrder:99）保持一致，便于核对库内临时数据
      await rolesPage.fillRoleForm(newRoleName, 'E2E-添加角色', 99)
      await rolesPage.clickConfirm()
      await expect(addDialog).toBeHidden({ timeout: 10000 })

      // 业务结果断言：重新搜索能查到刚添加的角色（确认数据真实写入）
      await rolesPage.findRowByRoleNameViaSearch(newRoleName)
    })

    test('删除角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 's', 'del'))
      // ===== 准备数据 =====
      const tempRoleName = await createTestRole(page, prefix, 'E2E-删除角色', 1)

      // ===== 执行案例 =====
      await rolesPage.findRowByRoleNameViaSearch(tempRoleName)
      await rolesPage.selectRowByRoleName(tempRoleName)
      await page.waitForTimeout(500)
      await expect(rolesPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getDeleteButton().click()
      await page.waitForTimeout(500)
      const messageBox = rolesPage.getMessageBox()
      await expect(messageBox).toBeVisible()
      await rolesPage.getMessageBoxConfirmButton().click()
      await page.waitForTimeout(500)
      // 角色为逻辑删除，删除后从列表中消失（@TableLogic 过滤）
      await expect
        .poll(async () => (await rolesPage.findRowIndexByRoleName(tempRoleName)) < 0, {
          timeout: 10000,
        })
        .toBe(true)
    })

    test('编辑角色功能正常工作', async ({ page, isolatedPrefix }) => {
      // 本用例是全部用例中最重的：需 3 次打开编辑对话框 + 多次列表轮询确认变更，
      // 高并发（本机 12 并发已超载）下后端响应变慢，30s 用例超时实测不够，
      // 故标记 slow（超时放宽至 3 倍）与翻页用例一致。
      test.slow()
      const prefix = isolatedPrefix(casePrefix('r', 's', 'edit'))

      // ===== 准备数据 =====
      const targetRoleName = await createTestRole(page, prefix, 'E2E-编辑角色', 1)

      // ===== 执行案例 =====
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.selectRowByRoleName(targetRoleName)
      // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout：
      // 高负载下 300ms 可能不足以完成状态同步，按钮仍为 disabled 会导致点击超时
      await expect(rolesPage.getEditButton()).toBeEnabled({ timeout: 10000 })
      await rolesPage.clickRowEdit(0)
      const editDialog = rolesPage.getFormDialog()
      await expect(editDialog).toBeVisible()
      const descInput = page.locator('.el-dialog textarea[placeholder="请输入描述"]').first()
      const originalValue = await descInput.inputValue()
      await descInput.fill('测试编辑角色')
      await rolesPage.clickConfirm()
      await expect(editDialog).toBeHidden({ timeout: 10000 })

      // 业务结果断言：确认描述已真正变更为『测试编辑角色』
      // 先轮询列表「描述」列（td 索引 3）确认后端数据已更新，再打开编辑对话框验证。
      // 不能直接打开对话框断言：对话框数据在打开瞬间一次性加载，
      // 若此时后端尚未更新完成就会读到旧值，且不会自动刷新（轮询也无济于事）。
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.expectCellTextContainByRoleName(targetRoleName, 3, '测试编辑角色')
      await rolesPage.selectRowByRoleName(targetRoleName)
      // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout：
      // 高负载下 300ms 可能不足以完成状态同步，按钮仍为 disabled 会导致点击超时
      await expect(rolesPage.getEditButton()).toBeEnabled({ timeout: 10000 })
      await rolesPage.clickRowEdit(0)
      await expect(editDialog).toBeVisible()
      await expect(descInput).toHaveValue('测试编辑角色')
      // 此处仅验证不修改，点「取消」关闭对话框。
      // 不能用 clickConfirm 再次提交：表单值相对上次提交并未变化，
      // 重复提交可能不触发更新接口，对话框将不会关闭，导致 toBeHidden 超时。
      await rolesPage.clickCancel()
      await expect(editDialog).toBeHidden({ timeout: 10000 })

      // 回滚更改：重新打开编辑对话框，改回原描述
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.selectRowByRoleName(targetRoleName)
      // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout：
      // 高负载下 300ms 可能不足以完成状态同步，按钮仍为 disabled 会导致点击超时
      await expect(rolesPage.getEditButton()).toBeEnabled({ timeout: 10000 })
      await rolesPage.clickRowEdit(0)
      await expect(editDialog).toBeVisible()
      const rollbackInput = page.locator('.el-dialog textarea[placeholder="请输入描述"]').first()
      rollbackInput.fill(originalValue)
      await rolesPage.clickConfirm()
      await page.waitForTimeout(500)
    })
  }) // end describe 数据操作测试

  // 批量操作与权限分配测试：每个用例自建独立角色数据（批次号含 workerId+时间戳），可并行
  test.describe('批量操作与权限测试', () => {
    test('批量禁用角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 'b', 'dis'))
      // ===== 准备数据 =====
      await createBatchRoles(page, prefix, 2, 'E2E-批量禁用', 1)

      // ===== 执行案例 =====
      await rolesPage.findRowsByPrefixViaSearch(prefix)
      const targetCount = await rolesPage.selectRowsByRoleNamePrefix(prefix)
      expect(targetCount).toBeGreaterThanOrEqual(2)
      await expect(rolesPage.getBatchDisableButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchDisableButton().click()
      await page.waitForTimeout(500)
      // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"禁用"
      await rolesPage.findRowsByPrefixViaSearch(prefix)
      await rolesPage.expectCellTextContainByPrefix(prefix, 4, '禁用', 2)
    })

    test('批量启用角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 'b', 'en'))
      // ===== 准备数据 =====
      await createBatchRoles(page, prefix, 1, 'E2E-批量启用', 0)

      // ===== 执行案例 =====
      await rolesPage.findRowsByPrefixViaSearch(prefix)
      const targetCount = await rolesPage.selectRowsByRoleNamePrefix(prefix)
      expect(targetCount).toBeGreaterThanOrEqual(1)
      await expect(rolesPage.getBatchEnableButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchEnableButton().click()
      await page.waitForTimeout(500)
      // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"正常"
      await rolesPage.findRowsByPrefixViaSearch(prefix)
      await rolesPage.expectCellTextContainByPrefix(prefix, 4, '正常', 1)
    })

    test('分配权限功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 'b', 'assign'))
      // ===== 准备数据 =====
      await createBatchRoles(page, prefix, 1, 'E2E-分配权限', 1)

      // ===== 执行案例 =====
      await rolesPage.findRowsByPrefixViaSearch(prefix)
      const targetCount = await rolesPage.selectRowsByRoleNamePrefix(prefix)
      expect(targetCount).toBeGreaterThanOrEqual(1)
      // 点击工具栏"分配权限"按钮
      await expect(rolesPage.getBatchAssignPermissionButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchAssignPermissionButton().click()
      const permDialog = rolesPage.getFormDialog()
      await expect(permDialog).toBeVisible()
      await expect(permDialog).toContainText('分配权限')
      // 点击确定（不勾选任何权限，验证提交成功）
      await rolesPage.clickConfirm()
      // 业务结果断言：对话框成功关闭，且目标角色仍在列表（未被误删/接口未报错）
      await expect(permDialog).toBeHidden({ timeout: 10000 })
      await rolesPage.findRowsByPrefixViaSearch(prefix)
    })

    test('单选最底层权限后重新打开只回显该权限', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix(casePrefix('r', 's', 'assign_leaf'))
      // 权限数据同样自建：名称带 e2e_ 前缀，用例通过后随前缀一并清理，不依赖数据库种子
      const permPrefix = isolatedPrefix(casePrefix('p', 's', 'assign_leaf'))

      // ===== 准备数据 =====
      // 自建一棵权限子树：1 个菜单 + 3 个同级的最底层操作节点
      // （可见性 visible=0，仅作可分配权限，不进入侧边栏菜单与动态路由）
      const menuId = await createPermissionViaApi(page, {
        permissionName: `${permPrefix}_menu`,
        permissionCode: `${permPrefix}_menu`,
        permissionType: 2,
        parentId: 0,
        path: '/e2e/assign',
        component: 'views/error/404.vue',
        icon: 'Menu',
        sortOrder: 999,
        status: 1,
        visible: 0,
      })
      const leafNames = [`${permPrefix}_leaf1`, `${permPrefix}_leaf2`, `${permPrefix}_leaf3`]
      for (let i = 0; i < leafNames.length; i++) {
        await createPermissionViaApi(page, {
          permissionName: leafNames[i],
          permissionCode: `${permPrefix}_leaf${i + 1}`,
          permissionType: 3,
          parentId: menuId,
          sortOrder: i + 1,
          status: 1,
          visible: 0,
        })
      }
      const [targetLeaf, ...siblingLeaves] = leafNames
      const targetRoleName = await createTestRole(page, prefix, 'E2E-单选最底层权限', 1)

      // ===== 执行案例 =====
      // 第一次打开：只勾选 targetLeaf 这一个最底层操作节点（它有两个同级节点）
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.selectRowByRoleName(targetRoleName)
      await expect(rolesPage.getBatchAssignPermissionButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchAssignPermissionButton().click()
      const permDialog = rolesPage.getFormDialog()
      await expect(permDialog).toBeVisible()
      // 先断言目标节点可见，避免「节点不存在」被下面的未勾选断言误判为通过
      await expect(rolesPage.getPermissionTreeNode(targetLeaf)).toBeVisible({ timeout: 15000 })
      await rolesPage.togglePermissionNode(targetLeaf)
      await expect
        .poll(async () => rolesPage.isPermissionNodeChecked(targetLeaf), { timeout: 10000 })
        .toBe(true)
      await rolesPage.clickConfirm()
      await expect(permDialog).toBeHidden({ timeout: 10000 })

      // 第二次打开（回显）：目标节点仍为勾选，同级节点不得被连带勾选
      // 缺陷形态：保存时把半选父节点一并入库，回显时 el-tree 将父节点视为全选，
      // 从而级联勾选所有同级节点。
      await rolesPage.findRowByRoleNameViaSearch(targetRoleName)
      await rolesPage.selectRowByRoleName(targetRoleName)
      await expect(rolesPage.getBatchAssignPermissionButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchAssignPermissionButton().click()
      await expect(permDialog).toBeVisible()
      await expect(rolesPage.getPermissionTreeNode(targetLeaf)).toBeVisible({ timeout: 15000 })
      await expect
        .poll(async () => rolesPage.isPermissionNodeChecked(targetLeaf), { timeout: 15000 })
        .toBe(true)
      for (const sibling of siblingLeaves) {
        await expect(rolesPage.getPermissionTreeNode(sibling)).toBeVisible({ timeout: 15000 })
        await expect
          .poll(async () => rolesPage.isPermissionNodeChecked(sibling), { timeout: 15000 })
          .toBe(false)
      }
      await rolesPage.closeDialog()
    })
  })

  test('批量操作按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await rolesPage.deselectAllRows()

    // 验证批量禁用按钮禁用
    const batchDisableBtn = rolesPage.getBatchDisableButton()
    await expect(batchDisableBtn).toBeDisabled()

    // 验证批量启用按钮禁用
    const batchEnableBtn = rolesPage.getBatchEnableButton()
    await expect(batchEnableBtn).toBeDisabled()

    // 验证批量分配权限按钮禁用
    const batchAssignPermBtn = rolesPage.getBatchAssignPermissionButton()
    await expect(batchAssignPermBtn).toBeDisabled()
  })

  test('批量删除按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await rolesPage.deselectAllRows()

    // 验证删除按钮禁用
    const deleteBtn = rolesPage.getDeleteButton()
    await expect(deleteBtn).toBeDisabled()
  })
})
