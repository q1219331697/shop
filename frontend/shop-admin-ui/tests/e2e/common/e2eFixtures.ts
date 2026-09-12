import { expect } from '@playwright/test'

/**
 * E2E 测试「数据生命周期」共享模块。
 *
 * 承载各 spec 完全一致的原子能力：常量、用例级数据隔离前缀、expect 统一出口。
 *
 * ⚠️ 本文件是纯 .ts 工具模块（非 .spec.ts），不会产生跨文件全局 hook；
 *    各 spec 的 beforeAll（仅负责 admin 登录；按用例ID清残留由用例体负责）仍保留在各自文件内。
 */

// ======================== 常量 ========================

/** 造数/清理类 API 请求超时（毫秒）。这类是后台数据准备而非 UI 交互，
 *  不受 UI 的 5s actionTimeout 约束；并发升高后端变慢时 5s 会频繁超时误判用例失败，故放宽到 30s。 */
export const API_TIMEOUT = 30000

/** 造数后「轮询确认数据可查」的预算（毫秒）。须大于单次 API 常见耗时留容错；
 *  取 15s（非 30s）以兼顾批量造 11 条时不超过用例超时（普通 30s / slow 90s）。 */
export const CONFIRM_POLL_TIMEOUT = 15000

// ======================== 用例级数据隔离 ========================

/**
 * 用例隔离前缀（唯一入口，禁止在用例里手写前缀字符串）：
 *   e2e-<用例ID>-<时间戳36>
 * 例：e2e-TC-ADM-16-x1y2z3
 *
 * 清理一律「按用例ID」：同一用例的数据无论落在哪个模块（u/r/p 由造数自行决定），
 * 只要前缀含用例ID，用 e2e-<用例ID>- 即可一次清掉，故前缀不再编入模块码与 workerId。
 *
 * 注：分隔符统一用中杠「-」而非下划线「_」——「_」是 SQL LIKE 的单字符通配符，会让前缀
 *     匹配变宽松；中杠是字面量，前缀匹配更精确。后端清理白名单已同步改为精确匹配的 "e2e-"（含中杠）。
 *
 * 用例ID 直接编入名字（统一取 CSV 的 TC-xxx 风格，如 TC-PERM-09），便于回溯清理来源；
 * 末尾 Date.now().toString(36) 保证同用例跨运行/跨批次不重名。
 */
export const newPrefix = (caseId: string): string =>
  `e2e-${caseId}-${Date.now().toString(36)}`

// ======================== 前缀拼装辅助 ========================

/**
 * 用例级清理前缀：e2e-<用例ID>-
 * 用于「每个案例执行前」清掉上一轮该用例（跨模块）的残留（末尾时间戳由 LIKE 后缀匹配吃掉）。
 */
export const caseCleanupPrefix = (caseId: string): string =>
  `e2e-${caseId}-`

// 统一出口：spec / 工具模块只需从本模块导入 expect，无需再引 @playwright/test
export { expect }
