// User Management Page Object
import { expect, type Page } from '@playwright/test'
import { BasePage } from './BasePage';

export class UsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get pageContainer() {
    return this.page.locator('.page-container');
  }

  get searchArea() {
    return this.page.locator('.search-bar');
  }

  get actionsArea() {
    return this.page.locator('.action-bar');
  }

  get dataArea() {
    return this.page.locator('.data-area');
  }

  get table() {
    return this.page.locator('.el-table');
  }

  getUsernameInput() {
    return this.page.locator('.search-bar .el-input__inner[placeholder="请输入用户名"]').first();
  }

  getRealNameInput() {
    return this.page.locator('.search-bar .el-input__inner[placeholder="请输入姓名"]').first();
  }

  getStatusNormalTag() {
    // 状态列："正常" 使用 success 标签
    return this.page.locator('.el-table__body .el-tag--success').first();
  }

  getStatusDisabledTag() {
    // 状态列："禁用" 使用 danger 标签，按文本"禁用"区分（排除"已删除=是"）
    return this.page.locator('.el-table__body .el-tag--danger').filter({ hasText: /禁用/i }).first();
  }

  getDeletedYesTag() {
    // 已删除列："是" 使用 danger 标签（限定在表格 body 内，避免匹配到表格外的标签）
    return this.page.locator('.el-table__body .el-tag--danger').filter({ hasText: /是/i }).first();
  }

  getDeletedNoTag() {
    // 已删除列："否" 使用 info 标签（限定在表格 body 内）
    return this.page.locator('.el-table__body .el-tag--info').filter({ hasText: /否/i }).first();
  }

  getStatusSelect() {
    return this.page.locator('.search-bar .el-select').first();
  }

  getDeletedSelect() {
    return this.page.locator('.search-bar .el-select').nth(1);
  }

  getSearchButton() {
    return this.page.locator('.search-bar .el-button--primary').first();
  }

  getResetButton() {
    return this.page.locator('.search-bar .el-button').nth(1);
  }

  getAddButton() {
    return this.page.locator('.action-bar .el-button').nth(0);
  }

  getEditButton() {
    return this.page.locator('.action-bar .el-button').nth(1);
  }

  getDetailButton() {
    return this.page.locator('.action-bar .el-button').nth(2);
  }

  getDeleteButton() {
    return this.page.locator('.action-bar .el-button').nth(3);
  }

  getBatchDisableButton() {
    return this.page.locator('.action-bar .el-button').nth(4);
  }

  getBatchEnableButton() {
    return this.page.locator('.action-bar .el-button').nth(5);
  }

  getBatchRestoreButton() {
    return this.page.locator('.action-bar .el-button').nth(6);
  }

  getBatchAssignRoleButton() {
    return this.page.locator('.action-bar .el-button').nth(7);
  }

  getTableHeaderCheckbox() {
    return this.page.locator('.el-table__header .el-checkbox__input').first();
  }

  getTableBodyCheckbox(index: number) {
    return this.page.locator('.el-table__body .el-checkbox__input').nth(index);
  }

  getTableRow(index: number) {
    return this.page.locator('.el-table__body tr').nth(index);
  }

  getTableDataCell(rowIndex: number, cellIndex: number) {
    return this.page.locator('.el-table__body tr').nth(rowIndex).locator('td').nth(cellIndex);
  }

  /** 按用户名查找行索引（用户名在第 2 列，即 cellIndex=2） */
  async findRowIndexByUsername(username: string): Promise<number> {
    const rows = this.page.locator('.el-table__body tr')
    const count = await rows.count()
    for (let i = 0; i < count; i++) {
      const usernameCell = rows.nth(i).locator('td').nth(2)
      const text = await usernameCell.textContent()
      if (text && text.trim() === username) {
        return i
      }
    }
    return -1
  }

  /** 等待指定用户名所在行出现（配合操作后刷新） */
  async waitForRowByUsername(username: string, timeout = 10000): Promise<number> {
    await expect
      .poll(async () => (await this.findRowIndexByUsername(username)) >= 0, { timeout })
      .toBe(true)
    return this.findRowIndexByUsername(username)
  }

  getRowButtonByAction(rowIndex: number, action: string) {
    // 支持 action: 'Detail', 'Disable', 'Enable', 'Restore', 'Assign Role'
    // 注意：编辑/删除在工具栏，不在行内
    const actionMap: Record<string, RegExp> = {
      'Detail': /详情/i,
      'Disable': /禁用/i,
      'Enable': /启用/i,
      'Restore': /恢复/i,
      'Assign Role': /分配角色/i,
    }
    const pattern = actionMap[action] || action
    return this.page.locator('.el-table__body tr').nth(rowIndex).locator('.action-link').filter({ hasText: pattern }).first();
  }

  getPagination() {
    return this.page.locator('.el-pagination');
  }

  getPrevPageButton() {
    return this.page.locator('.el-pagination button.btn-prev').first();
  }

  getNextPageButton() {
    return this.page.locator('.el-pagination button.btn-next').first();
  }

  getPageSizeSelect() {
    return this.page.locator('.data-area__pagination .el-select');
  }

  getFormDialog() {
    return this.page.locator('.el-dialog').first();
  }

  getConfirmButton() {
    return this.page.locator('.el-dialog__footer .el-button--primary').first();
  }

  getCancelButton() {
    return this.page.locator('.el-dialog__footer .el-button').last();
  }

  getConfirmDialog() {
    // 工具栏删除/批量操作使用 el-popconfirm 弹出确认（取最后一个，匹配最新弹出的确认框）
    return this.page.locator('.el-popconfirm').last();
  }

  getPopconfirmConfirmButton() {
    return this.page.locator('.el-popconfirm__action .el-button--primary').last();
  }

  getMessageBox() {
    // 批量删除确认框为标准 ElMessageBox.confirm（渲染为 .el-message-box）
    return this.page.locator('.el-message-box').filter({ hasText: '确定删除选中的' }).first();
  }

  getMessageBoxConfirmButton() {
    return this.page.locator('.el-message-box__btns .el-button--primary').first();
  }

  getMessageBoxCancelButton() {
    return this.page.locator('.el-message-box__btns .el-button').last();
  }

  getSuccessMessage() {
    // 取最后一个成功消息，匹配最新弹出的消息，避免匹配到登录等历史残留
    return this.page.locator('.el-message--success').last();
  }

  getErrorMessage() {
    return this.page.locator('.el-message--error').last();
  }

  getWarningMessage() {
    return this.page.locator('.el-message--warning').last();
  }

  async goto() {
    await this.page.goto('/system/user');
    await this.waitForPageLoad();
  }

  /** 通过侧边栏菜单导航到用户管理页面（SPA 内跳转，避免整页刷新导致 token 失效） */
  async navigateViaMenu() {
    // 等待侧边栏菜单渲染完成（动态路由加载后菜单才出现）
    await expect(this.page.locator('.el-sub-menu__title', { hasText: '系统管理' })).toBeVisible({
      timeout: 15000,
    })
    // 点击"系统管理"子菜单展开（若已展开则无需重复点击）
    const systemMenu = this.page.locator('.el-sub-menu__title', { hasText: '系统管理' }).first()
    const userMenuItem = this.page.locator('.el-menu-item', { hasText: '用户管理' }).first()
    if (!(await userMenuItem.isVisible())) {
      await systemMenu.click()
    }
    // 等待"用户管理"菜单项可见（确保子菜单已展开）
    await expect(userMenuItem).toBeVisible({ timeout: 10000 })
    await userMenuItem.click()
    // 等待用户管理页面加载
    await expect(this.page).toHaveURL(/\/system\/user/, { timeout: 15000 })
  }

  async clickAdd() {
    await this.getAddButton().click();
  }

  async clickEdit() {
    await this.getEditButton().click();
  }

  async clickDelete() {
    await this.getDeleteButton().click();
  }

  async batchDisable() {
    await this.getBatchDisableButton().click();
  }

  async batchEnable() {
    await this.getBatchEnableButton().click();
  }

  async batchRestore() {
    await this.getBatchRestoreButton().click();
  }

  async batchAssignRole() {
    await this.getBatchAssignRoleButton().click();
  }

  async clickConfirm() {
    await this.getConfirmButton().click();
  }

  async clickCancel() {
    await this.getCancelButton().click();
  }

  async selectRow(index: number) {
    await this.getTableBodyCheckbox(index).check();
  }

  async selectAllRows() {
    await this.getTableHeaderCheckbox().check();
  }

  /** 按用户名精确选中多行（复用种子测试用户，用于批量操作测试） */
  async selectRowsByUsernames(usernames: string[]): Promise<number> {
    let selected = 0
    for (const name of usernames) {
      const idx = await this.waitForRowByUsername(name)
      await this.getTableBodyCheckbox(idx).check()
      selected++
    }
    return selected
  }

  /** 选中当前列表中所有用户名以指定前缀开头的行（避免误选 admin 等用户） */
  async selectRowsByUsernamePrefix(prefix: string): Promise<number> {
    const usernameCells = this.page.locator('.el-table__body td:nth-child(3)')
    const count = await usernameCells.count()
    let selected = 0
    for (let i = 0; i < count; i++) {
      const text = await usernameCells.nth(i).textContent()
      if (text && text.trim().startsWith(prefix)) {
        await this.getTableBodyCheckbox(i).check()
        selected++
      }
    }
    return selected
  }

  /** 等待列表完全过滤为指定前缀的用户（用于确认搜索生效，避免误选其他用户） */
  async waitForFilterByPrefix(prefix: string, timeout = 10000) {
    await expect
      .poll(async () => {
        // 用户名在第 3 列（td:nth-child(3)），直接定位数据单元格，避免表头/空占位行干扰
        const cells = this.page.locator('.el-table__body td:nth-child(3)')
        const count = await cells.count()
        if (count === 0) return false
        const texts = await cells.allTextContents()
        return texts.every((t) => t && t.trim().startsWith(prefix))
      }, { timeout })
      .toBe(true)
  }

  async deselectAllRows() {
    await this.getTableHeaderCheckbox().uncheck();
  }

  async deselectRow(index: number) {
    await this.getTableBodyCheckbox(index).uncheck();
  }

  async clickRowDetail(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Detail').click();
  }

  async clickRowEdit(_rowIndex: number) {
    // 编辑按钮在工具栏（选中行后点击）
    await this.getEditButton().click();
  }

  async clickRowDelete(_rowIndex: number) {
    // 删除按钮在工具栏（选中行后点击）
    await this.getDeleteButton().click();
  }

  async clickRowDisable(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Disable').click();
  }

  async clickRowEnable(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Enable').click();
  }

  async clickRowRestore(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Restore').click();
  }

  async clickRowAssignRole(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Assign Role').click();
  }

  async fillUserForm(username: string, password: string, realName: string, status: number = 1) {
    await this.page.locator('.el-dialog input[placeholder="请输入用户名"]').first().fill(username);
    await this.page.locator('.el-dialog input[placeholder="请输入密码"]').first().fill(password);
    await this.page.locator('.el-dialog input[placeholder="请输入姓名"]').first().fill(realName);
    await this.page.locator('.el-dialog .el-radio__label').filter({ hasText: status === 1 ? '正常' : '禁用' }).first().click();
  }

  async waitForSuccessMessage(timeout: number = 5000) {
    await this.getSuccessMessage().waitFor({state: 'visible', timeout});
  }

  async getSuccessMessageText() {
    await this.waitForSuccessMessage();
    return await this.getSuccessMessage().textContent();
  }

  async getRowCount() {
    return await this.page.locator('.el-table__body tr').count();
  }
  
  async getPageTitle() {
    return await this.page.locator('.page-header .page-title').textContent();
  }

  async hasPageHeading() {
    return await this.page.locator('.page-header .page-title').isVisible();
  }

  async hasSearchArea() {
    return await this.searchArea.isVisible();
  }

  async hasActionsArea() {
    return await this.actionsArea.isVisible();
  }

  async hasTable() {
    return await this.table.isVisible();
  }

  async hasPagination() {
    return await this.getPagination().isVisible();
  }

  async getUrl() {
    return this.page.url();
  }
}
