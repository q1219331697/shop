/**
 * 动态路由（异步路由）
 * 登录后由路由守卫动态添加
 */
import type { RouteRecordRaw } from 'vue-router'

import dashboardRoutes from './modules/dashboard'
import orderRoutes from './modules/order'
import productRoutes from './modules/product'
import systemRoutes from './modules/system'

export const asyncRoutes: RouteRecordRaw[] = [
  dashboardRoutes,
  productRoutes,
  orderRoutes,
  systemRoutes,
]
