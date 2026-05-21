/**
 * 标签页状态管理
 * 记录用户访问的页面历史，便于快速切换
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  /** 路由路径 */
  path: string
  /** 路由名称 */
  name: string | symbol | undefined
  /** 页面标题 */
  title: string
  /** 路由查询参数 */
  query: Record<string, string>
  /** 是否固定（不可关闭） */
  affix?: boolean
}

const MAX_TABS = 20

export const useTabsStore = defineStore('tabs', () => {
  /** 标签页列表 */
  const tabList = ref<TabItem[]>([
    {
      path: '/dashboard',
      name: 'Dashboard',
      title: '仪表盘',
      query: {},
      affix: true,
    },
  ])

  /** 当前激活的标签路径 */
  const activeTab = ref('/dashboard')

  /** 获取当前标签 */
  const currentTab = computed(() => tabList.value.find((tab) => tab.path === activeTab.value))

  /** 添加标签 */
  function addTab(route: RouteLocationNormalized) {
    const { path, name, meta, query } = route
    const title = (meta?.title as string) || name?.toString() || path

    // 不记录登录页和 404 页
    if (path === '/login' || path.startsWith('/404') || meta?.hidden) return

    const existingTab = tabList.value.find((tab) => tab.path === path)
    if (existingTab) {
      // 更新已有标签的查询参数
      existingTab.query = query as Record<string, string>
      existingTab.title = title
    } else {
      // 超出最大数量时移除最早的非固定标签
      if (tabList.value.length >= MAX_TABS) {
        const removableIndex = tabList.value.findIndex((tab) => !tab.affix)
        if (removableIndex > -1) {
          tabList.value.splice(removableIndex, 1)
        }
      }
      tabList.value.push({
        path,
        name,
        title,
        query: query as Record<string, string>,
        affix: false,
      })
    }
    activeTab.value = path
  }

  /** 关闭标签 */
  function closeTab(path: string): string | null {
    const index = tabList.value.findIndex((tab) => tab.path === path)
    if (index === -1) return null

    const tab = tabList.value[index]
    if (tab.affix) return null

    tabList.value.splice(index, 1)

    // 如果关闭的是当前激活的标签，则切换到相邻标签
    if (activeTab.value === path) {
      // 优先切换到右侧标签，否则切换到左侧
      const nextTab = tabList.value[index] || tabList.value[index - 1]
      if (nextTab) {
        activeTab.value = nextTab.path
        return nextTab.path
      }
    }
    return null
  }

  /** 关闭其他标签 */
  function closeOtherTabs(path: string) {
    tabList.value = tabList.value.filter((tab) => tab.affix || tab.path === path)
    activeTab.value = path
  }

  /** 关闭所有非固定标签 */
  function closeAllTabs(): string | null {
    const affixTabs = tabList.value.filter((tab) => tab.affix)
    tabList.value = affixTabs
    // 切换到第一个固定标签
    if (affixTabs.length > 0) {
      activeTab.value = affixTabs[0].path
      return affixTabs[0].path
    }
    return null
  }

  /** 关闭左侧标签 */
  function closeLeftTabs(path: string) {
    const index = tabList.value.findIndex((tab) => tab.path === path)
    if (index === -1) return
    const right = tabList.value.filter((tab, i) => i >= index || tab.affix)
    tabList.value = right
    activeTab.value = path
  }

  /** 关闭右侧标签 */
  function closeRightTabs(path: string) {
    const index = tabList.value.findIndex((tab) => tab.path === path)
    if (index === -1) return
    const left = tabList.value.filter((tab, i) => i <= index || tab.affix)
    tabList.value = left
    activeTab.value = path
  }

  /** 设置当前激活标签 */
  function setActiveTab(path: string) {
    activeTab.value = path
  }

  /** 重置 */
  function resetTabs() {
    tabList.value = [
      {
        path: '/dashboard',
        name: 'Dashboard',
        title: '仪表盘',
        query: {},
        affix: true,
      },
    ]
    activeTab.value = '/dashboard'
  }

  return {
    tabList,
    activeTab,
    currentTab,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeLeftTabs,
    closeRightTabs,
    setActiveTab,
    resetTabs,
  }
})
