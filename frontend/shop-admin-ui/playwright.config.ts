import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置文件
 *
 * ⚠️ AI 禁止自动修改本文件：不得删除现有配置项、不得添加测试项目或更改运行参数。
 * 【端口】4173 = E2E 测试服务端口，来源：vite.config.ts 的 `preview` 块（即 Vite preview 的默认端口）。
 */

export default defineConfig({
  // 【超时备忘】官方默认 vs 本项目取值
  //   选项                官方默认         本项目    作用范围
  //   actionTimeout       0（无超时）      30000     fill / click / check / type 等「动作」
  //   navigationTimeout   0（无超时）      30000     goto / waitForURL 等「导航」
  //   expect.timeout      5000            30000     expect(...) 断言
  //   timeout（单测）       30000           90000     由 specs 内 test.setTimeout 覆盖
  //   webServer.timeout   60000           120000    构建 + 启动测试服务
  //   workers             逻辑核数的一半    4         并发数（CI 用 --workers=2 传入）
  //   retries             0               0         失败重试次数（CI 用 --retries=1 传入）
  // 测试代码不写死超时，一律继承此处（仅 loginAs 等内部轮询自带期限）。
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
    // baseURL：E2E 测试服务（构建产物，preview 默认端口 4173）；不要改为 Docker 地址
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'off',
    video: 'off',
    // 动作 / 导航超时统一 30s：接口正常毫秒级返回，再放大只会把「真失败」拖成「等很久才失败」
    actionTimeout: 30000,
    navigationTimeout: 30000,
    // SLOW=1 时放慢动作（本地调试用）
    launchOptions: {
      slowMo: process.env.SLOW ? 1500 : 0,
    },
  },

  // 断言超时：官方默认 5000 在并发下易误报，与上面两项统一为 30s
  expect: {
    timeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer：兜底服务（4173 上无服务时才启动；timeout 120s 覆盖「构建 + 启动」）
  // - `npm run preview` = `vite build && vite preview --mode preview`：构建 + 起服务一步到位，
  //   故无论谁先起服务，E2E 测的都是构建产物而非 dev 源码
  // - 端口来自 vite.config.ts 的 `preview` 块，后端目标来自 `.env.preview`（此处无需传参/env）
  // - reuseExistingServer: true：4173 上已有服务就直接复用、不要重启；确认服务有问题（如返回旧产物）才重启
  webServer: {
    command: 'npm run preview',
    // 默认不转发 stdout，不写这行则 CI 日志里看不到 build / preview 的输出
    stdout: 'pipe',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
})

// 本文件（含注释）均为人工维护：AI 不得自动修改、删除或重写任何内容。
