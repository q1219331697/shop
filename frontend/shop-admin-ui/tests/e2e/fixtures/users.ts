// E2E 测试数据编码规则：e2e_<文件简码>_<案例简码>_<唯一后缀>，禁止自定义前缀
export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com'
  },
  user: {
    username: 'user',
    password: 'user123',
    email: 'user@example.com'
  },
  invalid: {
    username: 'invalid',
    password: 'wrongpassword',
    email: 'invalid@example.com'
  }
}
