import { Page, Locator, expect } from '@playwright/test'

import { BasePage } from './BasePage'

/**
 * 权限管理页面（系统管理 / 权限管理，路由 /system/permission）。
 * 权限以树形表格展示，支持搜索、新增、详情、删除。
 */
export class PermissionsPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /** 页面标题（面包屑中的「权限管理」链接） */
  pageTitle = this.page.getByRole('link', { name: '权限管理' })

  /** 搜索框（按权限名称过滤树） */
  searchInput = this.page.getByPlaceholder('请输入权限名称')
  /** 搜索按钮 */
  searchButton = this.page.getByRole('button', { name: '搜索' })
  /** 重置按钮 */
  resetButton = this.page.getByRole('button', { name: '重置' })
  /** 新建权限按钮（工具栏主按钮，primary 样式，避免与行内「新增下级」冲突） */
  createButton = this.page.locator('button.el-button--primary', { hasText: '新增' })
  /** 刷新按钮 */
  refreshButton = this.page.getByRole('button', { name: '刷新' })

  /** 树形表格根 */
  treeTable = this.page.locator('.el-table')

  /** 按权限名称定位树表格行（含子节点，Element Plus 树表格同行渲染展开箭头与文本） */
  rowByName(name: string): Locator {
    return this.page.locator('.el-table__row', { hasText: name }).first()
  }

  /** 行内「详情」按钮（按行定位） */
  viewButtonInRow(name: string): Locator {
    return this.rowByName(name).getByRole('button', { name: '详情' })
  }

  /** 行内「删除」按钮（按行定位） */
  deleteButtonInRow(name: string): Locator {
    return this.rowByName(name).getByRole('button', { name: '删除' })
  }

  /** 新建权限对话框（含权限名称输入框） */
  dialog = this.page.locator('.el-dialog').filter({ has: this.page.getByPlaceholder('请输入权限名称') })
  /** 详情对话框（含「权限名称」标签） */
  detailDialog = this.page.locator('.el-dialog').filter({ hasText: '权限名称' })
  /** 删除确认框 */
  deleteConfirm = this.page.locator('.el-message-box').filter({ hasText: '确定删除权限' })

  /** 通过侧边栏菜单导航到权限管理页面（SPA 内跳转，避免整页刷新导致 token 失效被踢回登录页） */
  async navigateViaMenu() {
    await expect(this.page.locator('.el-sub-menu__title', { hasText: '系统管理' })).toBeVisible({
      timeout: 15000,
    })
    const systemMenu = this.page.locator('.el-sub-menu__title', { hasText: '系统管理' }).first()
    // 权限管理页面菜单文案为「权限管理」，路由 /system/permission
    const permissionMenuItem = this.page.locator('.el-menu-item', { hasText: '权限管理' }).first()
    if (!(await permissionMenuItem.isVisible())) {
      await systemMenu.click()
    }
    await expect(permissionMenuItem).toBeVisible({ timeout: 10000 })
    await permissionMenuItem.click()
    await expect(this.page).toHaveURL(/\/system\/permission/, { timeout: 15000 })
  }

  async searchByKeyword(keyword: string): Promise<void> {
    // 权限树为「前端全量拉取 + 客户端缓存 + 客户端过滤」：用例经 API 新建/删除的数据
    // 不会自动进入缓存。搜索前先点「刷新」使缓存失效，并等待最新全量树返回，
    // 确保后续过滤基于最新数据（API 准备的数据才能被搜到，避免命中建数据前的旧缓存）。
    const treeResp = this.page.waitForResponse(
      (r) => r.url().includes('/api/permission/tree') && r.status() === 200,
      { timeout: 30000 },
    )
    await this.refreshButton.click()
    await treeResp
    await this.searchInput.fill(keyword)
    await this.searchButton.click()
    await this.page.waitForTimeout(300)
  }

  async resetSearch(): Promise<void> {
    await this.resetButton.click()
    await this.page.waitForTimeout(300)
  }

  /** 断言树中存在指定权限名称的节点 */
  async expectNodeVisible(name: string): Promise<void> {
    await expect(this.rowByName(name)).toBeVisible()
  }

  /** 断言树中不存在指定权限名称的节点 */
  async expectNodeHidden(name: string): Promise<void> {
    await expect(this.rowByName(name)).toHaveCount(0)
  }

  /** 打开详情并关闭 */
  async openDetail(name: string): Promise<void> {
    await this.viewButtonInRow(name).click()
    await expect(this.detailDialog).toBeVisible()
  }

  async closeDetail(): Promise<void> {
    await this.detailDialog.locator('.el-dialog__footer button').click()
    await expect(this.detailDialog).toBeHidden()
  }

  /** 点击行内删除并确认 */
  async deleteNode(name: string): Promise<void> {
    await this.deleteButtonInRow(name).click()
    await expect(this.deleteConfirm).toBeVisible()
    await this.deleteConfirm.getByRole('button', { name: '确定' }).click()
    await expect(this.deleteConfirm).toBeHidden()
  }

  /** 打开新建权限对话框 */
  async openCreateDialog(): Promise<void> {
    await this.createButton.click()
    await expect(this.dialog).toBeVisible()
  }

  /** 按表单字段 label 精确定位 el-form-item（使用精确文本匹配避免「路径」匹配「组件路径」） */
  private fieldItem(label: string): Locator {
    return this.dialog.locator(`.el-form-item:has(.el-form-item__label:text-is("${label}"))`)
  }

  /** 填写新建表单（仅填用例关心字段，其余保持默认） */
  async fillCreateForm(opts: {
    parentName?: string
    name: string
    code: string
    type: '目录' | '菜单' | '按钮'
    path?: string
    icon?: string
    component?: string
  }): Promise<void> {
    await this.fieldItem('权限名称').locator('input').fill(opts.name)
    await this.fieldItem('权限编码').locator('input').fill(opts.code)
    // 权限类型：radio 单选（目录/菜单/操作）
    await this.fieldItem('权限类型').locator('.el-radio', { hasText: opts.type }).click()
    if (opts.path !== undefined) {
      await this.fieldItem('路径').locator('input').fill(opts.path)
    }
    if (opts.component !== undefined) {
      await this.fieldItem('组件路径').locator('input').fill(opts.component)
    }
    if (opts.icon !== undefined) {
      // 图标为 IconSelect 插槽，尝试直接填充其输入框（非必填，失败不阻断）
      try {
        await this.fieldItem('菜单图标').locator('input').fill(opts.icon)
      } catch {
        /* 图标选择器形态不确定，忽略 */
      }
    }
  }

  async submitCreate(): Promise<void> {
    await this.dialog.locator('.el-dialog__footer button.el-button--primary').click()
  }
}
