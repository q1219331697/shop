/**
 * 订单管理路由
 */
import type { RouteRecordRaw } from 'vue-router'

const orderRoutes: RouteRecordRaw = {
  path: '/order',
  name: 'Order',
  redirect: '/order/list',
  meta: { title: '订单管理', icon: 'Document' },
  children: [
    {
      path: 'list',
      name: 'OrderList',
      component: () => import('@/views/order/list/index.vue'),
      meta: { title: '订单列表', icon: 'List' },
    },
  ],
}

export default orderRoutes
