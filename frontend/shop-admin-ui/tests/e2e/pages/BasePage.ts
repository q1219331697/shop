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

  async isElementVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      const element = this.page.locator(selector)
      await element.waitFor({ state: 'visible', timeout })
      return await element.isVisible()
    } catch {
      return false
    }
  }

  async clickElement(selector: string, timeout: number = 5000): Promise<void> {
    try {
      const element = this.page.locator(selector)
      await element.waitFor({ state: 'visible', timeout })
      await element.click()
    } catch (error) {
      console.error(`Failed to click element: ${selector}`, error)
      throw error
    }
  }

  async fillElement(selector: string, value: string, timeout: number = 5000): Promise<void> {
    try {
      const element = this.page.locator(selector)
      await element.waitFor({ state: 'visible', timeout })
      await element.fill(value)
    } catch (error) {
      console.error(`Failed to fill element: ${selector}`, error)
      throw error
    }
  }

  async clearElement(selector: string, timeout: number = 5000): Promise<void> {
    try {
      const element = this.page.locator(selector)
      await element.waitFor({ state: 'visible', timeout })
      await element.clear()
    } catch (error) {
      console.error(`Failed to clear element: ${selector}`, error)
      throw error
    }
  }
}
