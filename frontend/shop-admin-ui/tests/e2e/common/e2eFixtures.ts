import { test as base, expect } from '@playwright/test'
import type {
  Page,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test'

/**
 * E2E 测试「数据生命周期」共享模块（等价于 Java 测试基类的横切逻辑）。
 *
 * 承载各 spec 完全一致的原子能力：常量、worker 级数据隔离前缀、admin 登录头、清理接口；
 * 以及编排层：isolatedPrefix fixture（用例级「自动清理」，等价于 AOP @Around / JUnit @After，
 * 且能拿到用例级隔离前缀，JUnit @After 做不到）。
 *
 * ⚠️ 本文件是纯 .ts 工具模块（非 .spec.ts），不会产生跨文件全局 hook；
 *    各 spec 的 beforeAll（按本 worker 清残留）仍保留在各自文件内。
 */

// ======================== 常量 ========================

/** 造数/清理类 API 请求超时（毫秒）。这类是后台数据准备而非 UI 交互，
 *  不受 UI 的 5s actionTimeout 约束；并发升高后端变慢时 5s 会频繁超时误判用例失败，故放宽到 30s。 */
export const API_TIMEOUT = 30000

/** 造数后「轮询确认数据可查」的预算（毫秒）。须大于单次 API 常见耗时留容错；
 *  取 15s（非 30s）以兼顾批量造 11 条时不超过用例超时（普通 30s / slow 90s）。 */
export const CONFIRM_POLL_TIMEOUT = 15000

// ======================== worker 级数据隔离 ========================

/** 当前 worker 标识（用于数据隔离，避免并行互相干扰） */
const workerId = () => process.env.TEST_WORKER_INDEX ?? 0

/**
 * workerId 补零位数，决定支持的并发上限（1 位≤9、2 位≤99、3 位≤999 worker）。
 * 取 2 位：实际可用并发远小于 99，已留约 12 倍冗余；改此一处即可提升上限。
 */
const WORKER_ID_DIGITS = 2

/** 定长补零后的 workerId（供前缀拼装与 beforeAll 清理共用，保证二者一致） */
export const workerIdPadded = () =>
  String(workerId()).padStart(WORKER_ID_DIGITS, '0')

/**
 * 将用例前缀扩展为含 workerId 的隔离前缀：
 *   e2e_<模块>_<s|b>_<用例码>  →  e2e_<模块>_<workerId>_<s|b>_<用例码>
 * 例：e2e_u_s_dis  →  e2e_u_00_s_dis
 *
 * ⚠️ 两条硬性规则，缺一不可：
 * 1) workerId 必须定长补零。后端搜索为全模糊、清理为前缀匹配，且 SQL LIKE 中「_」是通配符
 *    （mapper 未实际转义）。不补零时 worker 1 清理 'e2e_u_1_%' 会误删 worker 10/11 的数据。
 * 2) workerId 位于模块码之后而非末尾。这样同一 worker 数据有连续前缀 e2e_<模块>_<workerId>_，
 *    beforeAll 才能只清本 worker 残留；若在末尾则只能全量清理，并行下会误删他人数据。
 */
const withWorker = (prefix: string) => {
  const parts = prefix.split('_')
  const mod = parts.slice(0, 2).join('_') // e2e_u / e2e_r
  const rest = parts.slice(2).join('_') // s_dis
  return `${mod}_${workerIdPadded()}_${rest}`
}

// ======================== admin 登录头与清理接口 ========================

/** admin 凭据形状（由各 spec 的 fixtures 提供，解耦来源） */
export interface AdminCredentials {
  username: string
  password: string
}

/** 获取 admin 登录请求头（用于通过 API 准备/清理测试数据）。admin 由各 spec 显式传入。 */
export async function getAdminHeaders(
  page: Page,
  admin: AdminCredentials,
): Promise<{ Authorization: string }> {
  const loginResp = await page.request.post('/api/public/login', {
    data: { username: admin.username, password: admin.password },
    timeout: API_TIMEOUT,
  })
  const loginData = await loginResp.json()
  const token = loginData.data as string
  return { Authorization: `Bearer ${token}` }
}

/** 通过清理接口物理删除指定前缀的 E2E 测试数据（幂等，可安全重复调用）。
 *  接收「已登录的 headers」而非 admin，便于调用方一次登录后清多个前缀。 */
export async function cleanupByPrefix(
  page: Page,
  headers: { Authorization: string },
  prefix: string,
): Promise<void> {
  await page.request.delete('/api/internal/test/cleanup-e2e', {
    headers,
    params: { prefix },
    timeout: API_TIMEOUT,
  })
}

// ======================== 用例级自动清理 fixture ========================

/** 用例级隔离前缀注册器：调用即生成含 workerId 的前缀，并登记为「用例结束后待清理」 */
export type IsolatedPrefixFn = (casePrefix: string) => string

/** 本模块向用例注入的 fixture 集合 */
export interface E2EFixtures {
  isolatedPrefix: IsolatedPrefixFn
}

/** createE2ETest 返回的 test 类型（在 Playwright 原生 test 之上叠加 E2EFixtures） */
export type E2ETestType = TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & E2EFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>

/**
 * 工厂：为指定 admin 凭据生成扩展后的 test（含 isolatedPrefix fixture）。
 * 各 spec 顶部：const test = createE2ETest(testUsers.admin)  // users
 *              const test = createE2ETest(testRoles.admin)  // roles
 *
 * 用工厂而非 test.use({ adminCredentials })：admin 在 import 处强制传入，类型系统保证不可能漏配；
 * 返回值完整保留 describe/嵌套 describe、beforeAll、beforeEach、slow()、info() 等原生能力。
 */
export function createE2ETest(admin: AdminCredentials): E2ETestType {
  return base.extend<E2EFixtures>({
    isolatedPrefix: async ({ page }, use, testInfo) => {
      // 本用例已登记的待清理前缀（闭包局部，天然按用例隔离，fullyParallel 下无共享状态）
      const registered: string[] = []

      // setup 结束，把注册器交给用例体使用
      await use((casePrefix: string) => {
        const prefix = withWorker(casePrefix)
        registered.push(prefix)
        return prefix
      })
      // teardown（等价于 @After）

      // 仅「通过」才清理，失败保留现场便于排查（下一轮 beforeAll 按 workerId 兜底清残留）
      if (testInfo.status !== 'passed' || registered.length === 0) {
        return
      }

      // 登录一次、复用同一 headers 清理全部已注册前缀，避免多前缀触发多次登录
      let headers: { Authorization: string }
      try {
        headers = await getAdminHeaders(page, admin)
      } catch (error) {
        console.warn(
          `[e2e-cleanup] 获取 admin token 失败，跳过清理：${registered.join(', ')}`,
          error,
        )
        return
      }

      for (const prefix of registered) {
        try {
          await cleanupByPrefix(page, headers, prefix)
        } catch (error) {
          // 清理是「善后」而非「断言」：异常绝不能抛出，否则会把已 passed 的用例翻成 failed，
          // 把后端清理接口抖动误报成业务缺陷。残留由下一轮 beforeAll 兜底清除。
          console.warn(`[e2e-cleanup] 清理前缀失败（已忽略）：${prefix}`, error)
        }
      }
    },
  })
}

// 统一出口：spec 只需从本模块导入 test 工厂与 expect，无需再引 @playwright/test
export { expect }
