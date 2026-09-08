// 管理员管理 E2E 测试数据：编码规则 e2e_u_<workerId>_<s|b>_<案例简码>_<唯一后缀>，禁止自定义前缀
export const testAdmin = {
  /** 模块简码（与数据编码规则、清理接口 e2e_ 前缀约定一致） */
  module: 'u' as const,
  /** 登录用例与造数/清理共用的超管账号 */
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  /** 登录失败用例专用：用户名不存在 */
  invalid: {
    username: 'invalid',
    password: 'wrongpassword',
  },
}
