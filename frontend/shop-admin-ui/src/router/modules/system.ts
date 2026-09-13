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
      path: 'admin/create',
      name: 'SystemAdminCreate',
      component: () => import('@/views/system/admin/AdminFormPage.vue'),
      meta: { title: '新增管理员', hidden: true },
    },
    {
      path: 'admin/edit/:id',
      name: 'SystemAdminEdit',
      component: () => import('@/views/system/admin/AdminFormPage.vue'),
      meta: { title: '编辑管理员', hidden: true },
    },
    {
      path: 'admin/detail/:id',
      name: 'SystemAdminDetail',
      component: () => import('@/views/system/admin/AdminDetailPage.vue'),
      meta: { title: '管理员详情', hidden: true },
    },
    {
      path: 'admin/assign-role/:id',
      name: 'SystemAdminAssignRole',
      component: () => import('@/views/system/admin/AssignRolePage.vue'),
      meta: { title: '分配角色', hidden: true },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: { title: '角色管理', icon: 'UserFilled' },
    },
    {
      path: 'role/create',
      name: 'SystemRoleCreate',
      component: () => import('@/views/system/role/RoleFormPage.vue'),
      meta: { title: '新增角色', hidden: true },
    },
    {
      path: 'role/edit/:id',
      name: 'SystemRoleEdit',
      component: () => import('@/views/system/role/RoleFormPage.vue'),
      meta: { title: '编辑角色', hidden: true },
    },
    {
      path: 'role/detail/:id',
      name: 'SystemRoleDetail',
      component: () => import('@/views/system/role/RoleDetailPage.vue'),
      meta: { title: '角色详情', hidden: true },
    },
    {
      path: 'role/assign-permission/:id',
      name: 'SystemRoleAssignPermission',
      component: () => import('@/views/system/role/AssignPermissionPage.vue'),
      meta: { title: '分配权限', hidden: true },
    },
    {
      path: 'permission',
      name: 'SystemPermission',
      component: () => import('@/views/system/permission/index.vue'),
      meta: { title: '权限管理', icon: 'Lock' },
    },
    {
      path: 'permission/create',
      name: 'SystemPermissionCreate',
      component: () => import('@/views/system/permission/PermissionFormPage.vue'),
      meta: { title: '新增权限', hidden: true },
    },
    {
      path: 'permission/edit/:id',
      name: 'SystemPermissionEdit',
      component: () => import('@/views/system/permission/PermissionFormPage.vue'),
      meta: { title: '编辑权限', hidden: true },
    },
    {
      path: 'permission/detail/:id',
      name: 'SystemPermissionDetail',
      component: () => import('@/views/system/permission/PermissionDetailPage.vue'),
      meta: { title: '权限详情', hidden: true },
    },
    {
      path: 'loginLog',
      name: 'SystemLoginLog',
      component: () => import('@/views/system/loginLog/index.vue'),
      meta: { title: '登录日志', icon: 'Document' },
    },
  ],
}

export default systemRoutes
