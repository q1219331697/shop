/**
 * 用户管理路由
 */
import type { RouteRecordRaw } from 'vue-router'

const userRoutes: RouteRecordRaw = {
  path: '/system',
  name: 'System',
  redirect: '/system/user',
  meta: { title: '系统管理', icon: 'Setting' },
  children: [
    {
      path: 'user',
      name: 'UserManage',
      component: () => import('@/views/system/user/index.vue'),
      meta: { title: '用户管理', icon: 'User' },
    },
  ],
}

export default userRoutes
