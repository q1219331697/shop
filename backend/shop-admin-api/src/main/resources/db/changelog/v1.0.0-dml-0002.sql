-- liquibase formatted sql
-- changeset admin:v1.0.0-dml-0002

-- 补充角色分配权限（system:role:assign）与权限查询权限（system:permission:query）
-- 角色分配接口 RoleController.assignPermissions 依赖 system:role:assign
-- 权限树接口 PermissionController.tree 依赖 system:permission:query
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status) VALUES
(40205, 402, '角色分配权限', 'system:role:assign', 2, NULL, NULL, 'views/system/role/index.vue', 5, 1, 1),
(40305, 403, '权限查询', 'system:permission:query', 2, NULL, NULL, 'views/system/permission/index.vue', 5, 1, 1);

-- 为超级管理员角色（id=1）关联新增权限
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
(1, 40205),
(1, 40305);

-- 测试角色数据（不关联任何用户，便于 e2e 测试禁用/启用等，且不受"角色下存在用户无法删除"限制）
INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status, deleted) VALUES
(2, '测试角色', 'e2e测试角色', 1, 1, 0),
(3, '测试角色2', 'e2e测试角色2', 2, 1, 0),
(4, '测试角色3', 'e2e测试角色3', 3, 0, 0);
