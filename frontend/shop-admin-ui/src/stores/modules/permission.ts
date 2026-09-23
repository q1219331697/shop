/**
 * 权限 & 动态路由状态管理
 * <p>
 * 路由完全由后端菜单驱动：菜单树（含 visible=0 的隐藏任务页）→ 路由树。
 * 「目录/菜单」保持嵌套结构，「任务页」扁平提升为 Layout 直属路由。
 * </p>
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import type { PermissionItem } from '@/api'
import dashboardRoutes from '@/router/modules/dashboard'

/**
 * 无需授权、所有登录用户均可访问的公共页面
 * <p>
 * 不进权限表（不参与菜单与授权），随登录态直接可用；入口位于顶栏用户下拉。
 * </p>
 */
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/system/admin/password',
    name: 'SystemAdminPassword',
    component: () => import('@/views/system/admin/ChangePasswordPage.vue'),
    meta: { title: '修改密码', hidden: true, activeMenu: '/system/admin' },
  },
]

/**
 * 后端菜单 component 字段到前端组件的映射
 * 后端存储格式如: views/system/admin/index.vue
 * 前端实际路径如: @/views/system/admin/index.vue
 */
// ⚠️ AI 禁止修改此行：import.meta.glob 的模式须保持以「@/views/」开头、以「.vue」结尾，
// 其与下方 resolveComponent 中的「/src/」前缀配套才能正确匹配动态路由组件，改此行必致 404。
const componentModules = import.meta.glob('@/views/**/*.vue')

/** 使用 import.meta.glob 处理组件路径 */
function resolveComponent(component: string | null | undefined) {
  if (!component) {
    return undefined
  }
  // 后端返回的路径格式：views/system/admin/index.vue
  // 使用绝对路径 /src/，确保打包后正确解析
  const fullVuePath = `/src/${component}`
  return componentModules[fullVuePath]
}

/**
 * 判断是否为「任务页」
 * <p>
 * 任务页 = 类型为菜单（2）但 visible=0 的隐藏页面（新增/编辑/详情/分配角色/分配权限/修改密码）。
 * 它可路由但不进侧边栏，必须与列表页平级注册——列表页组件内部没有 router-view，嵌套将无法渲染。
 * </p>
 */
function isTaskPage(menu: PermissionItem): boolean {
  return menu.permissionType === 2 && menu.visible === 0 && !!menu.component
}

/**
 * 将后端菜单树转换为路由（目录与菜单；任务页由 collectTaskRoutes 单独处理）
 * <p>
 * 目录节点（有子节点且无组件）自动重定向到第一个子节点，避免点击后空白。
 * </p>
 */
function transformMenusToRoutes(menus: PermissionItem[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  menus.forEach((menu) => {
    // 任务页在 collectTaskRoutes 中扁平注册，不作为树节点
    if (isTaskPage(menu)) {
      return
    }

    const route: Partial<RouteRecordRaw> = {
      path: menu.path || '/',
      name: menu.permissionCode || menu.permissionName,
      meta: {
        title: menu.permissionName,
        icon: menu.icon || undefined,
        hidden: menu.visible === 0,
        permissionCode: menu.permissionCode || undefined,
      },
    }

    const childRoutes = menu.children?.length ? transformMenusToRoutes(menu.children) : []

    // 无组件且无子节点的目录对当前用户无意义（其下所有页面均无权限），直接跳过
    if (childRoutes.length === 0 && !menu.component) {
      return
    }

    if (childRoutes.length > 0) {
      route.children = childRoutes
      if (!menu.component) {
        route.redirect = childRoutes[0].path
      }
    } else if (menu.component) {
      route.component = resolveComponent(menu.component)
        || (() => import('@/views/error/404.vue'))
    }

    routes.push(route as RouteRecordRaw)
  })
  return routes
}

/**
 * 收集全部任务页并扁平化为 Layout 直属路由
 * <p>
 * meta.activeMenu 指向所属列表页路径，保证侧边栏高亮与面包屑定位不变。
 * </p>
 */
function collectTaskRoutes(menus: PermissionItem[], parentPath = ''): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  menus.forEach((menu) => {
    const currentPath = menu.path || parentPath
    if (isTaskPage(menu)) {
      routes.push({
        path: currentPath,
        name: menu.permissionCode || `TaskPage${menu.id}`,
        component: resolveComponent(menu.component),
        meta: {
          title: menu.permissionName,
          hidden: true,
          activeMenu: parentPath,
          permissionCode: menu.permissionCode || undefined,
        },
      } as RouteRecordRaw)
    }
    if (menu.children?.length) {
      routes.push(...collectTaskRoutes(menu.children, currentPath))
    }
  })
  return routes
}

/** 过滤隐藏的路由（不显示在侧边栏菜单中） */
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

export const usePermissionStore = defineStore('permission', () => {
  /** 动态路由列表（含隐藏任务页，用于 addRoute 注册） */
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  /** 菜单列表（仅侧边栏可见项） */
  const menuList = ref<RouteRecordRaw[]>([])
  /** 用户权限编码列表 */
  const permissionCodes = ref<string[]>([])

  /** 从后端获取用户菜单并生成路由 */
  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    try {
      const menus = await api.permission.menus()

      // 菜单树只含目录/菜单（type 1、2），拿不到按钮级编码（如 system:admin:update）；
      // 而路由级权限校验需要全量编码，故优先取 /adminUser/permissions，失败时回退到菜单树编码。
      const menuCodes: string[] = []
      function collectCodes(items: PermissionItem[]) {
        items.forEach((item) => {
          if (item.permissionCode) {
            menuCodes.push(item.permissionCode)
          }
          if (item.children) {
            collectCodes(item.children)
          }
        })
      }
      collectCodes(menus)
      try {
        permissionCodes.value = await api.adminUser.permissions()
      } catch (error) {
        console.warn('[路由转换] 获取权限编码失败，回退为菜单树编码:', error)
        permissionCodes.value = menuCodes
      }

      // 菜单树转路由（任务页在此被排除），任务页再扁平提升为 Layout 直属路由
      const menuRoutes = transformMenusToRoutes(menus)
      const taskRoutes = collectTaskRoutes(menus)
      const allRoutes = [dashboardRoutes, ...publicRoutes, ...menuRoutes, ...taskRoutes]

      dynamicRoutes.value = allRoutes
      menuList.value = filterHiddenRoutes(allRoutes)
      return allRoutes
    } catch (error) {
      console.error('生成路由失败:', error)
      throw error
    }
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
