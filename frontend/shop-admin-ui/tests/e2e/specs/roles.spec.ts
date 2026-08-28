import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { RolesPage } from '../pages/RolesPage'
import { testRoles } from '../fixtures/roles'

/** 种子测试角色的预期状态（与 v1.0.0-dml-0002.sql 一致） */
const seedRoles = [
  { id: 2, roleName: '测试角色', status: 1, deleted: false },
  { id: 3, roleName: '测试角色2', status: 1, deleted: false },
  { id: 4, roleName: '测试角色3', status: 0, deleted: false },
]

/**
 * 通过后端 API 将种子测试角色（测试角色/测试角色2/测试角色3）重置为种子状态。
 * 角色无恢复（restore）接口且逻辑删除后不可见，因此：
 *  - 若角色不存在则通过创建接口补建；
 *  - 若角色存在则仅调整启用/禁用状态。
 * 在每条测试前调用以保证数据状态可预期、测试可重复（不删除种子角色）。
 */
async function resetTestRoles(page: Page) {
  const loginResp = await page.request.post('/api/public/login', {
    data: { username: testRoles.admin.username, password: testRoles.admin.password },
  })
  const loginData = await loginResp.json()
  const token = loginData.data as string
  const headers = { Authorization: `Bearer ${token}` }

  const listResp = await page.request.get('/api/role', {
    headers,
    params: { pageNum: 1, pageSize: 100 },
  })
  const listData = await listResp.json()
  const records = (listData.data?.records ?? []) as {
    id: number
    roleName: string
    status: number
    deleted: boolean
  }[]

  for (const target of seedRoles) {
    const current = records.find((r) => r.roleName === target.roleName)
    // 角色不存在（可能被逻辑删除后不可见）则补建
    if (!current) {
      await page.request.post('/api/role', {
        headers,
        data: {
          roleName: target.roleName,
          description: `e2e测试角色${target.id === 2 ? '' : target.id - 2 || ''}`,
          sortOrder: target.id === 2 ? 1 : target.id - 1,
          status: target.status,
        },
      })
      continue
    }
    // 调整启用/禁用状态
    if (current.status !== target.status) {
      if (target.status === 1) {
        await page.request.put(`/api/role/${current.id}/enable`, { headers })
      } else {
        await page.request.put(`/api/role/${current.id}/disable`, { headers })
      }
    }
  }
}

