/**
 * 仪表盘路由
 */
import type { RouteRecordRaw } from 'vue-router'

const dashboardRoutes: RouteRecordRaw = {
  path: '/dashboard',
  name: 'Dashboard',
  component: () => import('@/views/dashboard/index.vue'),
  meta: { title: '仪表盘', icon: 'Odometer', alwaysShow: true },
}

export default dashboardRoutes
