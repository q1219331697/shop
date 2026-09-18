/**
 * E2E 全局登录凭据（登录用例与造数/清理共用）。
 * 该账号为后端初始化的超管账号。
 */
export const testCredentials = {
  /** 登录用例与造数/清理共用的超管账号 */
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  /**
   * 管理员默认密码（后端 app.admin.default-password 的默认值）。
   * 用于两处：新增管理员不填密码时的初始密码、「重置密码」后的目标密码。
   */
  defaultAdminPassword: 'admin123',
}
