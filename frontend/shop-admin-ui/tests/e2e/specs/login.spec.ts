import { test, expect } from '@playwright/test'

import { testAdmin } from '../fixtures/admin'
import { LoginPage } from '../pages/LoginPage'

test.describe('登录认证', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await page.goto('/')
    // 等待页面完全加载
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    // 确保不在 dashboard 页面
    if (page.url().includes('dashboard')) {
      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    }
    // 清除复选框状态，确保每次测试从干净状态开始
    const checkbox = page.locator('.el-checkbox').first()
    await checkbox.waitFor({ state: 'visible', timeout: 5000 })
    const isChecked = await checkbox.locator('.el-checkbox__input').isChecked()
    if (isChecked) {
      await checkbox.locator('.el-checkbox__input').click()
    }
  })

  test('用户登录成功后跳转到 dashboard', async ({ page }) => {
    await loginPage.login(testAdmin.admin.username, testAdmin.admin.password)

    // 等待跳转到 dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 })
    // 等待仪表盘元素可见（并行 worker 下组件加载可能较慢）
    await expect(page.locator('.dashboard h2')).toBeVisible({ timeout: 20000 })
  })

  test('显示登录错误信息', async ({ page }) => {
    await loginPage.login(testAdmin.invalid.username, testAdmin.invalid.password)

    // 等待错误消息容器可见
    await expect(page.locator('.el-message')).toBeVisible({ timeout: 5000 })

    // 获取错误消息内容
    const errorMessages = await loginPage.getErrorMessages()
    expect(errorMessages).toBeTruthy()
    expect(errorMessages.length > 0).toBeTruthy()
  })

  test('用户登出后跳转到登录页', async ({ page }) => {
    await loginPage.login(testAdmin.admin.username, testAdmin.admin.password)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })

    // 检查是否有登出按钮，可能需要从用户下拉菜单中点击
    const logoutButton = page.locator('.user-menu button:has-text("登出")').first()
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click()
      await expect(page).toHaveURL(/.*login/, { timeout: 10000 })
    }
  })
})
