/**
 * E2E 测试数据编码规则（务必严格遵守，禁止自定义前缀）：
 *
 * 完整格式：e2e_<模块>_<workerId>_<s|b>_<案例简码>[_<序号>]_<时间戳>
 *   单条示例：e2e_u_00_s_dis_mtf74u4a
 *   批量示例：e2e_u_00_b_dis_0_mtf74u4a   （_0 为批次内序号）
 *
 * 各段含义：
 * - 模块：u=用户管理，r=角色管理
 * - workerId：定长补零（位数见 WORKER_ID_DIGITS，当前 2 位 → 00-99），
 *     由 withWorker() 自动插入，详见该函数注释
 * - s|b：单条用 _s_，批量用 _b_，明确区分单条/批量
 * - 案例简码：
 *     单条(s)：detail / search / dis / en / res / del / add / edit
 *              tag_n / tag_d（状态标签：正常 / 禁用）
 *              dtg_d / dtg_n（删除标签：已删除 / 未删除）
 *     批量(b)：list / selectall / page / dis / en / res / del / assign
 * - 序号：仅批量有，批次内第 i 条
 * - 时间戳：Date.now().toString(36)，保证跨批次/跨用例不重合
 *
 * - 用户名上限 50 字符（数据库字段长度，前端校验已对齐为 ≤50）
 *   实测最长为批量 selectall（约 31 字符），安全不超长
 * - real_name 用中文用例名：E2E-禁用用户 / E2E-批量删除 等
 *
 * 禁止：e2e_user_ / e2e_role_ / e2e_ub 等非规范前缀
 *       （清理接口按前缀匹配，非规范前缀会导致造数后清理不干净）
 *
 * 用例结构统一为三段式：准备数据 → 执行案例 → 清理数据
 *
 * ⚠️ 断言原则：以「业务结果」为唯一判据，不对成功 Toast 做断言。
 *    Toast 仅存活数秒，高负载/高并发下极易超时；且其轮询可能匹配到历史残留
 *    Toast 而误判成功。数据状态真实变化（状态列、删除标记、列表可查、
 *    对话框回显等）才是操作成功的可靠证据。
 *    若 Toast 断言排在业务断言之前，它一旦超时就会阻断后者，
 *    导致真正可靠的判据永远执行不到——这是必须避免的顺序陷阱。
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { UsersPage } from '../pages/UsersPage'
import { testUsers } from '../fixtures/users'

/** 当前 worker 标识（用于数据隔离，避免并行互相干扰） */
const workerId = () => process.env.TEST_WORKER_INDEX ?? 0

/**
 * workerId 补零位数。
 *
 * 该数字决定「支持的并发上限」，而非当前实际并发数：
 *   1 位 → 最多 9  个 worker（00-09 以外会冲突，即 worker 10+ 会与 worker 1 冲突）
 *   2 位 → 最多 99 个 worker
 *   3 位 → 最多 999 个 worker
 *
 * 取 2 位的理由：本机为 4 核 8 线程，实测 8 并发稳定、16 并发因资源不足崩溃，
 * 即实际可用并发远小于 99。2 位已留约 12 倍冗余，足够安全；
 * 3 位虽能支持 999，但会让用户名多 1 个字符，且实测前两位恒为 0（余量过剩）。
 *
 * ⚠️ 若要提升并发上限，改这一个数字即可（4 处引用均通过 workerIdPadded() 取用）。
 */
const WORKER_ID_DIGITS = 2

/** 定长补零后的 workerId（供前缀拼装与 beforeAll 清理共用，保证二者一致） */
const workerIdPadded = () => String(workerId()).padStart(WORKER_ID_DIGITS, '0')

