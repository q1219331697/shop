/**
 * 管理员管理 E2E 用例
 *
 * 数据编码规则、造数工厂、清理机制与断言原则统一维护在
 * tests/e2e/common/e2eFixtures.ts 与 tests/e2e/common/dataFactory.ts，本文件不重复维护，避免多处漂移。
 *
 * 本模块案例简码（单条 s / 批量 b）：
 *     单条(s)：detail / search / dis / en / res / del / add / edit
 *              tag_n / tag_d（状态标签：正常 / 禁用）
 *              dtg_d / dtg_n（删除标签：已删除 / 未删除）
 *     批量(b)：list / selectall / page / dis / en / res / del / assign
 *
 * - real_name 用中文用例名：E2E-禁用用户 / E2E-批量删除 等
 * - 用户名上限 50 字符（数据库字段长度，前端校验已对齐为 ≤50）
 */
import { auth, cleanupUrl, loginAsAdmin } from '../common/apiClient'
import { createBatchUsers, createTestUser } from '../common/dataFactory'
import { casePrefix, createE2ETest, expect, moduleCleanupPrefix } from '../common/e2eFixtures'
import { testAdmin } from '../fixtures/admin'
import { AdminPage } from '../pages/AdminPage'
import { LoginPage } from '../pages/LoginPage'

// admin 模块用 testAdmin.admin；createE2ETest 在编译期强制传入 admin，避免漏配
const test = createE2ETest(testAdmin.admin)

