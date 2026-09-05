// 权限管理 E2E 测试数据编码规则：e2e_p_<worker>_<案例简码>_<唯一后缀>，禁止自定义前缀
export const testPermissions = {
  admin: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
  },
  /** 模块前缀（与清理接口 e2e_ 约定一致，权限名按此前缀物理删除） */
  prefix: 'e2e_p',
}
