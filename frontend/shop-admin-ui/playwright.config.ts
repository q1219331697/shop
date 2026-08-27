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
 * 本文件用于 E2E 测试自动化，严禁 AI 自动化编辑或修改
 */

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  // forbidOnly: !!process.env.CI,
  forbidOnly: false,
  // retries: process.env.CI ? 2 : 0,
  retries: 0,
  // workers: process.env.CI ? 1 : undefined,
  // workers: 1,
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
    actionTimeout: 5000,
    navigationTimeout: 30000,
    // 根据是否为无头模式动态设置 slowMo
    launchOptions: {
      slowMo: process.env.SLOW ? 1500 : 0,
    },
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
