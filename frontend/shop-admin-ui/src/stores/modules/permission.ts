
/**
 * 权限 & 动态路由状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { getUserMenus, type PermissionItem } from '@/api/permission'

/**
 * 后端菜单 component 字段到前端组件的映射
 * 后端存储格式如：system/AdminUser, product/ProductList
 * 前端实际路径如：@/views/system/user/index.vue
 */
const componentModules = import.meta.glob('@/views/**/*.vue')

/**
 * 将后端 component 字段转换为前端实际组件路径
 * 规则：system/AdminUser → /src/views/system/AdminUser.vue
 */
function resolveComponent(component: string | null | undefined) {
  if (!component) return undefined
  // 将后端 component 映射到 views 目录下的 .vue 文件
  const path = `/src/views/${component}.vue`
  if (componentModules[path]) {
    return componentModules[path]
  }
  console.warn(`[动态路由] 组件未找到: ${path}`)
  return undefined
}

/**
 * 将后端菜单树转换为前端路由配置
 */
function transformMenusToRoutes(menus: PermissionItem[]): RouteRecordRaw[] {
  return menus.map((menu) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route: Record<string, any> = {
      path: menu.path,
      name: menu.permissionCode,
      meta: {
        title: menu.permissionName,
        icon: menu.icon || undefined,
        hidden: menu.visible === 0,
        permissionCode: menu.permissionCode,
      },
    }

    if (menu.children && menu.children.length > 0) {
      // 有子菜单：设置重定向和子路由
      route.redirect = `${menu.path}/${menu.children[0].path}`
      route.children = transformMenusToRoutes(menu.children)
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
    const routes = transformMenusToRoutes(menus)
    dynamicRoutes.value = routes
    menuList.value = filterHiddenRoutes(routes)

    return routes
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