/**
 * 将用例前缀扩展为含 workerId 的隔离前缀。
 *
 * 格式：e2e_<模块>_<s|b>_<用例码>  →  e2e_<模块>_<workerId>_<s|b>_<用例码>
 * 例：  e2e_u_s_dis             →  e2e_u_00_s_dis
 *
 * ⚠️ 两条硬性规则，缺一不可（否则并发数增大就不稳定）：
 *
 * 规则 1：workerId 定长补零（位数见 WORKER_ID_DIGITS）
 *   后端搜索为全模糊（LIKE '%kw%'），清理为前缀匹配（LIKE 'kw%'），
 *   且⚠️ SQL LIKE 中「_ 是通配符」而非字面下划线（mapper 的 ESCAPE 未实际转义它）。
 *   因此末尾的下划线起不到分隔作用，补零是必需的：
 *     不补零：worker 1 清理 'e2e_u_1_%'  会误删 worker 10/11 的数据
 *             （实测 'e2e_u_10_s_dis' LIKE 'e2e_u_1_%' = 1，误伤）
 *     补零后：worker 01 清理 'e2e_u_01_%' 只命中自己
 *             （实测 'e2e_u_10_s_dis' LIKE 'e2e_u_01_%' = 0，安全）
 *   副作用：搜索误匹配他人数据、批量操作误改他人数据、清理误删他人数据、
 *           waitForFilterByPrefix 因混入他行而永不满足。
 *
 * 规则 2：workerId 位于模块码之后，而非末尾
 *   这样同一 worker 的全部数据拥有连续前缀 e2e_<模块>_<workerId>_，
 *   beforeAll 才能按该前缀「只清理本 worker 的残留」。
 *   若 workerId 在末尾，beforeAll 只能全量清理 e2e_<模块>_，
 *   并行下每个 worker 的 beforeAll 都会删掉其他 worker 正在使用的数据
 *   ——并发越大、worker 启动间隔越长，破坏越严重（后续启动的 worker 会
 *     把先启动 worker 已造好的数据清空，引发连锁失败）。
 */
const withWorker = (prefix: string) => {
  const parts = prefix.split('_')
  const mod = parts.slice(0, 2).join('_') // e2e_u
  const rest = parts.slice(2).join('_') // s_dis
  return `${mod}_${workerIdPadded()}_${rest}`
}

/**
 * 造数/清理类 API 请求的超时（毫秒）。
 *
 * 这类请求默认受 config 的 actionTimeout(5000) 约束，但它们是「后台数据准备」而非
 * 「UI 交互」，不应套用 UI 的 5s 超时：并发数升高时后端响应变慢，5s 会频繁超时，
 * 导致造数失败并被误判为用例失败。故统一放宽到 30s。
 */
const API_TIMEOUT = 30000

/**
 * 造数后「轮询确认数据已可查」的预算（毫秒）。
 *
 * 必须大于单次 API 的常见耗时，给慢请求留容错。原先是 5000，与 API_TIMEOUT(30000)
 * 存在矛盾：单次请求允许耗时 30s，轮询总预算却只有 5s，后端一慢就会在请求返回前
 * 提前放弃，使 API_TIMEOUT 形同虚设。
 *
 * 这里取 15000 而非对齐 API_TIMEOUT(30000)，是权衡后的折中：
 * 批量用例最多一次造 11 条，若每轮都耗尽 30s 预算会远超用例超时（普通用例 30s、
 * 翻页用例 test.slow() 也才 90s）。15s 足以容忍 1~2 次慢请求，同时保证正常情况下
 * 批量造数不会拖垮用例。
 */
const CONFIRM_POLL_TIMEOUT = 15000

/**
 * 获取 admin 登录请求头（用于通过 API 准备/清理测试数据）。
 */
async function getAdminHeaders(page: Page) {
  const loginResp = await page.request.post('/api/public/login', {
    data: { username: testUsers.admin.username, password: testUsers.admin.password },
    timeout: API_TIMEOUT,
  })
  const loginData = await loginResp.json()
  const token = loginData.data as string
  return { Authorization: `Bearer ${token}` }
}

