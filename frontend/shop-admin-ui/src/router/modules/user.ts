/**
 * 用户管理路由
 */
import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw = {
  path: '/admin',
  name: 'Admin',
  redirect: '/admin/user',
  meta: { title: '管理员', icon: 'Setting' },
  children: [
    {
      path: 'user',
      name: 'AdminUser',
      component: () => import('@/views/admin/user/index.vue'),
      meta: { title: '用户管理', icon: 'User' },
    },
    {
      path: 'role',
      name: 'AdminRole',
      component: () => import('@/views/admin/role/index.vue'),
      meta: { title: '角色管理', icon: 'UserFilled' },
    },
    {
      path: 'permission',
      name: 'AdminPermission',
      component: () => import('@/views/admin/permission/index.vue'),
      meta: { title: '权限管理', icon: 'Lock' },
    },
  ],
}

export default adminRoutes
