import { test } from '@playwright/test'

import { auth, cleanupUrl, loginAsAdmin } from '../common/apiClient'
import { caseCleanupPrefix } from '../common/e2eFixtures'
import { testCredentials } from '../fixtures/credentials'
import { loadCases } from '../keyword/csv'
import { dispatch } from '../keyword/runner'

// 造数/清理依赖 admin Token：worker 级登录一次，注入 apiClient 全局 Token
test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext()
  await loginAsAdmin(ctx.request, testCredentials.admin)
  await ctx.close()
})

// 读取 CSV 用例表，按"是否启用=是"动态生成 Playwright 测试用例
// 新增用例只需在 cases.csv / steps.csv 加行，无需改动本文件
const cases = loadCases()

for (const c of cases.filter((c) => c.是否启用 === '是')) {
  test(`${c.用例ID} ${c.标题}`, { tag: ['@' + c.用例ID] }, async ({ page }, testInfo) => {
    // 单用例超时放宽到 90s（数据准备 + UI 步骤在并行负载下整体偏慢）
    test.setTimeout(90000)
    // 每个案例执行前，按用例 ID 清理本案例（跨模块）遗留的造数，避免脏数据干扰本用例
    try {
      await page.request.delete(cleanupUrl(caseCleanupPrefix(c.用例ID)), { headers: auth() })
    } catch {
      // 清理接口抖动不影响用例
    }

    const vars: Record<string, string> = {}
    try {
      for (const step of c.步骤) {
        await dispatch(step, page, vars)
      }
    } finally {
      // 用例通过后清理本用例造数（失败保留现场便于排查）
      // 必须按「用例ID 前缀」清理：一个用例可能多次造数（如 roleCreate + permCreate），
      // 每次都生成带新时间戳的前缀，若只按最后一次的前缀清理，之前造的数据就会漏清。
      // 用例ID 前缀 e2e-<用例ID>- 是它们共同的父前缀，一次即可清干净本用例全部造数。
      if (testInfo.status === 'passed') {
        try {
          await page.request.delete(cleanupUrl(caseCleanupPrefix(c.用例ID)), { headers: auth() })
        } catch (error) {
          console.warn('[e2e-cleanup] 清理失败（已忽略）：', c.用例ID, error)
        }
      }
    }
  })
}
