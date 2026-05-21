/**
 * 动态路由（异步路由）
 * 登录后由路由守卫动态添加
 */
import type { RouteRecordRaw } from 'vue-router'
import dashboardRoutes from './modules/dashboard'
import productRoutes from './modules/product'
import orderRoutes from './modules/order'
import userRoutes from './modules/user'

export const asyncRoutes: RouteRecordRaw[] = [
  dashboardRoutes,
  productRoutes,
  orderRoutes,
  userRoutes,
]
