// Admin User Management Page Object
//
// E2E 测试数据编码规则（务必遵守，禁止自定义前缀）：
// 完整格式：e2e_<模块>_<workerId>_<s|b>_<案例简码>[_<序号>]_<时间戳>
//   单条示例：e2e_u_000_s_dis_mtf74u4a
//   批量示例：e2e_u_000_b_dis_0_mtf74u4a
// 文件简码 u=管理员，案例简码见 admin.spec.ts 文件头；workerId 为 3 位定长补零。
import { expect, type Page } from '@playwright/test'

import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ===== 页面区域 =====
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

  // ===== 搜索区 =====
  getUsernameInput() {
    return this.page.locator('.search-bar .el-input__inner[placeholder="请输入用户名"]').first();
  }

  getRealNameInput() {
    return this.page.locator('.search-bar .el-input__inner[placeholder="请输入姓名"]').first();
  }

  getStatusSelect() {
    return this.page.locator('.search-bar .el-select').first();
  }

  getDeletedSelect() {
    return this.page.locator('.search-bar .el-select').nth(1);
  }

  getSearchButton() {
    return this.page.locator('.search-bar .el-button', { hasText: '搜索' }).first();
  }

  getResetButton() {
    return this.page.locator('.search-bar .el-button', { hasText: '重置' }).first();
  }

  // ===== 工具栏按钮 =====
  getAddButton() {
    return this.page.locator('.action-bar .el-button').nth(0);
  }

  getEditButton() {
    return this.page.locator('.action-bar .el-button').nth(1);
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

  // ===== 表格元素 =====
  getTableHeaderCheckbox() {
    return this.page.locator('.el-table__header .el-checkbox__input').first();
  }

  getTableBodyCheckbox(index: number) {
    return this.page.locator('.el-table__body .el-checkbox__input').nth(index);
  }

  getTableRow(index: number) {
    return this.page.locator('.el-table__body tr').nth(index);
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

  // ===== 对话框与消息 =====
  getFormDialog() {
    return this.page.locator('.el-dialog').first();
  }

  getConfirmButton() {
    return this.page.locator('.el-dialog__footer .el-button--primary').first();
  }

  getCancelButton() {
    return this.page.locator('.el-dialog__footer .el-button').last();
  }

  getMessageBox() {
    // 删除确认框为标准 ElMessageBox.confirm（渲染为 .el-message-box）
    return this.page.locator('.el-message-box').filter({ hasText: '确定删除选中的' }).first();
  }

  // 确认按钮限定到当前确认框内部，避免匹配到页面其他 MessageBox 的按钮导致点错
  getMessageBoxConfirmButton() {
    return this.getMessageBox().locator('.el-message-box__btns .el-button--primary').first();
  }

  // ===== 状态/删除标签（限定在目标行内，避免并行下误配其他 worker 的行） =====
  getStatusNormalTag(username: string) {
    return this.getRowByUsername(username).locator('.el-tag--success').filter({ hasText: /正常/i }).first();
  }

  getStatusDisabledTag(username: string) {
    return this.getRowByUsername(username).locator('.el-tag--danger').filter({ hasText: /禁用/i }).first();
  }

  getDeletedYesTag(username: string) {
    return this.getRowByUsername(username).locator('.el-tag--danger').filter({ hasText: /是/i }).first();
  }

  getDeletedNoTag(username: string) {
    return this.getRowByUsername(username).locator('.el-tag--info').filter({ hasText: /否/i }).first();
  }

  // ===== 行定位（不依赖行索引，避免并行下列表变动导致错位） =====
  /**
   * 返回包含指定用户名的表格行 locator（用户名在第 3 列，精确匹配）。
   */
  getRowByUsername(username: string) {
    return this.page
      .locator('.el-table__body tr')
      .filter({ has: this.page.locator('td').nth(2).getByText(username, { exact: true }) })
      .first()
  }

  /** 按用户名查找行索引（用户名在第 3 列），原子化读取避免遍历时表格重渲染 */
  async findRowIndexByUsername(username: string): Promise<number> {
    const usernames = await this.page
      .locator('.el-table__body tr td:nth-child(3)')
      .evaluateAll((cells) => cells.map((c) => (c.textContent ?? '').trim()))
    return usernames.indexOf(username)
  }

  /**
   * 通过搜索框精确搜索指定用户名并定位（与分页无关），返回目标所在行索引。
   *
   * ⚠️ 外层 for 重试不可删除，原因常被误解：
   * 内层 expect.poll 轮询的是 findRowIndexByUsername()，而它只读取当前 DOM 列表，
   * 不会再发起搜索请求。所以一旦首次 fill+click 的搜索请求因竞态未真正生效
   * （点击时组件未 ready、请求被 debounce 吞掉等），内层轮询再久读到的都是同一份
   * 错误列表。只有外层的「重新 fill + click」才能重新触发搜索并自愈。
   *
   * 实测该重试极少触发（几乎首次即命中），属于廉价的韧性保险：
   * 成功路径零额外开销，仅在真的搜不到时才付出约 20s 代价。
   * 注意它与 config 的 retries 不同：retries 重跑整个用例（贵，且当前为 0），
   * 此处只重做单次搜索操作（便宜）。
   */
  async findRowByUsernameViaSearch(username: string): Promise<number> {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.getUsernameInput().fill(username)
      await this.getSearchButton().click()
      try {
        await expect
          .poll(async () => (await this.findRowIndexByUsername(username)) >= 0, {
            timeout: 10000,
            intervals: [200, 400, 600, 1000],
          })
          .toBe(true)
        return await this.findRowIndexByUsername(username)
      } catch {
        // 本轮搜索超时未出现目标：直接进入下一轮重试（重新 fill + 搜索），无需重置
        await this.page.waitForTimeout(300)
      }
    }
    // 不额外打印日志：抛出的 Error 已包含完整 username，
    // 且 Playwright 失败时会自动生成 error-context.md（页面快照）与 trace，诊断信息更充分
    throw new Error(`多次重试后仍未在列表中找到目标用户: ${username}`)
  }

  /**
   * 批量场景：搜索共享前缀，轮询等待至少一行以该前缀开头的用户出现，返回命中行数。
   * 外层 for 重试的必要性同 findRowByUsernameViaSearch（内层轮询只读取列表不重新搜索），
   * 详见该方法注释。
   */
  async findRowsByPrefixViaSearch(prefix: string): Promise<number> {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.getUsernameInput().fill(prefix)
      await this.getSearchButton().click()
      try {
        await expect
          .poll(async () => (await this.findRowCountByPrefix(prefix)) > 0, {
            timeout: 10000,
            intervals: [200, 400, 600, 1000],
          })
          .toBe(true)
        return await this.findRowCountByPrefix(prefix)
      } catch {
        // 本轮搜索超时未出现目标：直接进入下一轮重试（重新 fill + 搜索），无需重置
        await this.page.waitForTimeout(300)
      }
    }
    throw new Error(`多次重试后仍未在列表中找到目标前缀用户: ${prefix}`)
  }

  /** 统计当前列表中以指定前缀开头的用户行数 */
  async findRowCountByPrefix(prefix: string): Promise<number> {
    const cells = await this.page
      .locator('.el-table__body td:nth-child(3)')
      .evaluateAll((tds) => tds.map((c) => (c.textContent ?? '').trim()))
    return cells.filter((t) => t.startsWith(prefix)).length
  }

  /** 等待列表完全过滤为指定前缀的用户（确认搜索生效） */
  async waitForFilterByPrefix(prefix: string, timeout = 10000) {
    await expect
      .poll(async () => {
        const cells = this.page.locator('.el-table__body td:nth-child(3)')
        const count = await cells.count()
        if (count === 0) return false
        const texts = await cells.allTextContents()
        return texts.every((t) => t && t.trim().startsWith(prefix))
      }, { timeout })
      .toBe(true)
  }

  getRowButtonByAction(rowIndex: number, action: string) {
    const actionMap: Record<string, RegExp> = {
      Detail: /详情/i,
    }
    const pattern = actionMap[action] || action
    return this.page.locator('.el-table__body tr').nth(rowIndex).locator('.action-link').filter({ hasText: pattern }).first();
  }

  // ===== 操作 =====
  /** 通过侧边栏菜单导航到用户管理页面（SPA 内跳转，避免整页刷新导致 token 失效） */
  async navigateViaMenu() {
    await expect(this.page.locator('.el-sub-menu__title', { hasText: '系统管理' })).toBeVisible({
      timeout: 15000,
    })
    const systemMenu = this.page.locator('.el-sub-menu__title', { hasText: '系统管理' }).first()
    // 管理员用户管理页面菜单文案为「管理员管理」，路由 /system/admin
    const userMenuItem = this.page.locator('.el-menu-item', { hasText: '管理员管理' }).first()
    if (!(await userMenuItem.isVisible())) {
      await systemMenu.click()
    }
    await expect(userMenuItem).toBeVisible({ timeout: 10000 })
    await userMenuItem.click()
    await expect(this.page).toHaveURL(/\/system\/admin/, { timeout: 15000 })
  }

  async clickAdd() {
    await this.getAddButton().click();
  }

  async clickConfirm() {
    await this.getConfirmButton().click();
  }

  async clickCancel() {
    await this.getCancelButton().click();
  }

  async clickRowDetail(rowIndex: number) {
    await this.getRowButtonByAction(rowIndex, 'Detail').click();
  }

  async clickRowEdit(_rowIndex: number) {
    // 编辑按钮在工具栏（选中行后点击）
    await this.getEditButton().click();
  }

  async selectRow(index: number) {
    await this.getTableBodyCheckbox(index).check();
  }

  async selectAllRows() {
    await this.getTableHeaderCheckbox().check();
  }

  async deselectAllRows() {
    await this.getTableHeaderCheckbox().uncheck();
  }

  /** 勾选指定用户所在行的复选框（列表重渲染时自动重试，避免 check 超时竞态） */
  async selectRowByUsername(username: string) {
    const checkbox = this.getRowByUsername(username).locator('.el-checkbox__input')
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await checkbox.check({ timeout: 5000 })
        return
      } catch {
        await this.page.waitForTimeout(500)
      }
    }
    throw new Error(`多次重试后仍无法勾选目标用户: ${username}`)
  }

  /** 选中当前列表中所有用户名以指定前缀开头的行（批量操作用） */
  async selectRowsByUsernamePrefix(prefix: string): Promise<number> {
    await this.waitForFilterByPrefix(prefix)
    // 原子化读取所有用户名，避免逐行 textContent 在列表重渲染时行数变化导致超时
    const usernames = await this.page
      .locator('.el-table__body td:nth-child(3)')
      .evaluateAll((cells) => cells.map((c) => (c.textContent ?? '').trim()))
    let selected = 0
    for (let i = 0; i < usernames.length; i++) {
      if (usernames[i].startsWith(prefix)) {
        await this.getTableBodyCheckbox(i).check()
        selected++
      }
    }
    return selected
  }

  async clickRowDisableByUsername(username: string) {
    await this.getRowByUsername(username).locator('.action-link').filter({ hasText: /禁用/i }).first().click()
  }

  async clickRowEnableByUsername(username: string) {
    await this.getRowByUsername(username).locator('.action-link').filter({ hasText: /启用/i }).first().click()
  }

  async clickRowRestoreByUsername(username: string) {
    await this.getRowByUsername(username).locator('.action-link').filter({ hasText: /恢复/i }).first().click()
  }

  /** 轮询等待指定用户所在行的指定单元格文本包含期望值（操作后状态断言，替代硬等待） */
  async expectCellTextContainByUsername(
    username: string,
    cellIndex: number,
    expected: string,
    timeout = 10000,
  ) {
    await expect
      .poll(
        async () => {
          const row = this.getRowByUsername(username)
          const count = await row.count()
          if (count === 0) return ''
          const text = await row.locator('td').nth(cellIndex).textContent()
          return (text ?? '').trim()
        },
        { timeout, intervals: [200, 400, 600] },
      )
      .toContain(expected)
  }

  async fillUserForm(username: string, password: string, realName: string, status: number = 1) {
    await this.page.locator('.el-dialog input[placeholder="请输入用户名"]').first().fill(username);
    await this.page.locator('.el-dialog input[placeholder="请输入密码"]').first().fill(password);
    await this.page.locator('.el-dialog input[placeholder="请输入姓名"]').first().fill(realName);
    await this.page.locator('.el-dialog .el-radio__label').filter({ hasText: status === 1 ? '正常' : '禁用' }).first().click();
  }

  async getRowCount() {
    return await this.page.locator('.el-table__body tr').count();
  }

  /**
   * 批量场景的业务结果断言：轮询等待当前列表中所有以 prefix 开头的行的
   * 指定单元格文本都包含期望值（替代依赖成功 Toast 几秒窗口的判断）。
   * 用于批量禁用/启用/恢复/删除后，验证状态列/删除列已真正变化。
   * @param prefix 清理前缀（已 search 过滤后的列表应只剩该前缀行）
   * @param cellIndex 列索引（状态列=4，删除列=5）
   * @param expected 期望文本，如 '禁用' / '是'
   * @param minCount 至少需命中的行数（默认 1），防止空列表误判通过
   */
  async expectCellTextContainByPrefix(
    prefix: string,
    cellIndex: number,
    expected: string,
    minCount = 1,
    timeout = 10000,
  ) {
    await expect
      .poll(
        async () => {
          const texts = await this.page
            .locator('.el-table__body tr td:nth-child(3)')
            .evaluateAll((cells) => cells.map((c) => (c.textContent ?? '').trim()))
          const matched = texts.filter((t) => t.startsWith(prefix))
          if (matched.length < minCount) return null
          const cellTexts = await this.page
            .locator('.el-table__body tr')
            .evaluateAll((rows, idx) =>
              rows.map((r) => (r.querySelectorAll('td')[idx]?.textContent ?? '').trim()),
              cellIndex,
            )
          // 仅校验前缀命中的行（按列顺序一致，因为已是过滤后的列表）
          let hit = 0
          for (let i = 0; i < texts.length; i++) {
            if (texts[i].startsWith(prefix)) {
              if (!cellTexts[i].includes(expected)) return null
              hit++
            }
          }
          return hit
        },
        { timeout, intervals: [200, 400, 600] },
      )
      .toBeTruthy()
  }

  /**
   * 分配角色的业务结果断言：重新打开指定用户的分配角色对话框，
   * 轮询等待目标角色 checkbox 已处于勾选状态（替代依赖成功 Toast 的判断）。
   */
  async expectRoleAssignedForUser(prefix: string, timeout = 10000) {
    await this.findRowsByPrefixViaSearch(prefix)
    const targetCount = await this.selectRowsByUsernamePrefix(prefix)
    expect(targetCount).toBeGreaterThanOrEqual(1)
    await this.getBatchAssignRoleButton().click()
    const dialog = this.getFormDialog()
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('分配角色')
    await expect
      .poll(async () => this.page.locator('.el-dialog .role-checkbox').first().isChecked(), {
        timeout,
        intervals: [200, 400, 600],
      })
      .toBe(true)
    await this.clickConfirm()
    await expect(dialog).toBeHidden({ timeout: 10000 })
  }
}
