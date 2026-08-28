export const testRoles = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  // 种子测试角色（与 v1.0.0-dml-0002.sql 一致），不关联任何用户
  seed: [
    { id: 2, roleName: '测试角色', status: 1, deleted: false },
    { id: 3, roleName: '测试角色2', status: 1, deleted: false },
    { id: 4, roleName: '测试角色3', status: 0, deleted: false },
  ],
  // 新增/删除测试用的临时角色前缀
  tempPrefix: 'e2e_role_',
}
