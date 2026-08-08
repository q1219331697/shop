-- liquibase formatted sql
-- changeset admin:v1.0.0-dml-0001

INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1);

INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1);

-- 权限菜单数据
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status) VALUES
-- 订单管理
(1, 0, '订单管理', 'order', 1, '/order', 'Document', NULL, 1, 1, 1),
(101, 1, '订单列表', 'order:list', 2, '/order/list', 'List', 'views/order/index.vue', 1, 1, 1),
(102, 1, '订单详情', 'order:detail', 2, NULL, NULL, 'views/order/detail.vue', 2, 1, 1),
(103, 1, '订单发货', 'order:ship', 2, NULL, NULL, 'views/order/ship.vue', 3, 1, 1),
(104, 1, '订单退款', 'order:refund', 2, NULL, NULL, 'views/order/refund.vue', 4, 1, 1),
-- 商品管理
(2, 0, '商品管理', 'product', 1, '/product', 'Goods', NULL, 2, 1, 1),
(201, 2, '商品列表', 'product:list', 2, '/product/index', 'Goods', 'views/product/index.vue', 1, 1, 1),
(202, 2, '商品详情', 'product:detail', 2, NULL, NULL, 'views/product/detail.vue', 2, 1, 1),
(203, 2, '商品创建', 'product:create', 2, NULL, NULL, 'views/product/form.vue', 3, 1, 1),
(204, 2, '商品编辑', 'product:update', 2, NULL, NULL, 'views/product/form.vue', 4, 1, 1),
(205, 2, '商品删除', 'product:delete', 2, NULL, NULL, 'views/product/index.vue', 5, 1, 1),
(206, 2, '商品上下架', 'product:status', 2, NULL, NULL, 'views/product/index.vue', 6, 1, 1),
-- 会员管理
(3, 0, '会员管理', 'member', 1, '/member', 'User', NULL, 3, 1, 1),
(301, 3, '会员列表', 'member:list', 2, '/member/index', 'User', 'views/member/index.vue', 1, 1, 1),
(302, 3, '会员详情', 'member:detail', 2, NULL, NULL, 'views/member/detail.vue', 2, 1, 1),
(303, 3, '会员等级', 'member:level', 2, NULL, NULL, 'views/member/level.vue', 3, 1, 1),
-- 系统管理
(4, 0, '系统管理', 'system', 1, '/system', 'Setting', NULL, 4, 1, 1),
(401, 4, '用户管理', 'system:user', 1, '/system/user', 'User', 'views/system/user/index.vue', 1, 1, 1),
(40101, 401, '用户列表', 'system:user:list', 2, '/system/user/list', NULL, 'views/system/user/index.vue', 1, 1, 1),
(40102, 401, '用户详情', 'system:user:detail', 2, NULL, NULL, 'views/system/user/detail.vue', 2, 1, 1),
(40103, 401, '用户创建', 'system:user:create', 2, NULL, NULL, 'views/system/user/form.vue', 3, 1, 1),
(40104, 401, '用户更新', 'system:user:update', 2, NULL, NULL, 'views/system/user/form.vue', 4, 1, 1),
(40105, 401, '用户删除', 'system:user:delete', 2, NULL, NULL, 'views/system/user/index.vue', 5, 1, 1),
(402, 4, '角色管理', 'system:role', 1, '/system/role', 'UserFilled', 'views/system/role/index.vue', 2, 1, 1),
(40201, 402, '角色列表', 'system:role:list', 2, '/system/role/list', NULL, 'views/system/role/index.vue', 1, 1, 1),
(40202, 402, '角色创建', 'system:role:create', 2, NULL, NULL, 'views/system/role/form.vue', 2, 1, 1),
(40203, 402, '角色更新', 'system:role:update', 2, NULL, NULL, 'views/system/role/form.vue', 3, 1, 1),
(40204, 402, '角色删除', 'system:role:delete', 2, NULL, NULL, 'views/system/role/index.vue', 4, 1, 1),
(403, 4, '权限管理', 'system:permission', 1, '/system/permission', 'Lock', 'views/system/permission/index.vue', 3, 1, 1),
(40301, 403, '权限列表', 'system:permission:list', 2, '/system/permission/list', NULL, 'views/system/permission/index.vue', 1, 1, 1),
(40302, 403, '权限创建', 'system:permission:create', 2, NULL, NULL, 'views/system/permission/form.vue', 2, 1, 1),
(40303, 403, '权限更新', 'system:permission:update', 2, NULL, NULL, 'views/system/permission/form.vue', 3, 1, 1),
(40304, 403, '权限删除', 'system:permission:delete', 2, NULL, NULL, 'views/system/permission/index.vue', 4, 1, 1);

INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1);

INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 订单管理
(1, 1), (1, 101), (1, 102), (1, 103), (1, 104),
-- 商品管理
(1, 2), (1, 201), (1, 202), (1, 203), (1, 204), (1, 205), (1, 206),
-- 会员管理
(1, 3), (1, 301), (1, 302), (1, 303),
-- 系统管理
(1, 4), (1, 401), (1, 40101), (1, 40102), (1, 40103), (1, 40104), (1, 40105),
(1, 402), (1, 40201), (1, 40202), (1, 40203), (1, 40204),
(1, 403), (1, 40301), (1, 40302), (1, 40303), (1, 40304);
