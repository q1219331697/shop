// Role Management Page Object
//
// E2E 测试数据编码规则（务必遵守，禁止自定义前缀）：
// 完整格式：e2e_<模块>_<workerId>_<s|b>_<案例简码>[_<序号>]_<时间戳>
//   单条示例：e2e_r_000_s_dis_mtf74u4a
//   批量示例：e2e_r_000_b_dis_0_mtf74u4a
// 文件简码 r=角色，案例简码见 roles.spec.ts 文件头；workerId 为 3 位定长补零。
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

  /** 指定角色名所在行的状态"正常"标签（限定在目标行内，避免并行下匹配到其他 worker 的行） */
  getStatusNormalTag(roleName: string) {
    return this.getRowByRoleName(roleName).locator('.el-tag--success').filter({ hasText: /正常/i }).first()
  }

  /** 指定角色名所在行的状态"禁用"标签（限定在目标行内） */
  getStatusDisabledTag(roleName: string) {
    return this.getRowByRoleName(roleName).locator('.el-tag--danger').filter({ hasText: /禁用/i }).first()
  }

  getStatusSelect() {
    return this.page.locator('.search-bar .el-select').first()
  }

  getSearchButton() {
    return this.page.locator('.search-bar .el-button', { hasText: '搜索' }).first()
  }

  getResetButton() {
    return this.page.locator('.search-bar .el-button', { hasText: '重置' }).first()
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
    // 原子化读取当前表格所有角色名，避免遍历时表格重渲染导致行数减少、
    // 对已不存在的行调用 textContent 而阻塞等待超时（搜索刷新前后行数可能变化）
    const roleNames = await this.page
      .locator('.el-table__body tr td:nth-child(3)')
      .evaluateAll((cells) => cells.map((c) => (c.textContent ?? '').trim()))
    return roleNames.indexOf(roleName)
  }

  /** 等待指定角色名所在行出现（配合操作后刷新） */
  async waitForRowByRoleName(roleName: string, timeout = 10000): Promise<number> {
    await expect
      .poll(async () => (await this.findRowIndexByRoleName(roleName)) >= 0, { timeout })
      .toBe(true)
    return this.findRowIndexByRoleName(roleName)
  }

  /**
   * 通过搜索按角色名过滤并定位目标行，避免受列表分页影响（新角色可能不在第一页）。
   *
   * ⚠️ 外层 for 重试不可删除，原因常被误解：
   * 内层 expect.poll 轮询的是 findRowIndexByRoleName()，而它只读取当前 DOM 列表，
   * 不会再发起搜索请求。所以一旦首次 fill+click 的搜索请求因竞态未真正生效
   * （点击时组件未 ready、请求被 debounce 吞掉等），内层轮询再久读到的都是同一份
   * 错误列表。只有外层的「重新 fill + click」才能重新触发搜索并自愈。
   *
   * 实测该重试极少触发（几乎首次即命中），属于廉价的韧性保险：
   * 成功路径零额外开销，仅在真的搜不到时才付出约 20s 代价。
   * 注意它与 config 的 retries 不同：retries 重跑整个用例（贵，且当前为 0），
   * 此处只重做单次搜索操作（便宜）。
   */
  async findRowByRoleNameViaSearch(roleName: string): Promise<number> {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.getRoleNameInput().fill(roleName)
      await this.getSearchButton().click()
      try {
        await expect
          .poll(async () => (await this.findRowIndexByRoleName(roleName)) >= 0, {
            timeout: 10000,
            intervals: [200, 400, 600, 1000],
          })
          .toBe(true)
        return await this.findRowIndexByRoleName(roleName)
      } catch {
        // 本轮搜索超时未出现目标：直接进入下一轮重试（重新 fill + 搜索），无需重置
        await this.page.waitForTimeout(300)
      }
    }
    throw new Error(`[searchAndLocate] 多次重试后仍未在列表中找到目标角色: ${roleName}`)
  }

  /**
   * 批量场景：搜索共享前缀，轮询等待至少一行以该前缀开头的角色出现，返回命中行数。
   * 外层 for 重试的必要性同 findRowByRoleNameViaSearch（内层轮询只读取列表不重新搜索），
   * 详见该方法注释。
   */
  async findRowsByPrefixViaSearch(prefix: string): Promise<number> {
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.getRoleNameInput().fill(prefix)
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
    throw new Error(`多次重试后仍未在列表中找到目标前缀角色: ${prefix}`)
  }

  /** 统计当前列表中以指定前缀开头的角色行数 */
  async findRowCountByPrefix(prefix: string): Promise<number> {
    const cells = await this.page
      .locator('.el-table__body td:nth-child(3)')
      .evaluateAll((tds) => tds.map((c) => (c.textContent ?? '').trim()))
    return cells.filter((t) => t.startsWith(prefix)).length
  }

  /** 等待列表完全过滤为指定前缀的角色（确认搜索生效） */
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

  // 确认/取消按钮限定到当前确认框内部，避免并行下匹配到页面其他 MessageBox 的按钮导致点错
  getMessageBoxConfirmButton() {
    return this.getMessageBox().locator('.el-message-box__btns .el-button--primary').first()
  }

  getMessageBoxCancelButton() {
    return this.getMessageBox().locator('.el-message-box__btns .el-button').last()
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

  /** 按角色名精确选中多行（自建目标角色，用于批量操作测试） */
  async selectRowsByRoleNames(roleNames: string[]): Promise<number> {
    let selected = 0
    for (const name of roleNames) {
      await this.selectRowByRoleName(name)
      selected++
    }
    return selected
  }

  /** 选中当前列表中所有角色名以指定前缀开头的行（批量操作用，与用户管理 selectRowsByUsernamePrefix 一致） */
  async selectRowsByRoleNamePrefix(prefix: string): Promise<number> {
    await this.waitForFilterByPrefix(prefix)
    // 原子化读取所有角色名，避免逐行 textContent 在列表重渲染时行数变化导致超时
    const roleNames = await this.page
      .locator('.el-table__body td:nth-child(3)')
      .evaluateAll((cells) => cells.map((c) => (c.textContent ?? '').trim()))
    let selected = 0
    for (let i = 0; i < roleNames.length; i++) {
      if (roleNames[i].startsWith(prefix)) {
        await this.getTableBodyCheckbox(i).check()
        selected++
      }
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

  // ===== 按角色名定位行的操作（不依赖行索引，并行场景下目标行不受其他数据影响） =====

  /**
   * 返回包含指定角色名的表格行 locator（角色名在第 3 列，精确匹配）。
   * 并行时列表可能包含其他 worker 的数据，但按角色名过滤可精确定位目标行。
   */
  getRowByRoleName(roleName: string) {
    return this.page
      .locator('.el-table__body tr')
      .filter({ has: this.page.locator('td').nth(2).getByText(roleName, { exact: true }) })
      .first()
  }

  /** 勾选指定角色所在行的复选框（列表重渲染时自动重试，避免 check 超时竞态） */
  async selectRowByRoleName(roleName: string) {
    const checkbox = this.getRowByRoleName(roleName).locator('.el-checkbox__input')
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await checkbox.check({ timeout: 5000 })
        return
      } catch {
        // 列表可能正在重渲染（操作后刷新），等待稳定后重试
        await this.page.waitForTimeout(500)
      }
    }
    throw new Error(`[selectRowByRoleName] 多次重试后仍无法勾选目标角色: ${roleName}`)
  }

  /** 点击指定角色所在行的"禁用" */
  async clickRowDisableByRoleName(roleName: string) {
    await this.getRowByRoleName(roleName).locator('.action-link').filter({ hasText: /禁用/i }).first().click()
  }

  /** 点击指定角色所在行的"启用" */
  async clickRowEnableByRoleName(roleName: string) {
    await this.getRowByRoleName(roleName).locator('.action-link').filter({ hasText: /启用/i }).first().click()
  }

  /** 读取指定角色所在行的指定单元格 */
  getTableDataCellByRoleName(roleName: string, cellIndex: number) {
    return this.getRowByRoleName(roleName).locator('td').nth(cellIndex)
  }

  /**
   * 轮询等待指定角色所在行的指定单元格文本包含期望值（用于操作后状态断言，替代硬等待）。
   * 并行下操作后列表可能重新渲染，直接读取可能拿到旧值，故轮询直到符合。
   */
  async expectCellTextContainByRoleName(
    roleName: string,
    cellIndex: number,
    expected: string,
    timeout = 10000,
  ) {
    await expect
      .poll(
        async () => {
          const row = this.getRowByRoleName(roleName)
          const count = await row.count()
          if (count === 0) return ''
          const text = await row.locator('td').nth(cellIndex).textContent()
          return (text ?? '').trim()
        },
        { timeout, intervals: [200, 400, 600] },
      )
      .toContain(expected)
  }

  /**
   * 批量场景的业务结果断言：轮询等待当前列表中所有以 prefix 开头的角色行的
   * 指定单元格文本都包含期望值（替代依赖成功 Toast 几秒窗口的判断）。
   * 用于批量禁用/启用后，验证状态列（第 4 列）已真正变化。
   * @param prefix 清理前缀（已 search 过滤后的列表应只剩该前缀行）
   * @param cellIndex 列索引（角色名=3，状态列=4）
   * @param expected 期望文本，如 '禁用' / '正常'
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
          for (let i = 0; i < texts.length; i++) {
            if (texts[i].startsWith(prefix) && !cellTexts[i].includes(expected)) return null
          }
          return matched.length
        },
        { timeout, intervals: [200, 400, 600] },
      )
      .toBeTruthy()
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

  async getRowCount() {
    return await this.page.locator('.el-table__body tr').count()
  }

  async getUrl() {
    return this.page.url()
  }
}
