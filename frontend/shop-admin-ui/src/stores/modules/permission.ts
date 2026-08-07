/**
 * 权限 & 动态路由状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getUserMenus, type PermissionItem } from '@/api/permission'
import dashboardRoutes from '@/router/modules/dashboard'

/**
 * 后端菜单 component 字段到前端组件的映射
 * 后端存储格式如: views/system/user/index.vue
 * 前端实际路径如: @/views/system/user/index.vue
 */
const componentModules = import.meta.glob('@/views/**/*.vue')

/**
 * 将后端 component 字段转换为前端实际组件路径
 */
function resolveComponent(component: string | null | undefined) {
  if (!component) return undefined

  // 去掉开头的 views/ 前缀，避免路径重复
  const path = component.replace(/^views\//, '')

  if (componentModules[path]) {
    return componentModules[path]
  }
  console.warn(`[动态路由] 组件未找到: ${path}`)
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
    menuMap.set(menu.id!, menu)
  })

  // 构建父子关系树
  menus.forEach((menu) => {
    const parent = menuMap.get(menu.parentId!)
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
    const route: Partial<RouteRecordRaw> = {
      path: menu.path,
      name: menu.permissionCode || menu.permissionName,
      meta: {
        title: menu.permissionName,
        icon: menu.icon || undefined,
        hidden: menu.visible === 0,
        permissionCode: menu.permissionCode,
      },
    }

    // 有子菜单的情况
    if (menu.children && menu.children.length > 0) {
      // 设置重定向到第一个子菜单
      const firstChild = menu.children[0]
      if (firstChild.path) {
        // 处理子菜单路径，避免重复前缀
        let redirectPath = firstChild.path
        // 如果子菜单路径不以 / 开头，则拼接父菜单路径
        if (!redirectPath.startsWith('/')) {
          redirectPath = `${menu.path}/${redirectPath}`
        }
        // 去掉重复的前缀
        if (redirectPath.startsWith(`${menu.path}/${menu.path}`)) {
          redirectPath = redirectPath.replace(`${menu.path}/${menu.path}`, menu.path)
        }
        route.redirect = redirectPath
      }
      // 递归处理子菜单
      route.children = transformTreeToRoutes(menu.children)
    } else if (menu.component) {
      // 叶子菜单：动态加载组件
      const component = resolveComponent(menu.component)
      if (component) {
        route.component = component
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
      const menus = await getUserMenus()

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
      const transformedRoutes = transformMenusToRoutes(menus)

      // 将固定仪表盘路由添加到最前面
      const allRoutes = [dashboardRoutes, ...transformedRoutes]

      dynamicRoutes.value = allRoutes
      menuList.value = filterHiddenRoutes(allRoutes)

      return allRoutes
    } catch (error) {
      // 重新抛出错误，让调用者处理
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
