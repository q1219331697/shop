import { Page } from '@playwright/test'

export class BasePage {
  constructor(protected page: Page) {}

  // 基础操作方法
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })
  }

  async getText(selector: string, timeout: number = 5000): Promise<string | null> {
    try {
      const element = this.page.locator(selector)
      await element.waitFor({ state: 'visible', timeout })
      return await element.textContent()
    } catch {
      return null
    }
  }

}
