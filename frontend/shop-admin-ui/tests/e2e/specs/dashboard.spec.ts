import { test, expect } from '@playwright/test'

import { testAdmin } from '../fixtures/admin'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'

test.describe('仪表盘', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    // 不在 beforeEach 中登录，每个测试用例自己处理登录
  })

  test('仪表盘页面标题正确', async ({ page }) => {
    await page.goto('/')
    await loginPage.login(testAdmin.admin.username, testAdmin.admin.password)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 })
    // 并行 worker 下 dashboard 组件可能加载较慢，等待标题元素真正渲染后再断言
    await expect(page.locator('.dashboard h2')).toBeVisible({ timeout: 20000 })
    const title = await dashboardPage.getTitleText()
    expect(title).toBe('仪表盘')
  })

  test('仪表盘页面所有元素正确显示', async ({ page }) => {
    await page.goto('/')
    await loginPage.login(testAdmin.admin.username, testAdmin.admin.password)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 })

    // 检查页面标题
    await expect(page.locator('.dashboard h2')).toBeVisible({ timeout: 20000 })
    const titleText = await page.locator('.dashboard h2').textContent()
    expect(titleText).toBe('仪表盘')

    // 检查统计卡片数量
    const statCards = page.locator('.stat-card')
    await expect(statCards).toHaveCount(4)

    // 检查所有卡片图标可见
    const icons = page.locator('.stat-card .stat-icon')
    await expect(icons).toHaveCount(4)

    // 检查所有卡片标签可见
    const labels = page.locator('.stat-card .stat-label')
    await expect(labels).toHaveCount(4)

    // 检查统计卡片值
    const productCount = page.locator('.stat-card--blue .stat-value')
    await expect(productCount).toBeVisible()
    const productText = await productCount.textContent()
    expect(productText).toContain('1,024')

    const orderCount = page.locator('.stat-card--green .stat-value')
    await expect(orderCount).toBeVisible()
    const orderText = await orderCount.textContent()
    expect(orderText).toContain('256')

    const userCount = page.locator('.stat-card--orange .stat-value')
    await expect(userCount).toBeVisible()
    const userText = await userCount.textContent()
    expect(userText).toContain('8,192')

    const revenueCount = page.locator('.stat-card--purple .stat-value')
    await expect(revenueCount).toBeVisible()
    const revenueText = await revenueCount.textContent()
    expect(revenueText).toContain('¥')
  })
})
