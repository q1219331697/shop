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

  private get errorMessages() {
    return this.page.locator('.el-message__content')
  }

  // 操作方法
  async login(username: string, password: string, rememberMe: boolean = false) {
    // 等待表单完全加载（元素被添加到 DOM）
    await this.page.waitForSelector('input[placeholder="请输入用户名"]', { state: 'attached', timeout: 10000 })

    // 填充用户名
    await this.page.fill('input[placeholder="请输入用户名"]', username)

    // 填充密码
    await this.page.fill('input[placeholder="请输入密码"]', password)

    // 处理记住密码复选框
    const checkbox = this.page.locator('.el-checkbox').first()
    await checkbox.waitFor({ state: 'visible', timeout: 10000 })

    // 检查复选框的当前状态
    const isChecked = await checkbox.locator('.el-checkbox__input').isChecked()
    console.log(`Login: checkbox checked=${isChecked}, rememberMe=${rememberMe}`)

    // 如果 rememberMe 为 true，确保复选框被勾选；否则取消勾选
    if (rememberMe && !isChecked) {
      // 直接点击 checkbox 的 input 元素
      await checkbox.locator('.el-checkbox__input').click()
      console.log('Login: checkbox input clicked to check')
    } else if (!rememberMe && isChecked) {
      // 直接点击 checkbox 的 input 元素
      await checkbox.locator('.el-checkbox__input').click()
      console.log('Login: checkbox input clicked to uncheck')
    }

    // 等待登录按钮并点击
    await this.page.waitForSelector('.login-btn', { state: 'attached', timeout: 10000 })
    await this.page.click('.login-btn')

    // 等待导航完成（页面跳转）而不是等待按钮隐藏
    await this.page.waitForURL('**/dashboard', { timeout: 30000 })
  }

  async getErrorMessage(): Promise<string | null> {
    // 等待错误消息出现，然后获取
    await this.page.waitForSelector('.el-message', { state: 'visible', timeout: 5000 })
    const errorMessages = await this.page.locator('.el-message__content').allTextContents()
    return errorMessages.length > 0 ? errorMessages[0] : null
  }

  async getErrorMessages(): Promise<string[]> {
    // 等待错误消息出现，然后获取
    await this.page.waitForSelector('.el-message', { state: 'visible', timeout: 5000 })
    const errorMessages = await this.page.locator('.el-message__content').allTextContents()
    return errorMessages.filter(msg => msg && msg.trim() !== '')
  }

  async isLoading(): Promise<boolean> {
    return await this.loginButton.locator('span').filter({ hasText: '登录中...' }).isVisible()
  }
}
