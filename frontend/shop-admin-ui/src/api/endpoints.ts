/**
 * 接口地址唯一定义处（生产与 E2E 测试共用）
 *
 * 为什么单独抽这个文件：
 * - 「地址只写一次」：资源路径（/role、/permission…）只在此定义，业务模块与测试都从这里引用，
 *   后端改路径只需改一处，不会两处漂移。
 * - 「不依赖任何模块」：本文件只有常量与纯函数，不 import axios、不碰浏览器 API，
 *   因此既能在浏览器里被业务模块使用，也能被 Node 测试进程直接 import，
 *   不会把 request/router/element-plus 等运行时拽进测试环境。
 *
 * 前缀如何处理（关键）：
 * - 浏览器侧：http.ts 里的 axios 配置 baseURL = import.meta.env.VITE_API_PREFIX，
 *   故本文件只导出「相对路径」（不含前缀），由 axios 自动补全。
 * - Node(测试)侧：page.request 没有 baseURL 机制，前缀由测试侧自行配置并拼接
 *   （见 tests/e2e/common/apiClient.ts 的 API_PREFIX / apiUrl），不在此处定义，
 *   以免在共享模块里为测试留专属配置——测试不污染生产。
 */

/** 资源路径（相对，不含前缀）；生产经 axios baseURL 补全，测试侧自行拼接前缀 */
export const endpoints = {
  // ==================== 认证 ====================
  auth: {
    login: '/public/login',
    logout: '/public/logout',
    tokenRefresh: '/public/token/refresh',
  },

  // ==================== 管理员用户 ====================
  adminUser: {
    list: '/adminUser/list',
    create: '/adminUser/create',
    detail: '/adminUser/detail',
    update: '/adminUser/update',
    delete: '/adminUser/delete',
    batchDelete: '/adminUser/batch-delete',
    disable: '/adminUser/disable',
    enable: '/adminUser/enable',
    restore: '/adminUser/restore',
    /** 重置密码为系统默认密码 */
    resetPassword: '/adminUser/reset-password',
    /** 系统默认密码（新增/重置密码提示展示用） */
    defaultPassword: '/adminUser/default-password',
    /** 修改当前登录管理员密码（自助改密） */
    changePassword: '/adminUser/change-password',
    batchDisable: '/adminUser/batch-disable',
    batchEnable: '/adminUser/batch-enable',
    batchRestore: '/adminUser/batch-restore',
    assignRoles: '/adminUser/assign-roles',
    roleIds: '/adminUser/role-ids',
    /** 当前登录用户的权限编码列表（含按钮级 system:xxx:update 等） */
    permissions: '/adminUser/permissions',
    /** 当前登录管理员信息（刷新后前端据此识别「我是谁」） */
    current: '/adminUser/current',
  },

  // ==================== 角色 ====================
  role: {
    list: '/role/list',
    /** 全量列表，下拉选择用 */
    listAll: '/role/list-all',
    create: '/role/create',
    detail: '/role/detail',
    update: '/role/update',
    delete: '/role/delete',
    disable: '/role/disable',
    enable: '/role/enable',
    batchDisable: '/role/batch-disable',
    batchEnable: '/role/batch-enable',
    assignPermissions: '/role/assign-permissions',
    permissionIds: '/role/permission-ids',
  },

  // ==================== 权限 ====================
  permission: {
    /** 树列表：无条件返回完整树，有条件返回「命中节点 + 祖先链」 */
    list: '/permission/list',
    menus: '/permission/menus',
    create: '/permission/create',
    detail: '/permission/detail',
    update: '/permission/update',
    delete: '/permission/delete',
  },

  // ==================== 登录日志 ====================
  loginLog: {
    list: '/adminLoginLog/list',
  },

} as const
