import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置文件
 *
 * ⚠️ 重要说明：AI 禁止自动修改本文件内容
 * - 任何 AI 模型在修改此文件时，必须保持所有配置不变
 * - 保持 baseURL: 'http://localhost:5173'（不要改为 Docker 地址）
 * - 保持 webServer 配置为本地 Vite 服务
 * - 不得删除任何现有配置项
 * - 不得添加新的测试项目或更改运行参数
 *
 * [AI 规则 · dev server] 优先使用已运行的 Vite dev server
 * - 若 5173 上已有 dev server，reuseExistingServer: true 会直接复用：不要额外启一个，也不要重启它；
 * - 页面改动交给 Vite 热更新生效，不要以“清缓存 / 让改动生效”为由重启；
 * - 仅当能确定是 dev server 自身的问题（例如确实返回了旧模块）时，才允许重启该服务。
 *
 * 本文件用于 E2E 测试自动化，严禁 AI 自动化编辑或修改
 */

export default defineConfig({
  // ============================================================
  // 【超时备忘】Playwright 官方默认 vs 本项目取值
  // 依据官方文档：/docs/test-timeouts、/docs/api/class-testconfig、/docs/api/class-testoptions
  //   选项                官方默认         本项目    作用范围
  //   actionTimeout       0（无超时）      60000     fill / click / check / type 等「动作」
  //   navigationTimeout   0（无超时）      60000     goto / waitForURL 等「导航」
  //   expect.timeout      5000            60000     expect(...) 断言
  //   timeout（单测）       30000           90000     由 specs 内 test.setTimeout 覆盖
  //   webServer.timeout   60000           120000    启动 / 复用 dev server
  //   workers             逻辑核数的一半    4         并发数（CI 用 --workers=2 传入）
  //   retries             0               0         失败重试次数
  // 注 1：官方称这些底层超时「通常无需调整」，flaky 多半要从别处找原因——本项目因此把
  //       断言改为「接口契约 / 持久状态」，不依赖 3 秒即消失的瞬时提示（见 steps.csv / runner.ts）。
  // 注 2：测试代码不写死超时，一律继承此处；仅少数内部轮询窗口自带期限（如 loginAs 的重试）。
  // ============================================================
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  // forbidOnly: !!process.env.CI,
  forbidOnly: false,
  // retries: process.env.CI ? 2 : 0,
  retries: 0,
  // workers: process.env.CI ? 1 : undefined,
  workers: 4,
  reporter: [['list']],
  use: {
    // ============================================================
    // 重要：baseURL 指向本地 Vite 服务 (http://localhost:5173)
    // 不使用 Docker 容器，避免 AI 误改为 Docker 地址
    // ============================================================
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'off',
    video: 'off',
    // 两项统一给足 1 分钟：并发跑 E2E 时首屏挂载会明显变慢，紧超时容易误报失败。
    // 作为「宽松兜底」——测试代码不写死超时，直接继承此处的值。
    // 动作超时：fill / click / check / type 等「动作」未显式传 timeout 时生效
    actionTimeout: 60000,
    // 导航超时：page.goto / waitForURL 等「导航」未显式传 timeout 时生效
    navigationTimeout: 60000,
    // 根据是否为无头模式动态设置 slowMo
    launchOptions: {
      slowMo: process.env.SLOW ? 1500 : 0,
    },
  },

  // 断言超时：所有 expect(...) 未显式传 timeout 时生效。
  // Playwright 默认仅 5000ms，并发负载下断言目标（含瞬时提示）出现稍晚即误报，故统一给足 1 分钟。
  // 与 use.actionTimeout / use.navigationTimeout 同属「宽松兜底」，测试代码不再写死超时。
  expect: {
    timeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ============================================================
  // 重要：webServer 启动本地 Vite 开发服务器
  // 本地运行：cd frontend/shop-admin-ui && npm run dev
  // 不需要 Docker 环境配置，避免 AI 修改为 Docker
  //
  // [AI 规则 · dev server] reuseExistingServer: true = 若 5173 上已有 Vite dev server 就直接复用。
  // 优先复用、不要重启；确认是 dev server 自身问题（如返回旧模块）时才允许重启，详见文件头。
  // ============================================================
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
})

// ============================================================
// 文件底部声明：本文件的所有内容（包括注释和配置）均为人工维护
// AI 系统不得自动修改、删除或重写任何内容
// ============================================================
