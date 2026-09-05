/**
 * 系统管理路由
 */
import type { RouteRecordRaw } from 'vue-router'

const systemRoutes: RouteRecordRaw = {
  path: '/system',
  name: 'System',
  redirect: '/system/admin',
  meta: { title: '系统管理', icon: 'Setting' },
  children: [
    {
      path: 'admin',
      name: 'SystemAdmin',
      component: () => import('@/views/system/admin/index.vue'),
      meta: { title: '管理员管理', icon: 'User' },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: { title: '角色管理', icon: 'UserFilled' },
    },
    {
      path: 'permission',
      name: 'SystemPermission',
      component: () => import('@/views/system/permission/index.vue'),
      meta: { title: '权限管理', icon: 'Lock' },
    },
  ],
}

export default systemRoutes
