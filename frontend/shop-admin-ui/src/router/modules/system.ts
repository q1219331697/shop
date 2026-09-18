/**
 * 系统管理路由
 *
 * 说明：
 * - 列表页（admin/role/permission/loginLog）由后端菜单动态下发，此处仅作声明；
 * - create/edit/detail/assign/password 这些「弹窗改页面」子路由不来自后端菜单，由 permission store
 *   的 collectPageSubRoutes 静态注册到 Layout 下，因此必须自行声明：
 *   · activeMenu：指向所属列表页路径，供侧边栏高亮与展开（否则 URL 与菜单项对不上，菜单不定位）；
 *   · permissionCode：路由级权限码，路由守卫据此拦截无权限的直接访问。
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
      meta: {
        title: '新增管理员',
        hidden: true,
        activeMenu: '/system/admin',
        permissionCode: 'system:admin:create',
      },
    },
    {
      path: 'admin/edit/:id',
      name: 'SystemAdminEdit',
      component: () => import('@/views/system/admin/AdminFormPage.vue'),
      meta: {
        title: '编辑管理员',
        hidden: true,
        activeMenu: '/system/admin',
        permissionCode: 'system:admin:update',
      },
    },
    {
      path: 'admin/detail/:id',
      name: 'SystemAdminDetail',
      component: () => import('@/views/system/admin/AdminDetailPage.vue'),
      meta: {
        title: '管理员详情',
        hidden: true,
        activeMenu: '/system/admin',
        permissionCode: 'system:admin:detail',
      },
    },
    {
      path: 'admin/assign-role/:id',
      name: 'SystemAdminAssignRole',
      component: () => import('@/views/system/admin/AssignRolePage.vue'),
      meta: {
        title: '分配角色',
        hidden: true,
        activeMenu: '/system/admin',
        permissionCode: 'system:admin:update',
      },
    },
    {
      // 自助改密：入口在顶栏用户下拉，任何登录用户都可访问，故不声明 permissionCode
      path: 'admin/password',
      name: 'SystemAdminPassword',
      component: () => import('@/views/system/admin/ChangePasswordPage.vue'),
      meta: {
        title: '修改密码',
        hidden: true,
        activeMenu: '/system/admin',
      },
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
      meta: {
        title: '新增角色',
        hidden: true,
        activeMenu: '/system/role',
        permissionCode: 'system:role:create',
      },
    },
    {
      path: 'role/edit/:id',
      name: 'SystemRoleEdit',
      component: () => import('@/views/system/role/RoleFormPage.vue'),
      meta: {
        title: '编辑角色',
        hidden: true,
        activeMenu: '/system/role',
        permissionCode: 'system:role:update',
      },
    },
    {
      path: 'role/detail/:id',
      name: 'SystemRoleDetail',
      component: () => import('@/views/system/role/RoleDetailPage.vue'),
      meta: {
        title: '角色详情',
        hidden: true,
        activeMenu: '/system/role',
        permissionCode: 'system:role:list',
      },
    },
    {
      path: 'role/assign-permission/:id',
      name: 'SystemRoleAssignPermission',
      component: () => import('@/views/system/role/AssignPermissionPage.vue'),
      meta: {
        title: '分配权限',
        hidden: true,
        activeMenu: '/system/role',
        permissionCode: 'system:role:assign',
      },
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
      meta: {
        title: '新增权限',
        hidden: true,
        activeMenu: '/system/permission',
        permissionCode: 'system:permission:create',
      },
    },
    {
      path: 'permission/edit/:id',
      name: 'SystemPermissionEdit',
      component: () => import('@/views/system/permission/PermissionFormPage.vue'),
      meta: {
        title: '编辑权限',
        hidden: true,
        activeMenu: '/system/permission',
        permissionCode: 'system:permission:update',
      },
    },
    {
      path: 'permission/detail/:id',
      name: 'SystemPermissionDetail',
      component: () => import('@/views/system/permission/PermissionDetailPage.vue'),
      meta: {
        title: '权限详情',
        hidden: true,
        activeMenu: '/system/permission',
        permissionCode: 'system:permission:query',
      },
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
