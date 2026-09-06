/**
 * 路由守卫
 */
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

import { startAutoRefreshToken, stopAutoRefreshToken } from '@/api/auth'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore } from '@/stores/modules/tabs'
import { hasTokenCookie } from '@/utils/storage'

const WHITE_LIST = ['/login']

export function setupGuards(router: Router) {
  let hasAddedRoutes = false
  let isRefreshing = false
  let isLoginAttempted = false
  let isNavigationPending = false // 防止导航过程中的重复处理

  router.beforeEach(async (to, _from, next) => {
    // 如果正在导航中，避免重复处理
    if (isNavigationPending) {
      return
    }

    NProgress.start()

    const loggedIn = hasTokenCookie()

    if (loggedIn) {
      if (to.path === '/login') {
        // 已登录用户访问登录页，重定向到首页
        next({ path: '/', replace: true })
      } else {
        // 需要加载动态路由
        if (!hasAddedRoutes && !isRefreshing) {
          isRefreshing = true
          isNavigationPending = true
          startAutoRefreshToken()
          const permissionStore = usePermissionStore()

          try {
            const routes = await permissionStore.generateRoutes()

            routes.forEach((route) => {
              router.addRoute('Layout', route)
            })

            hasAddedRoutes = true
            isRefreshing = false
            isNavigationPending = false

            // 路由加载完成，重新导航到目标路径
            next({ path: to.fullPath, replace: true })
          } catch (error) {
            console.error('[RouterGuard] 动态路由加载失败:', error)
            permissionStore.resetPermission()
            hasAddedRoutes = false
            isRefreshing = false
            isNavigationPending = false
            stopAutoRefreshToken()
            // 清除登录状态，跳转到登录页
            localStorage.clear()
            sessionStorage.clear()
            next(`/login?redirect=${to.path}`)
          }
        } else if (hasAddedRoutes) {
          // 路由已加载，直接放行
          next()
        } else {
          // 正在加载中，延迟处理
          setTimeout(() => {
            next()
          }, 0)
        }
      }
    } else {
      hasAddedRoutes = false
      isRefreshing = false
      stopAutoRefreshToken()

      // 防止登录过期无限循环
      if (to.path === '/login') {
        if (isLoginAttempted) {
          // 如果已经尝试过登录但仍在登录页，说明可能Token失效，重定向到首页
          next({ path: '/', replace: true })
        } else {
          isLoginAttempted = true
          next()
        }
      } else if (WHITE_LIST.includes(to.path)) {
        next()
      } else {
        // 未登录且不在白名单，跳转到登录页
        next(`/login?redirect=${to.path}`)
      }
    }
  })

  router.afterEach((to) => {
    NProgress.done()
    document.title = `${to.meta.title || ''} - 商城管理后台`

    const tabsStore = useTabsStore()
    tabsStore.addTab(to)
  })

  // 路由重置钩子：用于登录/登出时清理状态
  router.afterEach((to) => {
    // 如果成功进入登录页，重置登录尝试标志
    if (to.path === '/login') {
      isLoginAttempted = false
      hasAddedRoutes = false
      isRefreshing = false
    }
  })
}