test.describe('角色管理', () => {
  // 整个角色管理测试涉及数据操作（禁用/启用/删除），且多个测试组会修改同一批角色数据，
  // 必须串行执行，避免并行 worker 操作同一数据库导致数据竞争
  test.describe.configure({ mode: 'serial' })

  let loginPage: LoginPage
  let rolesPage: RolesPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    rolesPage = new RolesPage(page)
    // 首先登录
    await page.goto('/')
    await loginPage.login(testRoles.admin.username, testRoles.admin.password)
    // 等待跳转到 dashboard（登录成功后动态路由已加载，侧边栏菜单已生成）
    await expect(page).toHaveURL((url) => new URL(url).pathname === '/dashboard', {
      timeout: 15000,
    })
    // 等待路由加载完成（动态路由生成）
    await page.waitForLoadState('networkidle')
    // 通过侧边栏菜单导航到角色管理页面（SPA 内跳转，避免整页刷新导致 token 失效被踢回登录页）
    await rolesPage.navigateViaMenu()
    // 等待表格加载
    await expect(rolesPage.table).toBeVisible({ timeout: 10000 })
    // 每条测试前把种子测试角色重置为种子状态，保证数据状态可预期、测试可重复
    await resetTestRoles(page)
    // 重置后刷新列表，使前端显示最新数据状态
    await rolesPage.getResetButton().click()
    await page.waitForLoadState('networkidle')
  })

  test('页面容器和各区域存在', async () => {
    // 验证页面容器存在
    await expect(rolesPage.pageContainer).toBeVisible()

    // 验证搜索区存在
    await expect(rolesPage.searchArea).toBeVisible()

    // 验证按钮区存在
    await expect(rolesPage.actionsArea).toBeVisible()

    // 验证数据区存在
    await expect(rolesPage.dataArea).toBeVisible()

    // 验证表格存在
    await expect(rolesPage.table).toBeVisible()
  })

  test('搜索字段存在', async () => {
    // 验证角色名输入框存在
    await expect(rolesPage.getRoleNameInput()).toBeVisible()

    // 验证状态选择器存在
    await expect(rolesPage.getStatusSelect()).toBeVisible()

    // 验证搜索按钮存在
    await expect(rolesPage.getSearchButton()).toBeVisible()

    // 验证重置按钮存在
    await expect(rolesPage.getResetButton()).toBeVisible()
  })

  test('按钮区按钮存在', async () => {
    // 验证新增按钮存在
    await expect(rolesPage.getAddButton()).toBeVisible()

    // 验证编辑按钮存在
    await expect(rolesPage.getEditButton()).toBeVisible()

    // 验证删除按钮存在
    await expect(rolesPage.getDeleteButton()).toBeVisible()

    // 验证禁用按钮存在
    await expect(rolesPage.getBatchDisableButton()).toBeVisible()

    // 验证启用按钮存在
    await expect(rolesPage.getBatchEnableButton()).toBeVisible()

    // 验证分配权限按钮存在
    await expect(rolesPage.getBatchAssignPermissionButton()).toBeVisible()
  })

  test('表格复选框存在', async () => {
    // 验证表头复选框存在
    await expect(rolesPage.getTableHeaderCheckbox()).toBeVisible()
  })

  test('分页组件存在', async () => {
    // 验证分页组件存在
    await expect(rolesPage.getPagination()).toBeVisible()

    // 验证上一页按钮存在
    await expect(rolesPage.getPrevPageButton()).toBeVisible()

    // 验证下一页按钮存在
    await expect(rolesPage.getNextPageButton()).toBeVisible()
  })

  test('角色列表正确显示', async () => {
    // 等待表格数据加载完成（至少有一行数据）
    await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBeGreaterThan(0)
    const rowCount = await rolesPage.getRowCount()

    // 验证每行包含角色信息
    for (let i = 0; i < rowCount; i++) {
      const row = rolesPage.getTableRow(i)
      await expect(row).toBeVisible()
      const rowText = await row.textContent()
      expect(rowText).toBeTruthy()
    }
  })

  test('搜索功能正常工作', async ({ page }) => {
    // 重置所有搜索条件（回到默认"全部"状态）
    await rolesPage.getResetButton().click()
    await page.waitForLoadState('networkidle')

    // 输入搜索条件（按角色名模糊搜索）
    await rolesPage.getRoleNameInput().fill('测试角色')
    await rolesPage.getSearchButton().click()
    await page.waitForLoadState('networkidle')

    // 验证搜索结果包含数据
    const rowCount = await rolesPage.getRowCount()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('全选功能正常工作', async () => {
    const rowCount = await rolesPage.getRowCount()
    if (rowCount > 0) {
      // 全选所有行
      await rolesPage.selectAllRows()

      // 验证表格头部复选框被选中
      await expect(rolesPage.getTableHeaderCheckbox()).toBeChecked()

      // 验证至少有一个复选框被选中
      const firstCheckbox = rolesPage.getTableBodyCheckbox(0)
      await expect(firstCheckbox).toBeChecked()

      // 取消全选
      await rolesPage.deselectAllRows()

      // 验证表格头部复选框未被选中
      await expect(rolesPage.getTableHeaderCheckbox()).not.toBeChecked()
    }
  })

  test('翻页功能正常工作', async ({ page }) => {
    const pagination = rolesPage.getPagination()
    await expect(pagination).toBeVisible()

    // 检查是否有下一页按钮
    const prevButton = rolesPage.getPrevPageButton()
    const nextButton = rolesPage.getNextPageButton()

    // 如果有下一页（按钮未被禁用），点击下一页
    if (await nextButton.isEnabled()) {
      await nextButton.click()
      await page.waitForLoadState('networkidle')

      // 验证翻页后URL不变（当前路由在分页内）
      await expect(page).toHaveURL('/system/role')
    }

    // 验证上一页按钮可用
    if (await prevButton.isEnabled()) {
      await prevButton.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('查看角色详情功能正常', async () => {
    const rowCount = await rolesPage.getRowCount()
    if (rowCount > 0) {
      // 选择第一个角色
      await rolesPage.selectRow(0)

      // 点击详情按钮
      await rolesPage.clickRowDetail(0)

      // 等待详情对话框出现
      const dialog = rolesPage.getFormDialog()
      await expect(dialog).toBeVisible()

      // 验证对话框内容包含角色信息
      await expect(dialog).toContainText('角色')
    }
  })

  // 修改数据的测试需串行执行，避免并发修改同一批角色数据导致互相干扰
  test.describe('数据操作测试', () => {
    test.describe.configure({ mode: 'serial' })

    test('状态标签正确显示', async () => {
      // 等待表格数据加载完成
      await expect.poll(async () => rolesPage.getRowCount(), { timeout: 10000 }).toBeGreaterThan(0)

      // 查找状态为正常的标签
      const normalTag = rolesPage.getStatusNormalTag()
      await expect(normalTag).toBeVisible()

      // 查找状态为禁用的标签（数据中应存在禁用角色 测试角色3）
      const disabledTag = rolesPage.getStatusDisabledTag()
      await expect(disabledTag).toBeVisible()
    })

    test('禁用角色功能正常工作', async ({ page }) => {
      // 目标：种子测试角色"测试角色"（正常状态），不新增数据
      const targetRoleName = '测试角色'
      // 刷新后按角色名精确定位，避免因排序不稳定导致行号错位
      const targetIndex = await rolesPage.waitForRowByRoleName(targetRoleName)

      // 选择该角色
      await rolesPage.selectRow(targetIndex)
      await page.waitForTimeout(300)

      // 点击禁用按钮
      await rolesPage.clickRowDisable(targetIndex)
      await page.waitForTimeout(500)

      // 验证成功消息
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()

      // 刷新后按角色名重新定位并验证状态变为禁用
      const newIndex = await rolesPage.waitForRowByRoleName(targetRoleName)
      const newStatusText = await rolesPage.getTableDataCell(newIndex, 4).textContent()
      expect(newStatusText).toContain('禁用')
    })

    test('启用角色功能正常工作', async ({ page }) => {
      // 目标：种子测试角色"测试角色3"（禁用状态），不新增数据
      const targetRoleName = '测试角色3'
      // 刷新后按角色名精确定位，避免因排序不稳定导致行号错位
      const targetIndex = await rolesPage.waitForRowByRoleName(targetRoleName)

      // 选择该角色
      await rolesPage.selectRow(targetIndex)
      await page.waitForTimeout(300)

      // 点击启用按钮
      await rolesPage.clickRowEnable(targetIndex)
      await page.waitForTimeout(500)

      // 验证成功消息
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()

      // 刷新后按角色名重新定位并验证状态变为启用
      const newIndex = await rolesPage.waitForRowByRoleName(targetRoleName)
      const newStatusText = await rolesPage.getTableDataCell(newIndex, 4).textContent()
      expect(newStatusText).toContain('正常')
    })

    test('添加角色功能正常工作', async ({ page }) => {
      // 点击新增按钮
      await rolesPage.clickAdd()

      // 等待新增对话框出现
      const addDialog = rolesPage.getFormDialog()
      await expect(addDialog).toBeVisible()

      // 填写角色表单
      const newRoleName = `${testRoles.tempPrefix}${Date.now()}`
      await rolesPage.fillRoleForm(newRoleName, 'e2e临时角色', 9)

      // 点击确定按钮
      await rolesPage.clickConfirm()

      // 等待成功消息
      await rolesPage.waitForSuccessMessage()

      // 验证成功消息显示
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()

      // 清理：通过 API 删除刚新增的角色，避免留下新增数据（保持数据不变、不新增）
      const loginResp = await page.request.post('/api/public/login', {
        data: { username: testRoles.admin.username, password: testRoles.admin.password },
      })
      const loginData = await loginResp.json()
      const token = loginData.data as string
      const headers = { Authorization: `Bearer ${token}` }
      const listResp = await page.request.get('/api/role', {
        headers,
        params: { roleName: newRoleName, pageNum: 1, pageSize: 10 },
      })
      const listData = await listResp.json()
      const record = (listData.data?.records ?? []).find(
        (r: { roleName: string }) => r.roleName === newRoleName,
      )
      if (record?.id) {
        await page.request.delete(`/api/role/${record.id}`, { headers })
      }
    })

    test('删除角色功能正常工作', async ({ page }) => {
      // 通过 API 创建一个临时角色（种子角色不删除，避免污染可复用的种子数据）
      const loginResp = await page.request.post('/api/public/login', {
        data: { username: testRoles.admin.username, password: testRoles.admin.password },
      })
      const loginData = await loginResp.json()
      const token = loginData.data as string
      const headers = { Authorization: `Bearer ${token}` }
      const tempRoleName = `${testRoles.tempPrefix}del_${Date.now()}`
      const createResp = await page.request.post('/api/role', {
        headers,
        data: { roleName: tempRoleName, description: '待删除角色', sortOrder: 99, status: 1 },
      })
      await expect(createResp.ok()).toBeTruthy()

      // 刷新列表，使临时角色可见
      await rolesPage.getResetButton().click()
      await page.waitForLoadState('networkidle')

      const targetIndex = await rolesPage.waitForRowByRoleName(tempRoleName)
      // 选择该角色
      await rolesPage.selectRow(targetIndex)
      await page.waitForTimeout(500)

      // 等待删除按钮可用（需选中未删除角色）
      await expect(rolesPage.getDeleteButton()).toBeEnabled({ timeout: 5000 })

      // 点击删除按钮触发 ElMessageBox.confirm 确认框
      await rolesPage.getDeleteButton().click()
      await page.waitForTimeout(500)

      // 验证删除确认框出现
      const messageBox = rolesPage.getMessageBox()
      await expect(messageBox).toBeVisible()

      // 确认删除
      await rolesPage.getMessageBoxConfirmButton().click()
      await page.waitForTimeout(500)

      // 验证成功消息
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()

      // 角色为逻辑删除，删除后从列表中消失（@TableLogic 过滤）
      await expect
        .poll(async () => (await rolesPage.findRowIndexByRoleName(tempRoleName)) < 0, {
          timeout: 10000,
        })
        .toBe(true)
    })

    test('编辑角色功能正常工作', async ({ page }) => {
      // 目标：种子测试角色"测试角色2"（始终为启用状态），不新增数据
      const targetRoleName = '测试角色2'
      // 按角色名精确定位，避免因排序不稳定导致行号错位
      const targetIndex = await rolesPage.waitForRowByRoleName(targetRoleName)

      // 选中该行（编辑按钮需要恰好选中一行才可用）
      await rolesPage.selectRow(targetIndex)
      await page.waitForTimeout(300)

      // 点击工具栏编辑按钮
      await rolesPage.clickRowEdit(targetIndex)

      // 等待编辑对话框出现
      const editDialog = rolesPage.getFormDialog()
      await expect(editDialog).toBeVisible()

      // 修改描述
      const descInput = page.locator('.el-dialog textarea[placeholder="请输入描述"]').first()
      const originalValue = await descInput.inputValue()
      await descInput.fill('测试编辑角色')

      // 点击确定按钮
      await rolesPage.clickConfirm()

      // 等待成功消息
      await rolesPage.waitForSuccessMessage()

      // 验证成功消息显示
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
      // 等待对话框关闭
      await expect(editDialog).toBeHidden({ timeout: 10000 })

      // 回滚更改：重新打开编辑对话框，改回原描述
      const idx = await rolesPage.waitForRowByRoleName(targetRoleName)
      await rolesPage.selectRow(idx)
      await page.waitForTimeout(300)
      await rolesPage.clickRowEdit(idx)
      await expect(editDialog).toBeVisible()
      const rollbackInput = page.locator('.el-dialog textarea[placeholder="请输入描述"]').first()
      await rollbackInput.fill(originalValue)
      await rolesPage.clickConfirm()
      await page.waitForTimeout(500)
    })
  }) // end describe 数据操作测试

  // 批量操作与权限分配测试：复用种子测试角色，保证稳定执行且不影响其他测试
  test.describe('批量操作与权限测试', () => {
    test.describe.configure({ mode: 'serial' })

    test('批量禁用角色功能正常工作', async ({ page }) => {
      // 复用种子测试角色（测试角色/测试角色2 为正常状态），不新增数据
      const targetCount = await rolesPage.selectRowsByRoleNames(['测试角色', '测试角色2'])
      expect(targetCount).toBeGreaterThanOrEqual(2)

      // 批量禁用按钮应可用
      await expect(rolesPage.getBatchDisableButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchDisableButton().click()
      await page.waitForTimeout(500)

      // 验证成功消息
      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('批量启用角色功能正常工作', async ({ page }) => {
      // 复用种子测试角色（测试角色3 为禁用状态），不新增数据
      const targetCount = await rolesPage.selectRowsByRoleNames(['测试角色3'])
      expect(targetCount).toBeGreaterThanOrEqual(1)

      await expect(rolesPage.getBatchEnableButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchEnableButton().click()
      await page.waitForTimeout(500)

      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })

    test('分配权限功能正常工作', async ({ page }) => {
      // 复用种子测试角色（测试角色 为正常状态），不新增数据
      const targetCount = await rolesPage.selectRowsByRoleNames(['测试角色'])
      expect(targetCount).toBeGreaterThanOrEqual(1)

      // 点击工具栏"分配权限"按钮
      await expect(rolesPage.getBatchAssignPermissionButton()).toBeEnabled({ timeout: 5000 })
      await rolesPage.getBatchAssignPermissionButton().click()

      // 等待分配权限对话框出现
      const permDialog = rolesPage.getFormDialog()
      await expect(permDialog).toBeVisible()
      await expect(permDialog).toContainText('分配权限')

      // 点击确定（不勾选任何权限，验证提交成功）
      await rolesPage.clickConfirm()
      await page.waitForTimeout(500)

      const successMsg = await rolesPage.getSuccessMessageText()
      expect(successMsg).toBeTruthy()
    })
  })

  test('批量操作按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await rolesPage.deselectAllRows()

    // 验证批量禁用按钮禁用
    const batchDisableBtn = rolesPage.getBatchDisableButton()
    await expect(batchDisableBtn).toBeDisabled()

    // 验证批量启用按钮禁用
    const batchEnableBtn = rolesPage.getBatchEnableButton()
    await expect(batchEnableBtn).toBeDisabled()

    // 验证批量分配权限按钮禁用
    const batchAssignPermBtn = rolesPage.getBatchAssignPermissionButton()
    await expect(batchAssignPermBtn).toBeDisabled()
  })

  test('批量删除按钮在未选中时禁用', async () => {
    // 确保没有选中任何行
    await rolesPage.deselectAllRows()

    // 验证删除按钮禁用
    const deleteBtn = rolesPage.getDeleteButton()
    await expect(deleteBtn).toBeDisabled()
  })
})
