-- liquibase formatted sql
-- changeset admin:v1.0.0-dml-0001

INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1);

INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1);

-- 权限菜单数据
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status) VALUES
-- 订单管理（仅顶级目录，下级功能未实现暂不挂节点）
(1, 0, '订单管理', 'order', 1, '/order', 'Document', NULL, 1, 1, 1),
-- 商品管理（仅顶级目录，下级功能未实现暂不挂节点）
(2, 0, '商品管理', 'product', 1, '/product', 'Goods', NULL, 2, 1, 1),
-- 会员管理（仅顶级目录，下级功能未实现暂不挂节点）
(3, 0, '会员管理', 'member', 1, '/member', 'User', NULL, 3, 1, 1),
-- 系统管理
(4, 0, '系统管理', 'system', 1, '/system', 'Setting', NULL, 4, 1, 1),
-- 管理员管理（后台账号，区别于C端会员管理）
(401, 4, '管理员管理', 'system:admin', 2, '/system/admin', 'User', 'views/system/admin/index.vue', 1, 1, 1),
(40101, 401, '管理员列表', 'system:admin:list', 3, '/system/admin/list', NULL, 'views/system/admin/index.vue', 1, 1, 1),
(40102, 401, '管理员详情', 'system:admin:detail', 3, NULL, NULL, 'views/system/admin/detail.vue', 2, 1, 1),
(40103, 401, '管理员创建', 'system:admin:create', 3, NULL, NULL, 'views/system/admin/form.vue', 3, 1, 1),
(40104, 401, '管理员更新', 'system:admin:update', 3, NULL, NULL, 'views/system/admin/form.vue', 4, 1, 1),
(40105, 401, '管理员删除', 'system:admin:delete', 3, NULL, NULL, 'views/system/admin/index.vue', 5, 1, 1),
-- 角色管理
(402, 4, '角色管理', 'system:role', 2, '/system/role', 'UserFilled', 'views/system/role/index.vue', 2, 1, 1),
(40201, 402, '角色列表', 'system:role:list', 3, '/system/role/list', NULL, 'views/system/role/index.vue', 1, 1, 1),
(40202, 402, '角色创建', 'system:role:create', 3, NULL, NULL, 'views/system/role/form.vue', 2, 1, 1),
(40203, 402, '角色更新', 'system:role:update', 3, NULL, NULL, 'views/system/role/form.vue', 3, 1, 1),
(40204, 402, '角色删除', 'system:role:delete', 3, NULL, NULL, 'views/system/role/index.vue', 4, 1, 1),
(40205, 402, '角色分配权限', 'system:role:assign', 3, NULL, NULL, 'views/system/role/index.vue', 5, 1, 1),
-- 权限管理
(403, 4, '权限管理', 'system:permission', 2, '/system/permission', 'Lock', 'views/system/permission/index.vue', 3, 1, 1),
(40301, 403, '权限列表', 'system:permission:query', 3, '/system/permission/list', NULL, 'views/system/permission/index.vue', 1, 1, 1),
(40302, 403, '权限创建', 'system:permission:create', 3, NULL, NULL, 'views/system/permission/form.vue', 2, 1, 1),
(40303, 403, '权限更新', 'system:permission:update', 3, NULL, NULL, 'views/system/permission/form.vue', 3, 1, 1),
(40304, 403, '权限删除', 'system:permission:delete', 3, NULL, NULL, 'views/system/permission/index.vue', 4, 1, 1),
-- 登录日志
(404, 4, '登录日志', 'system:loginlog', 2, '/system/loginLog', 'Document', 'views/system/loginLog/index.vue', 4, 1, 1),
(40401, 404, '登录日志查询', 'system:loginlog:query', 3, '/system/loginLog/list', NULL, 'views/system/loginLog/index.vue', 1, 1, 1),
-- 店铺设置（功能未实现，页面暂用占位页 views/shop/setting/index.vue）
(5, 0, '店铺设置', 'shop', 2, '/shop', 'Shop', 'views/shop/setting/index.vue', 5, 1, 1),
-- 支付设置（功能未实现，页面暂用占位页 views/payment/setting/index.vue）
(6, 0, '支付设置', 'payment', 2, '/payment', 'CreditCard', 'views/payment/setting/index.vue', 6, 1, 1);

INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1);

INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 顶级菜单（含店铺设置 5、支付设置 6）
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
-- 用户管理
(1, 401), (1, 40101), (1, 40102), (1, 40103), (1, 40104), (1, 40105),
-- 角色管理
(1, 402), (1, 40201), (1, 40202), (1, 40203), (1, 40204), (1, 40205),
-- 权限管理
(1, 403), (1, 40301), (1, 40302), (1, 40303), (1, 40304),
-- 登录日志
(1, 404), (1, 40401);
