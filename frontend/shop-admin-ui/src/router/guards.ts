/**
 * 路由守卫
 * <p>
 * 动态路由的加载收敛为「一个记忆化任务」（routeTask），它同时承担四件事：
 * 是否加载过、是否进行中、并发去重、失败后不再重试。
 * 因此本模块不再需要 hasAddedRoutes / isRefreshing / isNavigationPending 等多个标志位。
 * </p>
 * <p>
 * 失败语义：
 * - 仅「未认证（000401）」才清理会话并跳登录页；
 * - 网络不可达、服务端异常、未授权（000403）一律保留登录态并放行，不重试、不跳转。
 * </p>
 */
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

import { startAutoRefreshToken, stopAutoRefreshToken } from '@/api/auth'
import { UNAUTHORIZED } from '@/api/resultCode'
import { usePermissionStore } from '@/stores/modules/permission'
import { useTabsStore } from '@/stores/modules/tabs'
import { useUserStore } from '@/stores/modules/user'
import { hasTokenCookie } from '@/utils/storage'

export function setupGuards(router: Router) {
  /**
   * 动态路由加载任务
   * <p>
   * null 表示尚未开始；创建后保留至被显式复位，因此并发导航只会触发一次加载，
   * 失败（false）也不会重试。
   * </p>
   */
  let routeTask: Promise<boolean> | null = null

  /**
   * 加载动态路由
   * <p>
   * 不抛出异常：失败时返回 false，由守卫决定后续行为（放行，不重试）。
   * </p>
   */
  function ensureRoutes(): Promise<boolean> {
    if (routeTask) {
      return routeTask
    }

    // store 必须在导航时获取：本模块随 router 在 pinia 安装前被加载
    const permissionStore = usePermissionStore()
    const userStore = useUserStore()

    const task = (async (): Promise<boolean> => {
      try {
        startAutoRefreshToken()
        const routes = await permissionStore.generateRoutes()
        routes.forEach((route) => router.addRoute('Layout', route))
        await userStore.loadProfile()
        return true
      } catch (error) {
        // 仅未认证才清会话；其余错误保留登录态，等待服务恢复
        if ((error as { bizCode?: string } | null)?.bizCode === UNAUTHORIZED) {
          userStore.resetState()
          routeTask = null // 允许重新登录后重新加载
        }
        permissionStore.resetPermission()
        console.error('[RouterGuard] 动态路由加载失败:', error)
        return false
      }
    })()

    routeTask = task
    return task
  }

  router.beforeEach(async (to, _from, next) => {
    NProgress.start()

    // 未登录：仅放行登录页
    if (!hasTokenCookie()) {
      stopAutoRefreshToken()
      routeTask = null
      return to.path === '/login' ? next() : next(`/login?redirect=${to.path}`)
    }

    // 已登录：不再访问登录页
    if (to.path === '/login') {
      return next({ path: '/', replace: true })
    }

    // 路由未就绪则加载一次；失败不重试
    const justLoaded = !routeTask
    if (!(await ensureRoutes())) {
      NProgress.done()
      // 未认证：会话已被清理，提示一次并回登录页；其余失败（网络/服务端）保留登录态、停在原地
      if (!hasTokenCookie()) {
        ElMessage.error('登录已过期，请重新登录')
        return next(`/login?redirect=${to.path}`)
      }
      return next()
    }

    // 首次加载完成后必须重新导航一次：本次导航仍按旧路由表解析，不重来会落到 404
    if (justLoaded) {
      return next({ path: to.fullPath, replace: true })
    }

    // 路由级权限校验：避免直接输入地址访问受限页面
    const code = to.meta.permissionCode as string | undefined
    if (code && !usePermissionStore().hasPermission(code)) {
      return next({ path: '/404', replace: true })
    }

    next()
  })

  router.afterEach((to) => {
    NProgress.done()
    document.title = `${to.meta.title || ''} - 商城管理后台`
    useTabsStore().addTab(to)
  })
}
