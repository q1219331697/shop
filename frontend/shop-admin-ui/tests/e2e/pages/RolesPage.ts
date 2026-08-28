// Role Management Page Object
import { expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class RolesPage extends BasePage {
  get pageContainer() {
    return this.page.locator('.page-container')
  }

  get searchArea() {
    return this.page.locator('.search-bar')
  }

  get actionsArea() {
    return this.page.locator('.action-bar')
  }

  get dataArea() {
    return this.page.locator('.data-area')
  }

  get table() {
    return this.page.locator('.el-table')
  }

  getRoleNameInput() {
    return this.page.locator('.search-bar .el-input__inner[placeholder="请输入角色名"]').first()
  }

  getStatusNormalTag() {
    // 状态列："正常" 使用 success 标签
    return this.page.locator('.el-table__body .el-tag--success').first()
  }

  getStatusDisabledTag() {
    // 状态列："禁用" 使用 danger 标签，按文本"禁用"区分
    return this.page.locator('.el-table__body .el-tag--danger').filter({ hasText: /禁用/i }).first()
  }

  getStatusSelect() {
    return this.page.locator('.search-bar .el-select').first()
  }

  getSearchButton() {
    return this.page.locator('.search-bar .el-button--primary').first()
  }

  getResetButton() {
    return this.page.locator('.search-bar .el-button').nth(1)
  }

  getAddButton() {
    return this.page.locator('.action-bar .el-button').nth(0)
  }

  getEditButton() {
    return this.page.locator('.action-bar .el-button').nth(1)
  }

  getDetailButton() {
    return this.page.locator('.action-bar .el-button').nth(2)
  }

  getDeleteButton() {
    return this.page.locator('.action-bar .el-button').nth(3)
  }

  getBatchDisableButton() {
    return this.page.locator('.action-bar .el-button').nth(4)
  }

  getBatchEnableButton() {
    return this.page.locator('.action-bar .el-button').nth(5)
  }

  getBatchAssignPermissionButton() {
    return this.page.locator('.action-bar .el-button').nth(6)
  }

  getTableHeaderCheckbox() {
    return this.page.locator('.el-table__header .el-checkbox__input').first()
  }

  getTableBodyCheckbox(index: number) {
    return this.page.locator('.el-table__body .el-checkbox__input').nth(index)
  }

  getTableRow(index: number) {
    return this.page.locator('.el-table__body tr').nth(index)
  }

  getTableDataCell(rowIndex: number, cellIndex: number) {
    return this.page.locator('.el-table__body tr').nth(rowIndex).locator('td').nth(cellIndex)
  }

  /** 按角色名查找行索引（角色名在数据列第 2 列，即 td:nth-child(3)） */
  async findRowIndexByRoleName(roleName: string): Promise<number> {
    const rows = this.page.locator('.el-table__body tr')
    const count = await rows.count()
    for (let i = 0; i < count; i++) {
      const nameCell = rows.nth(i).locator('td').nth(2)
      const text = await nameCell.textContent()
      if (text && text.trim() === roleName) {
        return i
      }
    }
    return -1
  }

  /** 等待指定角色名所在行出现（配合操作后刷新） */
  async waitForRowByRoleName(roleName: string, timeout = 10000): Promise<number> {
    await expect
      .poll(async () => (await this.findRowIndexByRoleName(roleName)) >= 0, { timeout })
      .toBe(true)
    return this.findRowIndexByRoleName(roleName)
  }

  getRowButtonByAction(rowIndex: number, action: string) {
    // 支持 action: 'Detail', 'Disable', 'Enable', 'Assign Permission'
    const actionMap: Record<string, RegExp> = {
      Detail: /详情/i,
      Disable: /禁用/i,
      Enable: /启用/i,
      'Assign Permission': /分配权限/i,
    }
    const pattern = actionMap[action] || action
    return this.page
      .locator('.el-table__body tr')
      .nth(rowIndex)
      .locator('.action-link')
      .filter({ hasText: pattern })
      .first()
  }

  getPagination() {
    return this.page.locator('.el-pagination')
  }

  getPrevPageButton() {
    return this.page.locator('.el-pagination button.btn-prev').first()
  }

  getNextPageButton() {
    return this.page.locator('.el-pagination button.btn-next').first()
  }

  getFormDialog() {
    return this.page.locator('.el-dialog').first()
  }

  getConfirmButton() {
    return this.page.locator('.el-dialog__footer .el-button--primary').first()
  }

  getCancelButton() {
    return this.page.locator('.el-dialog__footer .el-button').last()
  }

  getMessageBox() {
    // 删除确认框为标准 ElMessageBox.confirm（渲染为 .el-message-box）
    return this.page.locator('.el-message-box').filter({ hasText: '确定删除选中的' }).first()
  }

  getMessageBoxConfirmButton() {
    return this.page.locator('.el-message-box__btns .el-button--primary').first()
  }

  getMessageBoxCancelButton() {
    return this.page.locator('.el-message-box__btns .el-button').last()
  }

  getSuccessMessage() {
    // 取最后一个成功消息，匹配最新弹出的消息，避免匹配到登录等历史残留
    return this.page.locator('.el-message--success').last()
  }

  getErrorMessage() {
    return this.page.locator('.el-message--error').last()
  }

  async goto() {
    await this.page.goto('/system/role')
    await this.waitForPageLoad()
  }

  /** 通过侧边栏菜单导航到角色管理页面（SPA 内跳转，避免整页刷新导致 token 失效） */
  async navigateViaMenu() {
    // 等待侧边栏菜单渲染完成（动态路由加载后菜单才出现）
    await expect(this.page.locator('.el-sub-menu__title', { hasText: '系统管理' })).toBeVisible({
      timeout: 15000,
    })
    // 点击"系统管理"子菜单展开（若已展开则无需重复点击）
    const systemMenu = this.page.locator('.el-sub-menu__title', { hasText: '系统管理' }).first()
    const roleMenuItem = this.page.locator('.el-menu-item', { hasText: '角色管理' }).first()
    if (!(await roleMenuItem.isVisible())) {
      await systemMenu.click()
    }
    // 等待"角色管理"菜单项可见（确保子菜单已展开）
    await expect(roleMenuItem).toBeVisible({ timeout: 10000 })
    await roleMenuItem.click()
    // 等待角色管理页面加载
    await expect(this.page).toHaveURL(/\/system\/role/, { timeout: 15000 })
  }

  async clickAdd() {
    await this.getAddButton().click()
  }

  async clickConfirm() {
    await this.getConfirmButton().click()
  }

  async clickCancel() {
    await this.getCancelButton().click()
  }

  async selectRow(index: number) {
    await this.getTableBodyCheckbox(index).check()
  }

  async selectAllRows() {
    await this.getTableHeaderCheckbox().check()
  }

  /** 按角色名精确选中多行（复用种子测试角色，用于批量操作测试） */
  async selectRowsByRoleNames(roleNames: string[]): Promise<number> {
    let selected = 0
    for (const name of roleNames) {
      const idx = await this.waitForRowByRoleName(name)
      await this.getTableBodyCheckbox(idx).check()
      selected++
    }
    return selected
  }

  async deselectAllRows() {
    await this.getTableHeaderCheckbox().uncheck()
  }

  async clickRowDetail(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Detail').click()
  }

  async clickRowEdit(_rowIndex: number) {
    // 编辑按钮在工具栏（选中行后点击）
    await this.getEditButton().click()
  }

  async clickRowDisable(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Disable').click()
  }

  async clickRowEnable(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Enable').click()
  }

  async clickRowAssignPermission(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Assign Permission').click()
  }

  /** 填写新增角色表单 */
  async fillRoleForm(roleName: string, description: string, sortOrder: number, status: number = 1) {
    await this.page.locator('.el-dialog input[placeholder="请输入角色名"]').first().fill(roleName)
    await this.page
      .locator('.el-dialog textarea[placeholder="请输入描述"]')
      .first()
      .fill(description)
    // 排序字段使用 el-input-number，无 placeholder，直接定位其内部 input
    await this.page.locator('.el-dialog .el-input-number input').first().fill(String(sortOrder))
    await this.page
      .locator('.el-dialog .el-radio__label')
      .filter({ hasText: status === 1 ? '正常' : '禁用' })
      .first()
      .click()
  }

  async waitForSuccessMessage(timeout = 5000) {
    await this.getSuccessMessage().waitFor({ state: 'visible', timeout })
  }

  async getSuccessMessageText() {
    await this.waitForSuccessMessage()
    return await this.getSuccessMessage().textContent()
  }

  async getRowCount() {
    return await this.page.locator('.el-table__body tr').count()
  }

  async getUrl() {
    return this.page.url()
  }
}
