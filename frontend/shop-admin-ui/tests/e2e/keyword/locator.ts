import { Page, Locator } from '@playwright/test'

// 将"定位方式 + 定位值"映射为 Playwright 定位器
export function toLocator(page: Page, type: string, value: string): Locator {
  switch (type) {
    case 'css':
      return page.locator(value)
    case 'xpath':
      return page.locator(`xpath=${value}`)
    case 'name':
      return page.locator(`[name="${value}"]`)
    case 'placeholder':
      return page.getByPlaceholder(value)
    case 'text':
      return page.getByText(value)
    case 'role':
      return page.getByRole(value as any)
    case 'id':
      return page.locator(`#${value}`)
    default:
      return page.locator(value)
  }
}
