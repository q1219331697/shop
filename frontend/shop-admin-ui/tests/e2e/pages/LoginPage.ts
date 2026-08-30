import { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  // 定位器
  private get usernameInput() {
    return this.page.locator('input[placeholder="请输入用户名"]').first()
  }

  private get passwordInput() {
    return this.page.locator('input[placeholder="请输入密码"]').first()
  }

  private get loginButton() {
    return this.page.locator('.login-btn').first()
  }

  private get rememberCheckbox() {
    return this.page.locator('.el-checkbox__original').first()
  }

  // 操作方法
  async login(username: string, password: string, rememberMe: boolean = false) {
    // 等待表单完全加载（元素被添加到 DOM）
    await this.page.waitForSelector('input[placeholder="请输入用户名"]', { state: 'attached', timeout: 10000 })
    // 填充用户名 / 密码
    await this.page.fill('input[placeholder="请输入用户名"]', username)
    await this.page.fill('input[placeholder="请输入密码"]', password)

    // 处理记住密码复选框：保证其状态与 rememberMe 参数一致
    const checkbox = this.page.locator('.el-checkbox').first()
    await checkbox.waitFor({ state: 'visible', timeout: 10000 })
    const isChecked = await checkbox.locator('.el-checkbox__input').isChecked()
    if (rememberMe !== isChecked) {
      await checkbox.locator('.el-checkbox__input').click()
    }

    // 等待登录按钮并点击
    await this.page.waitForSelector('.login-btn', { state: 'attached', timeout: 10000 })
    await this.page.click('.login-btn')

    // 等待导航完成（页面跳转）而不是等待按钮隐藏
    await this.page.waitForURL('**/dashboard', { timeout: 30000 })
  }

  async getErrorMessages(): Promise<string[]> {
    // 等待错误消息出现，然后获取
    await this.page.waitForSelector('.el-message', { state: 'visible', timeout: 5000 })
    const errorMessages = await this.page.locator('.el-message__content').allTextContents()
    return errorMessages.filter(msg => msg && msg.trim() !== '')
  }
}