/**
 * 通过 API 创建一个临时测试用户（准备数据用）。
 *
 * 命名规则（唯一入口，保证清理前缀与用户名同源）：
 * - 传入的 casePrefix 即用户名的基础前缀，也是后续清理所用的前缀
 * - 用户名 = casePrefix_<时间戳>，因此必定以 casePrefix 开头，清理按 casePrefix 匹配即可命中
 *
 * @param casePrefix 用例前缀（须含 workerId，用 withWorker() 生成，如 e2e_u_00_s_dis）
 * @param realName 真实姓名（必填，每个用例必须传独有的中文用例名如 E2E-禁用用户，确保数据可区分）
 * @param status 1-正常，0-禁用
 * @param deleted 是否先逻辑删除
 */
async function createTestUser(
  page: Page,
  casePrefix: string,
  realName: string,
  status = 1,
  deleted = false,
): Promise<string> {
  const headers = await getAdminHeaders(page)
  // 用完整时间戳保证唯一：casePrefix(含workerId/序号) + 完整毫秒时间戳，跨批次/跨用例不可能重合
  // 用户名上限 50（数据库字段长度，前端校验已对齐 ≤50）；
  // 最长为批量 selectall（e2e_u_00_b_selectall_0_<时间戳>，约 31 字符），安全不超长
  const username = `${casePrefix}_${Date.now().toString(36)}`
  await page.request.post('/api/adminUser', {
    headers,
    data: { username, password: 'testpass123', realName, status },
    timeout: API_TIMEOUT,
  })

  // 需要已删除状态时，创建后立即调用删除接口
  if (deleted) {
    const listResp = await page.request.get('/api/adminUser', {
      headers,
      params: { username, pageNum: 1, pageSize: 10 },
      timeout: API_TIMEOUT,
    })
    const listData = await listResp.json()
    const record = (listData.data?.records ?? []).find(
      (r: { username: string }) => r.username === username,
    )
    if (record?.id) {
      await page.request.delete(`/api/adminUser/${record.id}`, {
        headers,
        timeout: API_TIMEOUT,
      })
    }
  }

  // 轮询 API 确认用户已创建且可查询，避免创建后立即 UI 搜索时数据未提交导致搜不到
  await expect
    .poll(async () => {
      const listResp = await page.request.get('/api/adminUser', {
        headers,
        params: { username, pageNum: 1, pageSize: 10 },
        timeout: API_TIMEOUT,
      })
      const listData = await listResp.json()
      return (listData.data?.records ?? []).some(
        (r: { username: string }) => r.username === username,
      )
    }, { timeout: CONFIRM_POLL_TIMEOUT, intervals: [200, 400, 800] })
    .toBe(true)
  return username
}

/**
 * 通过 API 批量创建共享前缀的临时测试用户（准备数据用）。
 *
 * 命名规则（与单条用例一致，前缀由案例明确传递）：prefix = withWorker(e2e_u_b_<案例简码>)，
 * 各用户名的序号拼在 prefix 之后（prefix_<序号>_<时间戳>），
 * 因此所有批量用户必定以 prefix 开头，一次清理即可命中全部。
 *
 * @param prefix 清理前缀（必填，含 workerId，用 withWorker() 生成，如 e2e_u_00_b_dis）
 * @param count 批量条数
 * @param realName 真实姓名（必填，显式传用例名如 E2E-批量禁用，确保数据可区分）
 */
async function createBatchUsers(
  page: Page,
  prefix: string,
  count: number,
  realName: string,
  status = 1,
  deleted = false,
): Promise<void> {
  // 复用 createTestUser（内含 API 确认，确保数据已提交可查），序号拼入前缀实现归组
  for (let i = 0; i < count; i++) {
    await createTestUser(page, `${prefix}_${i}`, realName, status, deleted)
  }
}