test.describe('管理员管理', () => {
  let loginPage: LoginPage
  let adminPage: AdminPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    adminPage = new AdminPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testAdmin.admin.username, testAdmin.admin.password)
    // 等待跳转到 dashboard（动态路由加载后侧边栏菜单才生成）
    // 注意：必须精确判断路径为 /dashboard，否则 /login?redirect=/dashboard 会误匹配。
    // 该精确断言是必要的：LoginPage.login() 内部用的是 waitForURL('**/dashboard')，
    // glob 会误匹配 /login?redirect=/dashboard，需要此处精确校验登录确实成功。
    // 超时取 25000：glob 误匹配会让 login() 提前返回，真正的等待压力全部落在这条
    // 精确断言上；高并发下后端响应变慢，20s 曾实测不够。
    // 之所以是 25s 而非 30s：beforeEach 自身的超时也是 30s，若断言同样设 30s，
    // 两者会同时触发并报成 hook 超时，错误信息反而更模糊；留 5s 余量可让断言先报错。
    await expect(page).toHaveURL((url) => new URL(url).pathname === '/dashboard', {
      timeout: 25000,
    })
    // 通过侧边栏菜单导航到用户管理页面（SPA 内跳转，避免整页刷新导致 token 失效）
    await adminPage.navigateViaMenu()
    await expect(adminPage.table).toBeVisible({ timeout: 10000 })
  })

  // 套件运行前清理「本 worker」的历史残留，作为每轮执行的初始化
  // （失败用例产生的数据保留在库里便于排查，故 afterAll 兜底清理已禁用；
  //   成功用例各自在执行后清理自身数据，失败用例则保留现场）
  //
  // ⚠️ 清理范围必须是 e2e_u_<workerId>_（本 worker 专属），不能是全量 e2e_u_：
  // 并行下每个 worker 都会执行一次 beforeAll，若清理全量，
  // 后启动的 worker 会删掉先启动 worker 正在使用的数据，并发越大破坏越严重。
  test.beforeAll(async ({ browser }) => {
    // beforeAll 只能用 worker 级 fixture，故自行开上下文取 request；登录后清理本 worker 残留
    const ctx = await browser.newContext()
    await loginAsAdmin(ctx.request, testAdmin.admin)
    await ctx.request.delete(cleanupUrl(moduleCleanupPrefix(testAdmin.module)), { headers: auth() })
    await ctx.close()
  })

  // 套件运行后兜底清理本模块残留（各用例已自行清理，此处仅兜底）
  // test.afterAll(async ({ request }) => {
  //   const loginResp = await request.post('/api/public/login', {
  //     data: { username: testAdmin.admin.username, password: testAdmin.admin.password },
  //   })
  //   const loginData = await loginResp.json()
  //   await request.delete('/api/internal/test/cleanup-e2e', {
  //     headers: { Authorization: `Bearer ${loginData.data as string}` },
  //     params: { prefix: 'e2e_u_' },
  //   })
  // })

  // ==================== 基础用例（结构校验 + 需自建数据的列表类功能） ====================
  // - 结构校验类（页面容器 / 搜索字段 / 按钮区 / 复选框 / 分页 / 按钮禁用态）：无需准备数据
  // - 列表类（列表显示 / 全选 / 翻页 / 详情 / 搜索）：均自建独立数据并在结尾清理。
  //   它们原本依赖库内全局数据，导致串行与并行下看到的行数、首行、页数不同
  //   （尤其翻页会走不同代码路径），为保证两种模式结论一致，已统一改为自建数据。

  test('页面容器和各区域存在', async () => {
    await expect(adminPage.pageContainer).toBeVisible()
    await expect(adminPage.searchArea).toBeVisible()
    await expect(adminPage.actionsArea).toBeVisible()
    await expect(adminPage.dataArea).toBeVisible()
    await expect(adminPage.table).toBeVisible()
  })

  test('搜索字段存在', async () => {
    await expect(adminPage.getUsernameInput()).toBeVisible()
    await expect(adminPage.getRealNameInput()).toBeVisible()
    await expect(adminPage.getStatusSelect()).toBeVisible()
    await expect(adminPage.getDeletedSelect()).toBeVisible()
    await expect(adminPage.getSearchButton()).toBeVisible()
    await expect(adminPage.getResetButton()).toBeVisible()
  })

  test('按钮区按钮存在', async () => {
    await expect(adminPage.getAddButton()).toBeVisible()
    await expect(adminPage.getEditButton()).toBeVisible()
    await expect(adminPage.getDeleteButton()).toBeVisible()
    await expect(adminPage.getBatchDisableButton()).toBeVisible()
    await expect(adminPage.getBatchEnableButton()).toBeVisible()
    await expect(adminPage.getBatchRestoreButton()).toBeVisible()
    await expect(adminPage.getBatchAssignRoleButton()).toBeVisible()
  })

  test('表格复选框存在', async () => {
    await expect(adminPage.getTableHeaderCheckbox()).toBeVisible()
  })

  test('分页组件存在', async () => {
    await expect(adminPage.getPagination()).toBeVisible()
    await expect(adminPage.getPrevPageButton()).toBeVisible()
    await expect(adminPage.getNextPageButton()).toBeVisible()
  })

  test('用户列表正确显示', async ({ page, isolatedPrefix }) => {
    // 使用 isolatedPrefix 注册隔离前缀：自动生成含 workerId 的前缀，用例通过后自动清理。
    // casePrefix 仅写基础前缀（不含 workerId），withWorker 注入由 e2eFixtures 负责。
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'list'))
    // ===== 准备数据 =====
    // 自建 2 条数据并搜索过滤，使列表内容与行数只由本用例决定，
    // 避免并行下遍历到其他 worker 的行导致遍历次数不一致
    await createBatchUsers(page, prefix, 2, 'E2E-列表显示', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const rowCount = await adminPage.getRowCount()
    expect(rowCount).toBe(2)
    for (let i = 0; i < rowCount; i++) {
      const row = adminPage.getTableRow(i)
      await expect(row).toBeVisible()
      const rowText = await row.textContent()
      expect(rowText).toBeTruthy()
    }
  })

  test('全选功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'selectall'))
    // ===== 准备数据 =====
    // 自建 2 条数据并先搜索过滤，使"全选"的作用范围只含本用例数据，
    // 避免并行下选中其他 worker 的数据导致选中范围不一致
    await createBatchUsers(page, prefix, 2, 'E2E-全选功能', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await adminPage.selectAllRows()
    await expect(adminPage.getTableHeaderCheckbox()).toBeChecked()
    await expect(adminPage.getTableBodyCheckbox(0)).toBeChecked()
    await adminPage.deselectAllRows()
    await expect(adminPage.getTableHeaderCheckbox()).not.toBeChecked()
  })

  test('翻页功能正常工作', async ({ page, isolatedPrefix }) => {
    // 本用例需批量造 11 条数据（每条约 1 次 POST + 多次 GET 轮询确认），
    // API 调用量远高于其他用例；高并发下后端负载升高会更慢，
    // 故标记为 slow（超时放宽至 3 倍），保证任意并发数下都能稳定通过。
    test.slow()
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'page'))

    // ===== 准备数据 =====
    // 自建 11 条数据（超过每页 10 条），保证无论串行/并行都必然存在第二页。
    // 原实现用 if (nextButton.isEnabled()) 条件分支：串行数据少时不翻页、并行才翻页，
    // 导致两种模式执行路径不同（结论可能不一致）。自造足量数据后翻页每次都被真实执行。
    await createBatchUsers(page, prefix, 11, 'E2E-翻页功能', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await expect(adminPage.getPagination()).toBeVisible()
    const prevButton = adminPage.getPrevPageButton()
    const nextButton = adminPage.getNextPageButton()

    // 第 1 页：10 条
    await expect.poll(async () => adminPage.getRowCount(), { timeout: 10000 }).toBe(10)

    // 下一页：翻页保留搜索条件，第 2 页仅剩 1 条本用例数据
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    await expect.poll(async () => adminPage.getRowCount(), { timeout: 10000 }).toBe(1)
    await expect(page).toHaveURL('/system/admin')

    // 上一页：回到第 1 页 10 条
    await expect(prevButton).toBeEnabled()
    await prevButton.click()
    await expect.poll(async () => adminPage.getRowCount(), { timeout: 10000 }).toBe(10)
  })

  test('查看用户详情功能正常', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'detail'))
    // ===== 准备数据 =====
    // 自建数据并先搜索过滤，保证查看详情的目标是本用例的数据，
    // 避免并行下列表第一行是其他 worker 的数据导致结论不一致
    const targetUsername = await createTestUser(page, prefix, 'E2E-查看详情', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRow(0)
    await adminPage.clickRowDetail(0)
    const dialog = adminPage.getFormDialog()
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(targetUsername)
  })

  test('批量操作按钮在未选中时禁用', async () => {
    await adminPage.deselectAllRows()
    await expect(adminPage.getBatchDisableButton()).toBeDisabled()
    await expect(adminPage.getBatchEnableButton()).toBeDisabled()
    await expect(adminPage.getBatchRestoreButton()).toBeDisabled()
    await expect(adminPage.getBatchAssignRoleButton()).toBeDisabled()
  })

  test('批量删除按钮在未选中时禁用', async () => {
    await adminPage.deselectAllRows()
    await expect(adminPage.getDeleteButton()).toBeDisabled()
  })

  // ==================== 数据操作用例（准备数据 → 执行案例 → 清理数据） ====================

  test('搜索功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'search'))
    // ===== 准备数据 =====
    await createTestUser(page, prefix, 'E2E-搜索功能', 1, false)

    // ===== 执行案例 =====
    // 按本用例前缀搜索：结果只由本用例数据决定，
    // 不受其他 worker 数据影响，保证串行/并行执行结论一致
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const hitCount = await adminPage.findRowCountByPrefix(prefix)
    expect(hitCount).toBe(1)

    // 验证搜索具备过滤能力：搜一个不存在的用户名，结果应为 0
    await adminPage.getUsernameInput().fill(`${prefix}_notexist`)
    await adminPage.getSearchButton().click()
    await expect
      .poll(async () => adminPage.getRowCount(), { timeout: 10000 })
      .toBe(0)
  })

  test('状态标签-正常用户正确显示', async ({ page, isolatedPrefix }) => {
    const normalPrefix = isolatedPrefix(casePrefix('u', 's', 'tag_n'))
    // ===== 准备数据 =====
    const normalUser = await createTestUser(page, normalPrefix, 'E2E-状态正常', 1, false)

    // ===== 执行案例 =====
    // 限定在目标行内断言，避免并行下匹配到其他 worker 的行
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await adminPage.findRowByUsernameViaSearch(normalUser)
    await expect(adminPage.getStatusNormalTag(normalUser)).toBeVisible({ timeout: 10000 })
  })

  test('状态标签-禁用用户正确显示', async ({ page, isolatedPrefix }) => {
    const disabledPrefix = isolatedPrefix(casePrefix('u', 's', 'tag_d'))
    // ===== 准备数据 =====
    const disabledUser = await createTestUser(page, disabledPrefix, 'E2E-状态禁用', 0, false)

    // ===== 执行案例 =====
    // 限定在目标行内断言，避免并行下匹配到其他 worker 的行
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await adminPage.findRowByUsernameViaSearch(disabledUser)
    await expect(adminPage.getStatusDisabledTag(disabledUser)).toBeVisible({ timeout: 10000 })
  })

  test('删除状态标签-已删除用户正确显示', async ({ page, isolatedPrefix }) => {
    const deletedPrefix = isolatedPrefix(casePrefix('u', 's', 'dtg_d'))
    // ===== 准备数据 =====
    const deletedUser = await createTestUser(page, deletedPrefix, 'E2E-已删除', 1, true)

    // ===== 执行案例 =====
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await adminPage.findRowByUsernameViaSearch(deletedUser)
    await expect(adminPage.getDeletedYesTag(deletedUser)).toBeVisible({ timeout: 10000 })
  })

  test('删除状态标签-未删除用户正确显示', async ({ page, isolatedPrefix }) => {
    const normalPrefix = isolatedPrefix(casePrefix('u', 's', 'dtg_n'))
    // ===== 准备数据 =====
    const normalUser = await createTestUser(page, normalPrefix, 'E2E-未删除', 1, false)

    // ===== 执行案例 =====
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await adminPage.findRowByUsernameViaSearch(normalUser)
    await expect(adminPage.getDeletedNoTag(normalUser)).toBeVisible({ timeout: 10000 })
  })

  test('禁用用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'dis'))
    // ===== 准备数据 =====
    const targetUsername = await createTestUser(page, prefix, 'E2E-禁用用户', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    await adminPage.clickRowDisableByUsername(targetUsername)
    // 重新搜索确保读到最新列表，再轮询状态列（第 4 列）变为"禁用"
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.expectCellTextContainByUsername(targetUsername, 4, '禁用')
  })

  test('启用用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'en'))
    // ===== 准备数据 =====
    const targetUsername = await createTestUser(page, prefix, 'E2E-启用用户', 0, false)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    await adminPage.clickRowEnableByUsername(targetUsername)
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.expectCellTextContainByUsername(targetUsername, 4, '正常')
  })

  test('恢复用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'res'))
    // ===== 准备数据 =====
    const targetUsername = await createTestUser(page, prefix, 'E2E-恢复用户', 1, true)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    await adminPage.clickRowRestoreByUsername(targetUsername)
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.expectCellTextContainByUsername(targetUsername, 5, '否')
  })

  test('删除用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'del'))
    // ===== 准备数据 =====
    const targetUsername = await createTestUser(page, prefix, 'E2E-删除用户', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    await expect(adminPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getDeleteButton().click()
    const messageBox = adminPage.getMessageBox()
    await expect(messageBox).toBeVisible()
    await adminPage.getMessageBoxConfirmButton().click()
    // 逻辑删除后列表仍显示该用户，轮询其删除标记变为"是"
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.expectCellTextContainByUsername(targetUsername, 5, '是')
  })

  test('添加用户功能正常工作', async ({ isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 's', 'add'))
    // ===== 准备数据 =====
    // 用户名基于清理前缀派生，必定以其开头，保证清理可命中
    const newUsername = `${prefix}_${Date.now().toString(36)}`

    // ===== 执行案例 =====
    await adminPage.clickAdd()
    const addDialog = adminPage.getFormDialog()
    await expect(addDialog).toBeVisible()
    await adminPage.fillUserForm(newUsername, 'testpass123', 'E2E-添加用户', 1)
    await adminPage.clickConfirm()
    await expect(addDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：重新搜索能查到刚添加的用户（确认数据真实写入）
    await adminPage.findRowByUsernameViaSearch(newUsername)
  })

  test('编辑用户功能正常工作', async ({ page, isolatedPrefix }) => {
    // 本用例是全部用例中最重的：需 3 次打开编辑对话框 + 多次列表轮询确认变更，
    // 高并发（本机 12 并发已超载）下后端响应变慢，30s 用例超时实测不够，
    // 故标记 slow（超时放宽至 3 倍）与翻页用例一致。
    test.slow()
    const prefix = isolatedPrefix(casePrefix('u', 's', 'edit'))

    // ===== 准备数据 =====
    const targetUsername = await createTestUser(page, prefix, 'E2E-编辑用户', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout：
    // 高负载下 300ms 可能不足以完成状态同步，按钮仍为 disabled 会导致点击超时
    await expect(adminPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await adminPage.clickRowEdit(0)
    const editDialog = adminPage.getFormDialog()
    await expect(editDialog).toBeVisible()
    const realNameInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
    const originalValue = await realNameInput.inputValue()
    await realNameInput.fill('测试编辑用户')
    // 校验输入已同步到表单（避免 fill 未完成就提交）
    await expect(realNameInput).toHaveValue('测试编辑用户')
    await adminPage.clickConfirm()
    await expect(editDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：确认姓名已真正变更为『测试编辑用户』
    // 先轮询列表「姓名」列（td 索引 3）确认后端数据已更新，再打开编辑对话框验证。
    // 不能直接打开对话框断言：对话框数据在打开瞬间一次性加载，
    // 若此时后端尚未更新完成就会读到旧值，且不会自动刷新（轮询也无济于事）。
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.expectCellTextContainByUsername(targetUsername, 3, '测试编辑用户')
    await adminPage.selectRowByUsername(targetUsername)
    // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout
    await expect(adminPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await adminPage.clickRowEdit(0)
    await expect(editDialog).toBeVisible()
    await expect(realNameInput).toHaveValue('测试编辑用户')
    // 此处仅验证不修改，点「取消」关闭对话框。
    // 不能用 clickConfirm 再次提交：表单值相对上次提交并未变化，
    // 重复提交可能不触发更新接口，对话框将不会关闭，导致 toBeHidden 超时。
    await adminPage.clickCancel()
    await expect(editDialog).toBeHidden({ timeout: 10000 })

    // 回滚更改：重新打开编辑对话框，改回原姓名
    await adminPage.findRowByUsernameViaSearch(targetUsername)
    await adminPage.selectRowByUsername(targetUsername)
    await expect(adminPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await adminPage.clickRowEdit(0)
    await expect(editDialog).toBeVisible()
    const rollbackInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
    await rollbackInput.fill(originalValue)
    await expect(rollbackInput).toHaveValue(originalValue)
    await adminPage.clickConfirm()
    await expect(editDialog).toBeHidden({ timeout: 10000 })
  })

  // ==================== 批量操作用例（准备数据 → 执行案例 → 清理数据） ====================

  test('批量禁用用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'dis'))
    // ===== 准备数据 =====
    await createBatchUsers(page, prefix, 2, 'E2E-批量禁用', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await adminPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(2)
    await expect(adminPage.getBatchDisableButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getBatchDisableButton().click()
    // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"禁用"
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await adminPage.expectCellTextContainByPrefix(prefix, 4, '禁用', 2)
  })

  test('批量启用用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'en'))
    // ===== 准备数据 =====
    await createBatchUsers(page, prefix, 1, 'E2E-批量启用', 0, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await adminPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(adminPage.getBatchEnableButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getBatchEnableButton().click()
    // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"正常"
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await adminPage.expectCellTextContainByPrefix(prefix, 4, '正常', 1)
  })

  test('批量恢复用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'res'))
    // ===== 准备数据 =====
    await createBatchUsers(page, prefix, 1, 'E2E-批量恢复', 1, true)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await adminPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(adminPage.getBatchRestoreButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getBatchRestoreButton().click()
    // 业务结果断言：重新搜索后，所有前缀行删除标记列（第 5 列）均变为"否"
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await adminPage.expectCellTextContainByPrefix(prefix, 5, '否', 1)
  })

  test('批量删除用户功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'del'))
    // ===== 准备数据 =====
    await createBatchUsers(page, prefix, 2, 'E2E-批量删除', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await adminPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(2)
    await expect(adminPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getDeleteButton().click()
    const messageBox = adminPage.getMessageBox()
    await expect(messageBox).toBeVisible()
    await adminPage.getMessageBoxConfirmButton().click()
    // 业务结果断言：重新搜索后，所有前缀行删除标记列（第 5 列）均变为"是"
    await adminPage.findRowsByPrefixViaSearch(prefix)
    await adminPage.expectCellTextContainByPrefix(prefix, 5, '是', 2)
  })

  test('分配角色功能正常工作', async ({ page, isolatedPrefix }) => {
    const prefix = isolatedPrefix(casePrefix('u', 'b', 'assign'))
    // ===== 准备数据 =====
    await createBatchUsers(page, prefix, 1, 'E2E-分配角色', 1, false)

    // ===== 执行案例 =====
    await adminPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await adminPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(adminPage.getBatchAssignRoleButton()).toBeEnabled({ timeout: 5000 })
    await adminPage.getBatchAssignRoleButton().click()
    const roleDialog = adminPage.getFormDialog()
    await expect(roleDialog).toBeVisible()
    await expect(roleDialog).toContainText('分配角色')
    await page.locator('.el-dialog .role-checkbox').first().click()
    await adminPage.clickConfirm()
    await expect(roleDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：重新打开分配角色对话框，确认角色已真正勾选到该用户
    await adminPage.expectRoleAssignedForUser(prefix)
  })
})
