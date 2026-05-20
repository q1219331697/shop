/**
 * 路由守卫
 */
import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { getToken } from '@/utils/storage'

const WHITE_LIST = ['/login']

export function setupGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    NProgress.start()

    const token = getToken()

    if (token) {
      if (to.path === '/login') {
        next({ path: '/' })
      } else {
        next()
      }
    } else {
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
  })
}