/**
 * 通过清理接口物理删除指定前缀的 E2E 测试数据（清理数据用）。
 * prefix 需含 workerId（用 withWorker() 生成），只清理本 worker 产生的数据，
 * 避免并行下误删其他 worker 同用例前缀的数据。幂等，可安全重复调用。
 */
async function cleanupByPrefix(page: Page, prefix: string) {
  const headers = await getAdminHeaders(page)
  await page.request.delete('/api/internal/test/cleanup-e2e', {
    headers,
    params: { prefix },
    timeout: API_TIMEOUT,
  })
}

test.describe('用户管理', () => {
  let loginPage: LoginPage
  let usersPage: UsersPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    usersPage = new UsersPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testUsers.admin.username, testUsers.admin.password)
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
    await page.waitForLoadState('networkidle')
    // 通过侧边栏菜单导航到用户管理页面（SPA 内跳转，避免整页刷新导致 token 失效）
    await usersPage.navigateViaMenu()
    await expect(usersPage.table).toBeVisible({ timeout: 10000 })
  })

  // 套件运行前清理「本 worker」的历史残留，作为每轮执行的初始化
  // （失败用例产生的数据保留在库里便于排查，故 afterAll 兜底清理已禁用；
  //   成功用例各自在执行后清理自身数据，失败用例则保留现场）
  //
  // ⚠️ 清理范围必须是 e2e_u_<workerId>_（本 worker 专属），不能是全量 e2e_u_：
  // 并行下每个 worker 都会执行一次 beforeAll，若清理全量，
  // 后启动的 worker 会删掉先启动 worker 正在使用的数据，并发越大破坏越严重。
  test.beforeAll(async ({ request }) => {
    const loginResp = await request.post('/api/public/login', {
      data: { username: testUsers.admin.username, password: testUsers.admin.password },
      timeout: API_TIMEOUT,
    })
    const loginData = await loginResp.json()
    await request.delete('/api/internal/test/cleanup-e2e', {
      headers: { Authorization: `Bearer ${loginData.data as string}` },
      params: { prefix: `e2e_u_${workerIdPadded()}_` },
      timeout: API_TIMEOUT,
    })
  })

  // 套件运行后兜底清理本模块残留（各用例已自行清理，此处仅兜底）
  // test.afterAll(async ({ request }) => {
  //   const loginResp = await request.post('/api/public/login', {
  //     data: { username: testUsers.admin.username, password: testUsers.admin.password },
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
    await expect(usersPage.pageContainer).toBeVisible()
    await expect(usersPage.searchArea).toBeVisible()
    await expect(usersPage.actionsArea).toBeVisible()
    await expect(usersPage.dataArea).toBeVisible()
    await expect(usersPage.table).toBeVisible()
  })

  test('搜索字段存在', async () => {
    await expect(usersPage.getUsernameInput()).toBeVisible()
    await expect(usersPage.getRealNameInput()).toBeVisible()
    await expect(usersPage.getStatusSelect()).toBeVisible()
    await expect(usersPage.getDeletedSelect()).toBeVisible()
    await expect(usersPage.getSearchButton()).toBeVisible()
    await expect(usersPage.getResetButton()).toBeVisible()
  })

  test('按钮区按钮存在', async () => {
    await expect(usersPage.getAddButton()).toBeVisible()
    await expect(usersPage.getEditButton()).toBeVisible()
    await expect(usersPage.getDeleteButton()).toBeVisible()
    await expect(usersPage.getBatchDisableButton()).toBeVisible()
    await expect(usersPage.getBatchEnableButton()).toBeVisible()
    await expect(usersPage.getBatchRestoreButton()).toBeVisible()
    await expect(usersPage.getBatchAssignRoleButton()).toBeVisible()
  })

  test('表格复选框存在', async () => {
    await expect(usersPage.getTableHeaderCheckbox()).toBeVisible()
  })

  test('分页组件存在', async () => {
    await expect(usersPage.getPagination()).toBeVisible()
    await expect(usersPage.getPrevPageButton()).toBeVisible()
    await expect(usersPage.getNextPageButton()).toBeVisible()
  })

  test('用户列表正确显示', async ({ page }) => {
    // ===== 准备数据 =====
    // 自建 2 条数据并搜索过滤，使列表内容与行数只由本用例决定，
    // 避免并行下遍历到其他 worker 的行导致遍历次数不一致
    const prefix = withWorker('e2e_u_b_list')
    await createBatchUsers(page, prefix, 2, 'E2E-列表显示', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const rowCount = await usersPage.getRowCount()
    expect(rowCount).toBe(2)
    for (let i = 0; i < rowCount; i++) {
      const row = usersPage.getTableRow(i)
      await expect(row).toBeVisible()
      const rowText = await row.textContent()
      expect(rowText).toBeTruthy()
    }

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('全选功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    // 自建 2 条数据并先搜索过滤，使"全选"的作用范围只含本用例数据，
    // 避免并行下选中其他 worker 的数据导致选中范围不一致
    const prefix = withWorker('e2e_u_b_selectall')
    await createBatchUsers(page, prefix, 2, 'E2E-全选功能', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await usersPage.selectAllRows()
    await expect(usersPage.getTableHeaderCheckbox()).toBeChecked()
    await expect(usersPage.getTableBodyCheckbox(0)).toBeChecked()
    await usersPage.deselectAllRows()
    await expect(usersPage.getTableHeaderCheckbox()).not.toBeChecked()

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('翻页功能正常工作', async ({ page }) => {
    // 本用例需批量造 11 条数据（每条约 1 次 POST + 多次 GET 轮询确认），
    // API 调用量远高于其他用例；高并发下后端负载升高会更慢，
    // 故标记为 slow（超时放宽至 3 倍），保证任意并发数下都能稳定通过。
    test.slow()

    // ===== 准备数据 =====
    // 自建 11 条数据（超过每页 10 条），保证无论串行/并行都必然存在第二页。
    // 原实现用 if (nextButton.isEnabled()) 条件分支：串行数据少时不翻页、并行才翻页，
    // 导致两种模式执行路径不同（结论可能不一致）。自造足量数据后翻页每次都被真实执行。
    const prefix = withWorker('e2e_u_b_page')
    await createBatchUsers(page, prefix, 11, 'E2E-翻页功能', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await expect(usersPage.getPagination()).toBeVisible()
    const prevButton = usersPage.getPrevPageButton()
    const nextButton = usersPage.getNextPageButton()

    // 第 1 页：10 条
    await expect.poll(async () => usersPage.getRowCount(), { timeout: 10000 }).toBe(10)

    // 下一页：翻页保留搜索条件，第 2 页仅剩 1 条本用例数据
    await expect(nextButton).toBeEnabled()
    await nextButton.click()
    await expect.poll(async () => usersPage.getRowCount(), { timeout: 10000 }).toBe(1)
    await expect(page).toHaveURL('/system/user')

    // 上一页：回到第 1 页 10 条
    await expect(prevButton).toBeEnabled()
    await prevButton.click()
    await expect.poll(async () => usersPage.getRowCount(), { timeout: 10000 }).toBe(10)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('查看用户详情功能正常', async ({ page }) => {
    // ===== 准备数据 =====
    // 自建数据并先搜索过滤，保证查看详情的目标是本用例的数据，
    // 避免并行下列表第一行是其他 worker 的数据导致结论不一致
    const prefix = withWorker('e2e_u_s_detail')
    const targetUsername = await createTestUser(page, prefix, 'E2E-查看详情', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRow(0)
    await usersPage.clickRowDetail(0)
    const dialog = usersPage.getFormDialog()
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(targetUsername)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('批量操作按钮在未选中时禁用', async () => {
    await usersPage.deselectAllRows()
    await expect(usersPage.getBatchDisableButton()).toBeDisabled()
    await expect(usersPage.getBatchEnableButton()).toBeDisabled()
    await expect(usersPage.getBatchRestoreButton()).toBeDisabled()
    await expect(usersPage.getBatchAssignRoleButton()).toBeDisabled()
  })

  test('批量删除按钮在未选中时禁用', async () => {
    await usersPage.deselectAllRows()
    await expect(usersPage.getDeleteButton()).toBeDisabled()
  })

  // ==================== 数据操作用例（准备数据 → 执行案例 → 清理数据） ====================

  test('搜索功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_search')
    await createTestUser(page, prefix, 'E2E-搜索功能', 1, false)

    // ===== 执行案例 =====
    // 按本用例前缀搜索：结果只由本用例数据决定，
    // 不受其他 worker 数据影响，保证串行/并行执行结论一致
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const hitCount = await usersPage.findRowCountByPrefix(prefix)
    expect(hitCount).toBe(1)

    // 验证搜索具备过滤能力：搜一个不存在的用户名，结果应为 0
    await usersPage.getUsernameInput().fill(`${prefix}_notexist`)
    await usersPage.getSearchButton().click()
    await expect
      .poll(async () => usersPage.getRowCount(), { timeout: 10000 })
      .toBe(0)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('状态标签-正常用户正确显示', async ({ page }) => {
    // ===== 准备数据 =====
    const normalPrefix = withWorker('e2e_u_s_tag_n')
    const normalUser = await createTestUser(page, normalPrefix, 'E2E-状态正常', 1, false)

    // ===== 执行案例 =====
    // 限定在目标行内断言，避免并行下匹配到其他 worker 的行
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await usersPage.findRowByUsernameViaSearch(normalUser)
    await expect(usersPage.getStatusNormalTag(normalUser)).toBeVisible({ timeout: 10000 })

    // ===== 清理数据 =====
    await cleanupByPrefix(page, normalPrefix)
  })

  test('状态标签-禁用用户正确显示', async ({ page }) => {
    // ===== 准备数据 =====
    const disabledPrefix = withWorker('e2e_u_s_tag_d')
    const disabledUser = await createTestUser(page, disabledPrefix, 'E2E-状态禁用', 0, false)

    // ===== 执行案例 =====
    // 限定在目标行内断言，避免并行下匹配到其他 worker 的行
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await usersPage.findRowByUsernameViaSearch(disabledUser)
    await expect(usersPage.getStatusDisabledTag(disabledUser)).toBeVisible({ timeout: 10000 })

    // ===== 清理数据 =====
    await cleanupByPrefix(page, disabledPrefix)
  })

  test('删除状态标签-已删除用户正确显示', async ({ page }) => {
    // ===== 准备数据 =====
    const deletedPrefix = withWorker('e2e_u_s_dtg_d')
    const deletedUser = await createTestUser(page, deletedPrefix, 'E2E-已删除', 1, true)

    // ===== 执行案例 =====
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await usersPage.findRowByUsernameViaSearch(deletedUser)
    await expect(usersPage.getDeletedYesTag(deletedUser)).toBeVisible({ timeout: 10000 })

    // ===== 清理数据 =====
    await cleanupByPrefix(page, deletedPrefix)
  })

  test('删除状态标签-未删除用户正确显示', async ({ page }) => {
    // ===== 准备数据 =====
    const normalPrefix = withWorker('e2e_u_s_dtg_n')
    const normalUser = await createTestUser(page, normalPrefix, 'E2E-未删除', 1, false)

    // ===== 执行案例 =====
    // 并行下列表刷新可能导致标签短暂未渲染，故延长断言超时
    await usersPage.findRowByUsernameViaSearch(normalUser)
    await expect(usersPage.getDeletedNoTag(normalUser)).toBeVisible({ timeout: 10000 })

    // ===== 清理数据 =====
    await cleanupByPrefix(page, normalPrefix)
  })

  test('禁用用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_dis')
    const targetUsername = await createTestUser(page, prefix, 'E2E-禁用用户', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    await usersPage.clickRowDisableByUsername(targetUsername)
    // 重新搜索确保读到最新列表，再轮询状态列（第 4 列）变为"禁用"
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.expectCellTextContainByUsername(targetUsername, 4, '禁用')

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('启用用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_en')
    const targetUsername = await createTestUser(page, prefix, 'E2E-启用用户', 0, false)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    await usersPage.clickRowEnableByUsername(targetUsername)
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.expectCellTextContainByUsername(targetUsername, 4, '正常')

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('恢复用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_res')
    const targetUsername = await createTestUser(page, prefix, 'E2E-恢复用户', 1, true)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    await usersPage.clickRowRestoreByUsername(targetUsername)
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.expectCellTextContainByUsername(targetUsername, 5, '否')

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('删除用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_del')
    const targetUsername = await createTestUser(page, prefix, 'E2E-删除用户', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    await expect(usersPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getDeleteButton().click()
    const messageBox = usersPage.getMessageBox()
    await expect(messageBox).toBeVisible()
    await usersPage.getMessageBoxConfirmButton().click()
    // 逻辑删除后列表仍显示该用户，轮询其删除标记变为"是"
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.expectCellTextContainByUsername(targetUsername, 5, '是')

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('添加用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_add')
    // 用户名基于清理前缀派生，必定以其开头，保证清理可命中
    const newUsername = `${prefix}_${Date.now().toString(36)}`

    // ===== 执行案例 =====
    await usersPage.clickAdd()
    const addDialog = usersPage.getFormDialog()
    await expect(addDialog).toBeVisible()
    await usersPage.fillUserForm(newUsername, 'testpass123', 'E2E-添加用户', 1)
    await usersPage.clickConfirm()
    await expect(addDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：重新搜索能查到刚添加的用户（确认数据真实写入）
    await usersPage.findRowByUsernameViaSearch(newUsername)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('编辑用户功能正常工作', async ({ page }) => {
    // 本用例是全部用例中最重的：需 3 次打开编辑对话框 + 多次列表轮询确认变更，
    // 高并发（本机 12 并发已超载）下后端响应变慢，30s 用例超时实测不够，
    // 故标记 slow（超时放宽至 3 倍）与翻页用例一致。
    test.slow()

    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_s_edit')
    const targetUsername = await createTestUser(page, prefix, 'E2E-编辑用户', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout：
    // 高负载下 300ms 可能不足以完成状态同步，按钮仍为 disabled 会导致点击超时
    await expect(usersPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await usersPage.clickRowEdit(0)
    const editDialog = usersPage.getFormDialog()
    await expect(editDialog).toBeVisible()
    const realNameInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
    const originalValue = await realNameInput.inputValue()
    await realNameInput.fill('测试编辑用户')
    // 校验输入已同步到表单（避免 fill 未完成就提交）
    await expect(realNameInput).toHaveValue('测试编辑用户')
    await usersPage.clickConfirm()
    await expect(editDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：确认姓名已真正变更为『测试编辑用户』
    // 先轮询列表「姓名」列（td 索引 3）确认后端数据已更新，再打开编辑对话框验证。
    // 不能直接打开对话框断言：对话框数据在打开瞬间一次性加载，
    // 若此时后端尚未更新完成就会读到旧值，且不会自动刷新（轮询也无济于事）。
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.expectCellTextContainByUsername(targetUsername, 3, '测试编辑用户')
    await usersPage.selectRowByUsername(targetUsername)
    // 轮询等待编辑按钮启用（需恰好选中一行才可用），替代固定 waitForTimeout
    await expect(usersPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await usersPage.clickRowEdit(0)
    await expect(editDialog).toBeVisible()
    await expect(realNameInput).toHaveValue('测试编辑用户')
    // 此处仅验证不修改，点「取消」关闭对话框。
    // 不能用 clickConfirm 再次提交：表单值相对上次提交并未变化，
    // 重复提交可能不触发更新接口，对话框将不会关闭，导致 toBeHidden 超时。
    await usersPage.clickCancel()
    await expect(editDialog).toBeHidden({ timeout: 10000 })

    // 回滚更改：重新打开编辑对话框，改回原姓名
    await usersPage.findRowByUsernameViaSearch(targetUsername)
    await usersPage.selectRowByUsername(targetUsername)
    await expect(usersPage.getEditButton()).toBeEnabled({ timeout: 10000 })
    await usersPage.clickRowEdit(0)
    await expect(editDialog).toBeVisible()
    const rollbackInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
    await rollbackInput.fill(originalValue)
    await expect(rollbackInput).toHaveValue(originalValue)
    await usersPage.clickConfirm()
    await expect(editDialog).toBeHidden({ timeout: 10000 })

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  // ==================== 批量操作用例（准备数据 → 执行案例 → 清理数据） ====================

  test('批量禁用用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_b_dis')
    await createBatchUsers(page, prefix, 2, 'E2E-批量禁用', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await usersPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(2)
    await expect(usersPage.getBatchDisableButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getBatchDisableButton().click()
    // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"禁用"
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await usersPage.expectCellTextContainByPrefix(prefix, 4, '禁用', 2)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('批量启用用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_b_en')
    await createBatchUsers(page, prefix, 1, 'E2E-批量启用', 0, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await usersPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(usersPage.getBatchEnableButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getBatchEnableButton().click()
    // 业务结果断言：重新搜索后，所有前缀行状态列（第 4 列）均变为"正常"
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await usersPage.expectCellTextContainByPrefix(prefix, 4, '正常', 1)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('批量恢复用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_b_res')
    await createBatchUsers(page, prefix, 1, 'E2E-批量恢复', 1, true)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await usersPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(usersPage.getBatchRestoreButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getBatchRestoreButton().click()
    // 业务结果断言：重新搜索后，所有前缀行删除标记列（第 5 列）均变为"否"
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await usersPage.expectCellTextContainByPrefix(prefix, 5, '否', 1)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('批量删除用户功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_b_del')
    await createBatchUsers(page, prefix, 2, 'E2E-批量删除', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await usersPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(2)
    await expect(usersPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getDeleteButton().click()
    const messageBox = usersPage.getMessageBox()
    await expect(messageBox).toBeVisible()
    await usersPage.getMessageBoxConfirmButton().click()
    // 业务结果断言：重新搜索后，所有前缀行删除标记列（第 5 列）均变为"是"
    await usersPage.findRowsByPrefixViaSearch(prefix)
    await usersPage.expectCellTextContainByPrefix(prefix, 5, '是', 2)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })

  test('分配角色功能正常工作', async ({ page }) => {
    // ===== 准备数据 =====
    const prefix = withWorker('e2e_u_b_assign')
    await createBatchUsers(page, prefix, 1, 'E2E-分配角色', 1, false)

    // ===== 执行案例 =====
    await usersPage.findRowsByPrefixViaSearch(prefix)
    const targetCount = await usersPage.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await expect(usersPage.getBatchAssignRoleButton()).toBeEnabled({ timeout: 5000 })
    await usersPage.getBatchAssignRoleButton().click()
    const roleDialog = usersPage.getFormDialog()
    await expect(roleDialog).toBeVisible()
    await expect(roleDialog).toContainText('分配角色')
    await page.locator('.el-dialog .role-checkbox').first().click()
    await usersPage.clickConfirm()
    await expect(roleDialog).toBeHidden({ timeout: 10000 })

    // 业务结果断言：重新打开分配角色对话框，确认角色已真正勾选到该用户
    await usersPage.expectRoleAssignedForUser(prefix)

    // ===== 清理数据 =====
    await cleanupByPrefix(page, prefix)
  })
})
