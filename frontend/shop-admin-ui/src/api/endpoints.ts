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
    list: '/adminUser',
    create: '/adminUser',
    detail: (id: number | string) => `/adminUser/${id}`,
    update: (id: number | string) => `/adminUser/${id}`,
    delete: (id: number | string) => `/adminUser/${id}`,
    batchDelete: '/adminUser/batch',
    disable: (id: number | string) => `/adminUser/${id}/disable`,
    enable: (id: number | string) => `/adminUser/${id}/enable`,
    restore: (id: number | string) => `/adminUser/${id}/restore`,
    /** 重置密码为系统默认密码 */
    resetPassword: (id: number | string) => `/adminUser/${id}/reset-password`,
    /** 系统默认密码（新增/重置密码提示展示用） */
    defaultPassword: '/adminUser/default-password',
    batchDisable: '/adminUser/batch-disable',
    batchEnable: '/adminUser/batch-enable',
    batchRestore: '/adminUser/batch-restore',
    assignRoles: (id: number | string) => `/adminUser/${id}/roles`,
    roleIds: (id: number | string) => `/adminUser/${id}/roles`,
    /** 当前登录用户的权限编码列表（含按钮级 system:xxx:update 等） */
    permissions: '/adminUser/permissions',
  },

  // ==================== 角色 ====================
  role: {
    list: '/role',
    create: '/role',
    all: '/role/all',
    detail: (id: number | string) => `/role/${id}`,
    update: (id: number | string) => `/role/${id}`,
    delete: (id: number | string) => `/role/${id}`,
    disable: (id: number | string) => `/role/${id}/disable`,
    enable: (id: number | string) => `/role/${id}/enable`,
    batchDisable: '/role/batch-disable',
    batchEnable: '/role/batch-enable',
    assignPermissions: (id: number | string) => `/role/${id}/permissions`,
    permissionIds: (id: number | string) => `/role/${id}/permissions`,
  },

  // ==================== 权限 ====================
  permission: {
    tree: '/permission/tree',
    menus: '/permission/menus',
    create: '/permission',
    detail: (id: number | string) => `/permission/${id}`,
    update: (id: number | string) => `/permission/${id}`,
    delete: (id: number | string) => `/permission/${id}`,
  },

  // ==================== 登录日志 ====================
  loginLog: {
    list: '/adminLoginLog',
  },

} as const
