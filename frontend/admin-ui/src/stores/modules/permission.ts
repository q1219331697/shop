/**
 * 权限 & 动态路由状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const usePermissionStore = defineStore('permission', () => {
  /** 动态路由列表 */
  const dynamicRoutes = ref<RouteRecordRaw[]>([])
  /** 菜单列表（用于侧边栏渲染） */
  const menuList = ref<RouteRecordRaw[]>([])

  /** 设置动态路由 */
  function setDynamicRoutes(routes: RouteRecordRaw[]) {
    dynamicRoutes.value = routes
    menuList.value = filterHiddenRoutes(routes)
  }

  /** 过滤隐藏的路由（不显示在菜单中） */
  function filterHiddenRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
    return routes.filter((route) => {
      if (route.meta?.hidden) return false
      if (route.children) {
        route.children = filterHiddenRoutes(route.children)
      }
      return true
    })
  }

  /** 重置 */
  function resetPermission() {
    dynamicRoutes.value = []
    menuList.value = []
  }

  return {
    dynamicRoutes,
    menuList,
    setDynamicRoutes,
    resetPermission,
  }
})
