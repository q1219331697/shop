import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  constructor(page: any) {
    super(page)
  }

  // 定位器
  get title() {
    return this.page.locator('.dashboard h2')
  }

  get statCards() {
    return this.page.locator('.stat-card')
  }

  get productsCount() {
    return this.page.locator('.stat-card--blue .stat-value')
  }

  get ordersCount() {
    return this.page.locator('.stat-card--green .stat-value')
  }

  get usersCount() {
    return this.page.locator('.stat-card--orange .stat-value')
  }

  get revenueCount() {
    return this.page.locator('.stat-card--purple .stat-value')
  }

  // 操作方法
  async getTitleText() {
    return await this.getText('.dashboard h2')
  }

  async getStatCardCount() {
    return await this.statCards.count()
  }

  async getProductCount() {
    return await this.getText('.stat-card--blue .stat-value')
  }

  async getOrdersCount() {
    return await this.getText('.stat-card--green .stat-value')
  }

  async getUsersCount() {
    return await this.getText('.stat-card--orange .stat-value')
  }

  async getRevenueCount() {
    return await this.getText('.stat-card--purple .stat-value')
  }

  async getCardLabels() {
    const labels: string[] = []
    const labelsElements = await this.statCards.locator('.stat-label').all()
    for (const element of labelsElements) {
      labels.push(await element.textContent() || '')
    }
    return labels
  }

  async hasStatCards() {
    return await this.statCards.count() > 0
  }
}
