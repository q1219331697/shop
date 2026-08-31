/**
 * E2E 测试数据编码规则（务必严格遵守，禁止自定义前缀）：
 *
 * 完整格式：e2e_<模块>_<workerId>_<s|b>_<案例简码>[_<序号>]_<时间戳>
 *   单条示例：e2e_r_00_s_dis_mtf74u4a
 *   批量示例：e2e_r_00_b_dis_0_mtf74u4a   （_0 为批次内序号）
 *
 * 各段含义：
 * - 模块：u=用户管理，r=角色管理
 * - workerId：定长补零（位数见 WORKER_ID_DIGITS，当前 2 位 → 00-99），
 *     由 withWorker() 自动插入，详见该函数注释
 * - s|b：单条用 _s_，批量用 _b_，明确区分单条/批量
 * - 案例简码：
 *     单条(s)：detail / search / dis / en / add / del / edit / tag_n / tag_d（状态标签：正常 / 禁用）
 *     批量(b)：list / selectall / page / dis / en / assign
 * - 序号：仅批量有，批次内第 i 条
 * - 时间戳：Date.now().toString(36)，保证跨批次/跨用例不重合
 *
 * - description 用中文用例名：E2E-禁用角色 / E2E-批量禁用 等
 * - sort_order 统一用 99（与 API 造数保持一致，便于核对库内临时数据）
 *
 * ⚠️ 角色名长度：数据库上限 50，但前端表单校验为 ≤30。
 *    API 造数不受前端校验约束，故批量 selectall（约 31 字符）可正常创建；
 *    但若要改用 UI 表单新增角色，必须控制在 30 字符以内。
 *
 * 禁止：e2e_user_ / e2e_role_ / e2e_ub 等非规范前缀
 *       （清理接口按前缀匹配，非规范前缀会导致造数后清理不干净）
 *
 * 用例结构统一为三段式：准备数据 → 执行案例 → 清理数据
 * （清理已下沉到 e2eFixtures 的 isolatedPrefix fixture，用例只需调用
 *  isolatedPrefix('e2e_r_xxx') 注册隔离前缀，用例通过后自动清理，无需手动造/清）
 *
 * ⚠️ 断言原则：以「业务结果」为唯一判据，不对成功 Toast 做断言。
 *    Toast 仅存活数秒，高负载/高并发下极易超时；且其轮询可能匹配到历史残留
 *    Toast 而误判成功。数据状态真实变化（状态列、删除标记、列表可查、
 *    对话框回显等）才是操作成功的可靠证据。
 *    若 Toast 断言排在业务断言之前，它一旦超时就会阻断后者，
 *    导致真正可靠的判据永远执行不到——这是必须避免的顺序陷阱。
 */
import { Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { RolesPage } from '../pages/RolesPage'
import { testRoles } from '../fixtures/roles'
import { createE2ETest, expect, API_TIMEOUT, workerIdPadded, getAdminHeaders } from '../common/e2eFixtures'

// roles 模块用 testRoles.admin；createE2ETest 在编译期强制传入 admin，避免漏配
const test = createE2ETest(testRoles.admin)

/**
 * 通过 API 创建一个临时测试角色（准备数据用）。
 *
 * 命名规则（唯一入口，保证清理前缀与角色名同源）：
 * - 传入的 casePrefix 即角色名的基础前缀，也是后续清理所用的前缀
 * - 角色名 = casePrefix_<时间戳>，因此必定以 casePrefix 开头，清理按 casePrefix 匹配即可命中
 *
 * @param casePrefix 用例前缀（须含 workerId，用 withWorker() 生成，如 e2e_r_00_s_dis）
 * @param realName 描述（必填，每个用例必须传独有的中文用例名如 E2E-禁用角色，确保数据可区分）
 * @param status 1-正常，0-禁用
 */
async function createTestRole(
  page: Page,
  casePrefix: string,
  realName: string,
  status = 1,
): Promise<string> {
  const headers = await getAdminHeaders(page, testRoles.admin)
  // 用完整时间戳保证唯一：casePrefix(含workerId/序号) + 完整毫秒时间戳，跨批次/跨用例不可能重合
  const roleName = `${casePrefix}_${Date.now().toString(36)}`
  await page.request.post('/api/role', {
    headers,
    data: { roleName, description: realName, sortOrder: 99, status },
    timeout: API_TIMEOUT,
  })
  // 轮询 API 确认角色已创建成功且可查询，避免创建后立即 UI 搜索时数据尚未提交导致搜不到
  await expect
    .poll(async () => {
      const listResp = await page.request.get('/api/role', {
        headers,
        params: { roleName, pageNum: 1, pageSize: 10 },
        timeout: API_TIMEOUT,
      })
      const listData = await listResp.json()
      return (listData.data?.records ?? []).some(
        (r: { roleName: string }) => r.roleName === roleName,
      )
    }, { timeout: 15000, intervals: [200, 400, 800] })
    .toBe(true)
  return roleName
}

/**
 * 通过 API 批量创建共享前缀的临时测试角色（准备数据用）。
 *
 * 命名规则（与单条用例一致，前缀由案例明确传递）：prefix = withWorker(e2e_r_b_<案例简码>)，
 * 各角色名的序号拼在 prefix 之后（prefix_<序号>_<时间戳>），
 * 因此所有批量角色必定以 prefix 开头，一次清理即可命中全部。
 *
 * @param prefix 清理前缀（必填，含 workerId，用 withWorker() 生成，如 e2e_r_00_b_dis）
 * @param count 批量条数
 * @param realName 描述（必填，显式传用例名如 E2E-批量禁用，确保数据可区分）
 */
async function createBatchRoles(
  page: Page,
  prefix: string,
  count: number,
  realName: string,
  status = 1,
): Promise<void> {
  // 复用 createTestRole（内含 API 确认，确保数据已提交可查），序号拼入前缀实现归组
  for (let i = 0; i < count; i++) {
    await createTestRole(page, `${prefix}_${i}`, realName, status)
  }
}

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
    // 等待路由加载完成（动态路由生成）
    await page.waitForLoadState('networkidle')
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
  test.beforeAll(async ({ request }) => {
    const loginResp = await request.post('/api/public/login', {
      data: { username: testRoles.admin.username, password: testRoles.admin.password },
      timeout: API_TIMEOUT,
    })
    const loginData = await loginResp.json()
    const token = loginData.data as string
    await request.delete('/api/internal/test/cleanup-e2e', {
      headers: { Authorization: `Bearer ${token}` },
      params: { prefix: `e2e_r_${workerIdPadded()}_` },
      timeout: API_TIMEOUT,
    })
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
    const prefix = isolatedPrefix('e2e_r_b_list')
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
    const prefix = isolatedPrefix('e2e_r_s_search')
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
    const prefix = isolatedPrefix('e2e_r_b_selectall')
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
    const prefix = isolatedPrefix('e2e_r_b_page')

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
    const prefix = isolatedPrefix('e2e_r_s_detail')
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
      const normalPrefix = isolatedPrefix('e2e_r_s_tag_n')
      // ===== 准备数据 =====
      const normalRole = await createTestRole(page, normalPrefix, 'E2E-状态正常', 1)

      // ===== 执行案例 =====
      // 精确搜索正常角色，验证状态标签为"正常"
      await rolesPage.findRowByRoleNameViaSearch(normalRole)
      const normalTag = rolesPage.getStatusNormalTag(normalRole)
      await expect(normalTag).toBeVisible()
    })

    test('状态标签-禁用角色正确显示', async ({ page, isolatedPrefix }) => {
      const disabledPrefix = isolatedPrefix('e2e_r_s_tag_d')
      // ===== 准备数据 =====
      const disabledRole = await createTestRole(page, disabledPrefix, 'E2E-状态禁用', 0)

      // ===== 执行案例 =====
      // 精确搜索禁用角色，验证状态标签为"禁用"
      await rolesPage.findRowByRoleNameViaSearch(disabledRole)
      const disabledTag = rolesPage.getStatusDisabledTag(disabledRole)
      await expect(disabledTag).toBeVisible()
    })

    test('禁用角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix('e2e_r_s_dis')
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
      const prefix = isolatedPrefix('e2e_r_s_en')
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

    test('添加角色功能正常工作', async ({ page, isolatedPrefix }) => {
      const prefix = isolatedPrefix('e2e_r_s_add')
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
      const prefix = isolatedPrefix('e2e_r_s_del')
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
      const prefix = isolatedPrefix('e2e_r_s_edit')

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
      const prefix = isolatedPrefix('e2e_r_b_dis')
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
      const prefix = isolatedPrefix('e2e_r_b_en')
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
      const prefix = isolatedPrefix('e2e_r_b_assign')
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
