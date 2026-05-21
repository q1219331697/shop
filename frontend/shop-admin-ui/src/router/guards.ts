/**
 * 路由守卫
 */
import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { hasTokenCookie } from '@/utils/storage'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore } from '@/stores/modules/tabs'
import { asyncRoutes } from '@/router/async-routes'

const WHITE_LIST = ['/login']

export function setupGuards(router: Router) {
  let hasAddedRoutes = false

  router.beforeEach(async (to, _from, next) => {
    NProgress.start()

    const loggedIn = hasTokenCookie()

    if (loggedIn) {
      if (to.path === '/login') {
        next({ path: '/' })
      } else {
        // 登录后首次进入，加载动态路由
        if (!hasAddedRoutes) {
          const permissionStore = usePermissionStore()

          // 将动态路由注册到 router（作为 Layout 的子路由）
          asyncRoutes.forEach((route) => {
            router.addRoute('Layout', route)
          })

          // 将动态路由存入 permissionStore 用于菜单渲染
          permissionStore.setDynamicRoutes(asyncRoutes)

          hasAddedRoutes = true

          // 重新导航以确保动态路由生效
          next({ ...to, replace: true })
        } else {
          next()
        }
      }
    } else {
      hasAddedRoutes = false
      if (WHITE_LIST.includes(to.path)) {
        next()
      } else {
        next(`/login?redirect=${to.path}`)
      }
    }
  })

  router.afterEach((to) => {
    NProgress.done()
    document.title = `${to.meta.title || ''} - 商城管理后台`

    // 记录标签页
    const tabsStore = useTabsStore()
    tabsStore.addTab(to)
  })
}
