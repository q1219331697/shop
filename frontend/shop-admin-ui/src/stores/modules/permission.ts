/**
 * 权限 & 动态路由状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import type { PermissionItem } from '@/api'
import dashboardRoutes from '@/router/modules/dashboard'

/**
 * 后端菜单 component 字段到前端组件的映射
 * 后端存储格式如: views/system/admin/index.vue
 * 前端实际路径如: @/views/system/admin/index.vue
 */
// ⚠️ AI 禁止修改此行：import.meta.glob 的模式须保持以「@/views/」开头、以「.vue」结尾，
// 其与下方 resolveComponent 中的「/src/」前缀配套才能正确匹配动态路由组件，改此行必致 404。
const componentModules = import.meta.glob('@/views/**/*.vue')

// 使用 import.meta.glob 处理组件路径
function resolveComponent(component: string | null | undefined) {
  if (!component) {
    console.error(`[动态路由] 组件路径为空: menu.component = ${component}`)
    return undefined
  }

  console.log('[路由转换] 解析组件:', component)

  // 后端返回的路径格式：views/system/admin/index.vue
  // 使用绝对路径 /src/，确保打包后正确解析
  const fullVuePath = `/src/${component}`
  console.log('[路由转换] 完整路径:', fullVuePath)

  // 从预加载的模块中查找
  const module = componentModules[fullVuePath]
  // const module = () => import(fullVuePath)
  console.log('[路由转换] module:', module)
  if (module) {
    console.warn(`✓ 找到组件: ${fullVuePath} (原路径: ${component})`)
    return module
  }

  console.error(`✗ 组件未找到: ${component}`)
  console.error(`可用的组件路径:`, Object.keys(componentModules).slice(0, 50))
  return undefined
}

/**
 * 将后端菜单树转换为前端路由配置
 * 前端需要树形结构，但后端返回的是扁平列表（按 sort_order 排序）
 * 需要先构建树形结构，再转换为路由
 */
function transformMenusToRoutes(menus: PermissionItem[]): RouteRecordRaw[] {
  // 1. 构建菜单树形结构
  const menuMap = new Map<number, PermissionItem>()
  const rootMenus: PermissionItem[] = []

  // 将所有菜单项放入 Map
  menus.forEach((menu) => {
    menuMap.set(menu.id ?? 0, menu)
  })

  // 构建父子关系树
  menus.forEach((menu) => {
    const parent = menu.parentId ? menuMap.get(menu.parentId) : undefined
    if (parent && menu.parentId !== 0) {
      // 如果有父菜单，添加到父菜单的 children
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(menu)
    } else {
      // 没有父菜单，是根菜单
      rootMenus.push(menu)
    }
  })

  // 2. 将树形菜单转换为路由配置
  return transformTreeToRoutes(rootMenus)
}

/**
 * 递归转换树形菜单为路由
 */
function transformTreeToRoutes(menus: PermissionItem[]): RouteRecordRaw[] {
  return menus.map((menu) => {
    // 直接使用后端返回的 path，不做任何处理
    const path = menu.path || '/'

    const route: Partial<RouteRecordRaw> = {
      path,
      name: menu.permissionCode || menu.permissionName,
      meta: {
        title: menu.permissionName,
        icon: menu.icon || undefined,
        hidden: menu.visible === 0,
        permissionCode: menu.permissionCode,
      },
    }

    // 递归处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = transformTreeToRoutes(menu.children)
    }
    // 有子菜单时不设置 component
    else if (menu.component) {
      const component = resolveComponent(menu.component)
      if (component) {
        route.component = component
      } else {
        route.component = () => import('@/views/error/404.vue')
      }
    }

    return route as RouteRecordRaw
  })
}

export const usePermissionStore = defineStore('permission', () => {
  /** 动态路由列表 */
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  /** 菜单列表（用于侧边栏渲染） */
  const menuList = ref<RouteRecordRaw[]>([])
  /** 用户权限编码列表 */
  const permissionCodes = ref<string[]>([])

  /** 从后端获取用户菜单并生成路由 */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    try {
      console.log('[路由转换] 开始获取用户菜单...')
      const menus = await api.permission.menus()
      console.log('[路由转换] 获取到菜单数据:', menus)

      // 收集所有权限编码
      const codes: string[] = []
      function collectCodes(items: PermissionItem[]) {
        items.forEach((item) => {
          codes.push(item.permissionCode)
          if (item.children) collectCodes(item.children)
        })
      }
      collectCodes(menus)
      permissionCodes.value = codes

      // 转换为路由
      console.log('[路由转换] 开始转换菜单为路由...')
      const transformedRoutes = transformMenusToRoutes(menus)

      // 将固定仪表盘路由添加到最前面
      const allRoutes = [dashboardRoutes, ...transformedRoutes]

      dynamicRoutes.value = allRoutes
      menuList.value = filterHiddenRoutes(allRoutes)

      console.log('[路由转换] 路由生成完成:', allRoutes)
      return allRoutes
    } catch (error) {
      console.error('生成路由失败:', error)
      throw error
    }
  }

  /** 过滤隐藏的路由（不显示在菜单中） */
  function filterHiddenRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
    return routes
      .filter((route) => !route.meta?.hidden)
      .map((route) => {
        if (route.children) {
          return { ...route, children: filterHiddenRoutes(route.children) }
        }
        return route
      })
  }

  /** 判断是否拥有指定权限 */
  function hasPermission(code: string): boolean {
    return permissionCodes.value.includes(code)
  }

  /** 重置 */
  function resetPermission() {
    dynamicRoutes.value = []
    menuList.value = []
    permissionCodes.value = []
  }

  return {
    dynamicRoutes,
    menuList,
    permissionCodes,
    generateRoutes,
    hasPermission,
    resetPermission,
  }
})
