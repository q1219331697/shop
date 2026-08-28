import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { UsersPage } from '../pages/UsersPage'
import { testUsers } from '../fixtures/users'

/** 种子测试用户的预期状态（与 v1.0.0-dml-0001.sql 一致） */
const seedUsers = [
  { id: 2, username: 'testuser', status: 1, deleted: false },
  { id: 3, username: 'testuser2', status: 1, deleted: false },
  { id: 4, username: 'testuser3', status: 0, deleted: false },
  { id: 5, username: 'testuser4', status: 1, deleted: true },
]

/**
 * 通过后端 API 将种子测试用户（testuser/testuser2/testuser3/testuser4）重置为种子状态。
 * 复用现有数据、不新增数据，并在每条测试前调用以保证数据状态可预期、测试可重复。
 */
async function resetTestUsers(page: Page) {
  const loginResp = await page.request.post('/api/public/login', {
    data: { username: testUsers.admin.username, password: testUsers.admin.password },
  })
  const loginData = await loginResp.json()
  const token = loginData.data as string
  const headers = { Authorization: `Bearer ${token}` }

  const listResp = await page.request.get('/api/adminUser', {
    headers,
    params: { pageNum: 1, pageSize: 100 },
  })
  const listData = await listResp.json()
  const records = (listData.data?.records ?? []) as {
    id: number
    username: string
    status: number
    deleted: boolean
  }[]

  for (const target of seedUsers) {
    const current = records.find((r) => r.username === target.username)
    if (!current) continue
    // 先调整删除状态（恢复/删除）
    if (current.deleted !== target.deleted) {
      if (target.deleted) {
        await page.request.delete(`/api/adminUser/${current.id}`, { headers })
      } else {
        await page.request.put(`/api/adminUser/${current.id}/restore`, { headers })
      }
    }
    // 再调整启用/禁用状态
    if (current.status !== target.status) {
      if (target.status === 1) {
        await page.request.put(`/api/adminUser/${current.id}/enable`, { headers })
      } else {
        await page.request.put(`/api/adminUser/${current.id}/disable`, { headers })
      }
    }
  }
}

test.describe('用户管理', () => {
  // 整个用户管理测试涉及数据操作（禁用/启用/恢复/删除），且多个测试组会修改同一批用户数据，
  // 必须串行执行，避免并行 worker 操作同一数据库导致数据竞争
  test.describe.configure({ mode: 'serial' })

  let loginPage: LoginPage
  let usersPage: UsersPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    usersPage = new UsersPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testUsers.admin.username, testUsers.admin.password)
    // 等待跳转到 dashboard（登录成功后动态路由已加载，侧边栏菜单已生成）
    // 注意：必须精确判断路径为 /dashboard，不能用 /.*dashboard/ 或 /\/dashboard$/
    // 否则 /login?redirect=/dashboard 也会误匹配（登录失败被重定向回登录页）
    await expect(page).toHaveURL(
      (url) => new URL(url).pathname === '/dashboard',
      { timeout: 15000 },
    )
    // 等待路由加载完成（动态路由生成）
    await page.waitForLoadState('networkidle')
    // 通过侧边栏菜单导航到用户管理页面（SPA 内跳转，避免整页刷新导致 token 失效被踢回登录页）
    await usersPage.navigateViaMenu()
    // 等待表格加载
    await expect(usersPage.table).toBeVisible({ timeout: 10000 })
    // 每条测试前把种子测试用户重置为种子状态，保证数据状态可预期、测试可重复（复用数据、不新增）
    await resetTestUsers(page)
    // 重置后刷新列表，使前端显示最新数据状态
    await usersPage.getResetButton().click()
    await page.waitForLoadState('networkidle')
  })

  test('页面容器和各区域存在', async () => {
    // 验证页面容器存在
    await expect(usersPage.pageContainer).toBeVisible()

    // 验证搜索区存在
    await expect(usersPage.searchArea).toBeVisible()

    // 验证按钮区存在
    await expect(usersPage.actionsArea).toBeVisible()

    // 验证数据区存在
    await expect(usersPage.dataArea).toBeVisible()

    // 验证表格存在
    await expect(usersPage.table).toBeVisible()
  })

  test('搜索字段存在', async () => {
    // 验证用户名输入框存在
    await expect(usersPage.getUsernameInput()).toBeVisible()

    // 验证姓名输入框存在
    await expect(usersPage.getRealNameInput()).toBeVisible()

    // 验证状态选择器存在
    await expect(usersPage.getStatusSelect()).toBeVisible()

    // 验证删除状态选择器存在
    await expect(usersPage.getDeletedSelect()).toBeVisible()

    // 验证搜索按钮存在
    await expect(usersPage.getSearchButton()).toBeVisible()

    // 验证重置按钮存在
    await expect(usersPage.getResetButton()).toBeVisible()
  })

  test('按钮区按钮存在', async () => {
    // 验证新增按钮存在
    await expect(usersPage.getAddButton()).toBeVisible()

    // 验证编辑按钮存在
    await expect(usersPage.getEditButton()).toBeVisible()

    // 验证删除按钮存在
    await expect(usersPage.getDeleteButton()).toBeVisible()

    // 验证禁用按钮存在
    await expect(usersPage.getBatchDisableButton()).toBeVisible()

    // 验证启用按钮存在
    await expect(usersPage.getBatchEnableButton()).toBeVisible()

    // 验证恢复按钮存在
    await expect(usersPage.getBatchRestoreButton()).toBeVisible()

    // 验证分配角色按钮存在
    await expect(usersPage.getBatchAssignRoleButton()).toBeVisible()
  })

  test('表格复选框存在', async () => {
    // 验证表头复选框存在
    await expect(usersPage.getTableHeaderCheckbox()).toBeVisible()
  })

  test('分页组件存在', async () => {
    // 验证分页组件存在
    await expect(usersPage.getPagination()).toBeVisible()

    // 验证上一页按钮存在
    await expect(usersPage.getPrevPageButton()).toBeVisible()

    // 验证下一页按钮存在
    await expect(usersPage.getNextPageButton()).toBeVisible()
  })

  test('用户列表正确显示', async () => {
    // 等待表格数据加载完成（至少有一行数据）
    await expect
      .poll(async () => usersPage.getRowCount(), { timeout: 10000 })
      .toBeGreaterThan(0)
    const rowCount = await usersPage.getRowCount()

    // 验证每行包含用户信息
    for (let i = 0; i < rowCount; i++) {
      const row = usersPage.getTableRow(i)
      await expect(row).toBeVisible()
      const rowText = await row.textContent()
      expect(rowText).toBeTruthy()
    }
  })

  test('搜索功能正常工作', async ({ page }) => {
    // 重置所有搜索条件（回到默认"全部"状态）
    await usersPage.getResetButton().click()
    await page.waitForLoadState('networkidle')

    // 输入搜索条件（按用户名模糊搜索）
    await usersPage.getUsernameInput().fill('test')
    await usersPage.getSearchButton().click()
    await page.waitForLoadState('networkidle')

    // 验证搜索结果包含数据
    const rowCount = await usersPage.getRowCount()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('全选功能正常工作', async () => {
    const rowCount = await usersPage.getRowCount()
    if (rowCount > 0) {
      // 全选所有行
      await usersPage.selectAllRows()

      // 验证表格头部复选框被选中
      await expect(usersPage.getTableHeaderCheckbox()).toBeChecked()

      // 验证至少有一个复选框被选中
      const firstCheckbox = usersPage.getTableBodyCheckbox(0)
      await expect(firstCheckbox).toBeChecked()

      // 取消全选
      await usersPage.deselectAllRows()

      // 验证表格头部复选框未被选中
      await expect(usersPage.getTableHeaderCheckbox()).not.toBeChecked()
    }
  })

  test('翻页功能正常工作', async ({ page }) => {
    const pagination = usersPage.getPagination()
    await expect(pagination).toBeVisible()

    // 检查是否有下一页按钮
    const prevButton = usersPage.getPrevPageButton()
    const nextButton = usersPage.getNextPageButton()

    // 如果有下一页（按钮未被禁用），点击下一页
    if (await nextButton.isEnabled()) {
      await nextButton.click()
      await page.waitForLoadState('networkidle')

      // 验证翻页后URL不变（当前路由在分页内）
      await expect(page).toHaveURL('/system/user')
    }

    // 验证上一页按钮可用
    if (await prevButton.isEnabled()) {
      await prevButton.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('查看用户详情功能正常', async () => {
    const rowCount = await usersPage.getRowCount()
    if (rowCount > 0) {
      // 选择第一个用户
      await usersPage.selectRow(0)

      // 点击详情按钮
      await usersPage.clickRowDetail(0)

      // 等待详情对话框出现
      const dialog = usersPage.getFormDialog()
      await expect(dialog).toBeVisible()

      // 验证对话框内容包含用户信息
      await expect(dialog).toContainText('管理员')
    }
  })

  // 修改数据的测试需串行执行，避免并发修改同一批用户数据导致互相干扰
  // 状态/删除状态标签测试依赖初始数据（存在禁用用户、已删除用户），
  // 需放在数据操作（启用/恢复）之前串行执行，否则数据被修改后无法断言
  test.describe('数据操作测试', () => {
    test.describe.configure({ mode: 'serial' })

  test('状态标签正确显示', async () => {
    // 搜索正常用户 testuser，验证状态标签为"正常"
    await usersPage.findRowByUsernameViaSearch('testuser')
    const normalTag = usersPage.getStatusNormalTag()
    await expect(normalTag).toBeVisible()

    // 搜索禁用用户 testuser3，验证状态标签为"禁用"
    await usersPage.findRowByUsernameViaSearch('testuser3')
    const disabledTag = usersPage.getStatusDisabledTag()
    await expect(disabledTag).toBeVisible()
  })

  test('删除状态标签正确显示', async () => {
    // 搜索已删除用户 testuser4，验证删除标签为"是"
    await usersPage.findRowByUsernameViaSearch('testuser4')
    const deletedYesTag = usersPage.getDeletedYesTag()
    await expect(deletedYesTag).toBeVisible()

    // 搜索未删除用户 testuser，验证删除标签为"否"
    await usersPage.findRowByUsernameViaSearch('testuser')
    const deletedNoTag = usersPage.getDeletedNoTag()
    await expect(deletedNoTag).toBeVisible()
  })

  test('禁用用户功能正常工作', async ({ page }) => {
    // 目标：种子测试用户 testuser（默认 status=1 正常、未删除），不新增数据
    // 按用户名精确定位，避免依赖表格遍历扫描状态文本（并行 worker 下状态可能短暂不一致）
    const targetUsername = 'testuser'
    const targetIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)

    // 选择找到的启用状态用户
    await usersPage.selectRow(targetIndex)
    await page.waitForTimeout(300)

    // 点击禁用按钮
    await usersPage.clickRowDisable(targetIndex)
    await page.waitForTimeout(500)

    // 验证成功消息
    const successMsg = await usersPage.getSuccessMessageText()
    expect(successMsg).toBeTruthy()

    // 搜索后按用户名重新定位并验证状态变为禁用
    const newIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)
    const newStatusText = await usersPage.getTableDataCell(newIndex, 4).textContent()
    expect(newStatusText).toContain('禁用')
  })

  test('启用用户功能正常工作', async ({ page }) => {
    // 目标：种子测试用户 testuser3（默认 status=0 禁用、未删除），不新增数据
    // 按用户名精确定位，避免依赖表格遍历扫描状态文本（并行 worker 下状态可能短暂不一致）
    const targetUsername = 'testuser3'
    const targetIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)

    // 选择找到的禁用状态用户
    await usersPage.selectRow(targetIndex)
    await page.waitForTimeout(300)

    // 点击启用按钮
    await usersPage.clickRowEnable(targetIndex)
    await page.waitForTimeout(500)

    // 验证成功消息
    const successMsg = await usersPage.getSuccessMessageText()
    expect(successMsg).toBeTruthy()

    // 搜索后按用户名重新定位并验证状态变为启用
    const newIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)
    const newStatusText = await usersPage.getTableDataCell(newIndex, 4).textContent()
    expect(newStatusText).toContain('正常')
  })

  test('恢复用户功能正常工作', async ({ page }) => {
    // 目标：种子测试用户 testuser4（默认 deleted=1 已删除），不新增数据
    // 按用户名精确定位，避免依赖表格遍历扫描状态文本（并行 worker 下状态可能短暂不一致）
    const targetUsername = 'testuser4'
    const targetIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)

    // 选择找到的已删除用户
    await usersPage.selectRow(targetIndex)
    await page.waitForTimeout(300)

    // 点击恢复按钮
    await usersPage.clickRowRestore(targetIndex)
    await page.waitForTimeout(500)

    // 验证成功消息
    const successMsg = await usersPage.getSuccessMessageText()
    expect(successMsg).toBeTruthy()

    // 搜索后按用户名重新定位并验证删除标记变为"否"
    const newIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)
    const newDeletedText = await usersPage.getTableDataCell(newIndex, 5).textContent()
    expect(newDeletedText).toContain('否')
  })

  test('删除用户功能正常工作', async ({ page }) => {
    // 目标：种子测试用户 testuser2（默认 status=1 正常、未删除），不新增数据
    // 删除按钮对已删除用户禁用，必须选择未删除用户
    const targetUsername = 'testuser2'
    const targetIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)

    // 选择找到的用户
    await usersPage.selectRow(targetIndex)
    await page.waitForTimeout(500)

    // 等待删除按钮可用（需选中未删除用户）
    await expect(usersPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })

    // 点击删除按钮触发 ElMessageBox.confirm 确认框
    await usersPage.getDeleteButton().click()
    await page.waitForTimeout(500)

    // 验证删除确认框出现
    const messageBox = usersPage.getMessageBox()
    await expect(messageBox).toBeVisible()

    // 确认删除
    await usersPage.getMessageBoxConfirmButton().click()
    await page.waitForTimeout(500)

    // 验证成功消息
    const successMsg = await usersPage.getSuccessMessageText()
    expect(successMsg).toBeTruthy()

    // 删除为逻辑删除（deleted 标记置为 1），列表默认仍会显示已删除用户
    // 因此验证该用户的删除标记变为"是"
    const newIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)
    const newDeletedText = await usersPage.getTableDataCell(newIndex, 5).textContent()
    expect(newDeletedText).toContain('是')
  })

  test('添加用户功能正常工作', async ({ page }) => {
    // 点击新增按钮
    await usersPage.clickAdd()

    // 等待新增对话框出现
    const addDialog = usersPage.getFormDialog()
    await expect(addDialog).toBeVisible()

    // 填写用户表单
    const newUsername = `testuser_${Date.now()}`
    await usersPage.fillUserForm(newUsername, 'testpass123', '测试用户', 1)

    // 点击确定按钮
    await usersPage.clickConfirm()

    // 等待成功消息
    await usersPage.waitForSuccessMessage()

    // 验证成功消息显示
    const successMsg = await usersPage.getSuccessMessageText()
    expect(successMsg).toBeTruthy()

    // 清理：通过 API 删除刚新增的用户，避免留下新增数据（保持数据不变、不新增）
    const loginResp = await page.request.post('/api/public/login', {
      data: { username: testUsers.admin.username, password: testUsers.admin.password },
    })
    const loginData = await loginResp.json()
    const token = loginData.data as string
    const headers = { Authorization: `Bearer ${token}` }
    const listResp = await page.request.get('/api/adminUser', {
      headers,
      params: { username: newUsername, pageNum: 1, pageSize: 10 },
    })
    const listData = await listResp.json()
    const record = (listData.data?.records ?? []).find(
      (r: { username: string }) => r.username === newUsername,
    )
    if (record?.id) {
      await page.request.delete(`/api/adminUser/${record.id}`, { headers })
    }
  })

  test('编辑用户功能正常工作', async ({ page }) => {
    // 目标：种子测试用户 testuser（默认未删除），不新增数据
    // 按用户名精确定位，避免依赖表格遍历扫描状态文本（并行 worker 下状态可能短暂不一致）
    const targetUsername = 'testuser'
    const targetIndex = await usersPage.findRowByUsernameViaSearch(targetUsername)

    {
      // 选中该行（编辑按钮需要恰好选中一行才可用）
      await usersPage.selectRow(targetIndex)
      await page.waitForTimeout(300)

      // 点击工具栏编辑按钮
      await usersPage.clickRowEdit(targetIndex)

      // 等待编辑对话框出现
      const editDialog = usersPage.getFormDialog()
      await expect(editDialog).toBeVisible()

      // 修改姓名
      const realNameInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
      const originalValue = await realNameInput.inputValue()
      await realNameInput.fill('测试编辑用户')

      // 点击确定按钮
      await usersPage.clickConfirm()

      // 等待成功消息
      await usersPage.waitForSuccessMessage()

      // 验证成功消息显示
      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
      // 等待对话框关闭
      await expect(editDialog).toBeHidden({ timeout: 10000 })

      // 回滚更改：重新打开编辑对话框，改回原姓名
      await usersPage.selectRow(targetIndex)
      await page.waitForTimeout(300)
      await usersPage.clickRowEdit(targetIndex)
      await expect(editDialog).toBeVisible()
      const rollbackInput = page.locator('.el-dialog input[placeholder="请输入姓名"]').first()
      await rollbackInput.fill(originalValue)
      await usersPage.clickConfirm()
      await page.waitForTimeout(500)
    }
  })

  }) // end describe 数据操作测试

  // 批量操作测试：通过 API 创建用户 + 搜索过滤自建目标数据，保证稳定执行且不影响其他测试
  // 批量操作的核心功能（按钮、选择、接口调用、成功消息）仍通过 UI 验证
  test.describe('批量操作与角色测试', () => {
    test.describe.configure({ mode: 'serial' })

    test('批量禁用用户功能正常工作', async ({ page }) => {
      // 复用种子测试用户（testuser/testuser2 为正常未删除），不新增数据
      // beforeEach 已把种子用户重置为初始状态
      const targetCount = await usersPage.selectRowsByUsernames(['testuser', 'testuser2'])
      expect(targetCount).toBeGreaterThanOrEqual(2)

      // 批量禁用按钮应可用
      await expect(usersPage.getBatchDisableButton()).toBeEnabled({ timeout: 5000 })
      await usersPage.getBatchDisableButton().click()
      await page.waitForTimeout(500)

      // 验证成功消息
      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('批量启用用户功能正常工作', async ({ page }) => {
      // 复用种子测试用户（testuser3 为禁用状态），不新增数据
      const targetCount = await usersPage.selectRowsByUsernames(['testuser3'])
      expect(targetCount).toBeGreaterThanOrEqual(1)

      await expect(usersPage.getBatchEnableButton()).toBeEnabled({ timeout: 5000 })
      await usersPage.getBatchEnableButton().click()
      await page.waitForTimeout(500)

      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('批量恢复用户功能正常工作', async ({ page }) => {
      // 复用种子测试用户（testuser4 为已删除状态），不新增数据
      // beforeEach 已把 testuser4 重置为已删除状态
      const targetCount = await usersPage.selectRowsByUsernames(['testuser4'])
      expect(targetCount).toBeGreaterThanOrEqual(1)

      // 选中后点击批量恢复
      await expect(usersPage.getBatchRestoreButton()).toBeEnabled({ timeout: 5000 })
      await usersPage.getBatchRestoreButton().click()
      await page.waitForTimeout(500)

      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('批量删除用户功能正常工作', async ({ page }) => {
      // 复用种子测试用户（testuser/testuser2 为正常未删除），不新增数据
      const targetCount = await usersPage.selectRowsByUsernames(['testuser', 'testuser2'])
      expect(targetCount).toBeGreaterThanOrEqual(2)

      // 批量删除按钮（工具栏删除按钮）应可用
      await expect(usersPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })
      await usersPage.getDeleteButton().click()
      await page.waitForTimeout(500)

      // 批量删除使用 ElMessageBox.confirm 确认框
      const messageBox = usersPage.getMessageBox()
      await expect(messageBox).toBeVisible()
      await usersPage.getMessageBoxConfirmButton().click()
      await page.waitForTimeout(500)

      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('分配角色功能正常工作', async ({ page }) => {
      // 复用种子测试用户（testuser 为正常未删除），不新增数据
      const targetCount = await usersPage.selectRowsByUsernames(['testuser'])
      expect(targetCount).toBeGreaterThanOrEqual(1)

      // 点击工具栏"分配角色"按钮
      await expect(usersPage.getBatchAssignRoleButton()).toBeEnabled({ timeout: 5000 })
      await usersPage.getBatchAssignRoleButton().click()

      // 等待分配角色对话框出现
      const roleDialog = usersPage.getFormDialog()
      await expect(roleDialog).toBeVisible()
      await expect(roleDialog).toContainText('分配角色')

      // 勾选第一个角色
      const roleCheckbox = page.locator('.el-dialog .role-checkbox').first()
      await roleCheckbox.click()

      // 点击确定
      await usersPage.clickConfirm()
      await page.waitForTimeout(500)

      const successMsg = await usersPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })
  })

  test('批量操作按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await usersPage.deselectAllRows()

    // 验证批量禁用按钮禁用
    const batchDisableBtn = usersPage.getBatchDisableButton()
    await expect(batchDisableBtn).toBeDisabled()

    // 验证批量启用按钮禁用
    const batchEnableBtn = usersPage.getBatchEnableButton()
    await expect(batchEnableBtn).toBeDisabled()

    // 验证批量恢复按钮禁用
    const batchRestoreBtn = usersPage.getBatchRestoreButton()
    await expect(batchRestoreBtn).toBeDisabled()

    // 验证批量分配角色按钮禁用
    const batchAssignRoleBtn = usersPage.getBatchAssignRoleButton()
    await expect(batchAssignRoleBtn).toBeDisabled()
  })

  test('批量删除按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await usersPage.deselectAllRows()

    // 验证删除按钮禁用
    const deleteBtn = usersPage.getDeleteButton()
    await expect(deleteBtn).toBeDisabled()
  })

})
