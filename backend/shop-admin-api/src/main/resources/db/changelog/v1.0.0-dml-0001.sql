-- liquibase formatted sql

INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1);

INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1);

INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status, create_time, update_time) VALUES
-- 10: 系统管理 (顶级)
(10, 0, '系统管理', 'system', 1, '/system', 'Setting', NULL, 1, 1, 1, NOW(), NOW()),
(1001, 10, '用户管理', 'system:user', 1, '/system/user', 'User', 'views/system/user/index.vue', 1, 1, 1, NOW(), NOW()),
(1002, 10, '角色管理', 'system:role', 1, '/system/role', 'UserFilled', 'views/system/role/index.vue', 2, 1, 1, NOW(), NOW()),
(1003, 10, '权限管理', 'system:permission', 1, '/system/permission', 'Lock', 'views/system/permission/index.vue', 3, 1, 1, NOW(), NOW()),
(1004, 1001, '用户列表', 'system:user:list', 2, '/system/user/list', NULL, 'views/system/user/index.vue', 1, 1, 1, NOW(), NOW()),
(1005, 1001, '用户详情', 'system:user:detail', 2, NULL, NULL, 'views/system/user/detail.vue', 1, 1, 1, NOW(), NOW()),
(1006, 1001, '创建用户', 'system:user:create', 2, NULL, NULL, 'views/system/user/form.vue', 1, 1, 1, NOW(), NOW()),
(1007, 1001, '更新用户', 'system:user:update', 2, NULL, NULL, 'views/system/user/form.vue', 1, 1, 1, NOW(), NOW()),
(1008, 1001, '删除用户', 'system:user:delete', 2, NULL, NULL, 'views/system/user/index.vue', 1, 1, 1, NOW(), NOW()),
(1009, 1002, '角色列表', 'system:role:list', 2, '/system/role/list', NULL, 'views/system/role/index.vue', 1, 1, 1, NOW(), NOW()),
(1010, 1002, '创建角色', 'system:role:create', 2, NULL, NULL, 'views/system/role/form.vue', 1, 1, 1, NOW(), NOW()),
(1011, 1002, '更新角色', 'system:role:update', 2, NULL, NULL, 'views/system/role/form.vue', 1, 1, 1, NOW(), NOW()),
(1012, 1002, '删除角色', 'system:role:delete', 2, NULL, NULL, 'views/system/role/index.vue', 1, 1, 1, NOW(), NOW()),
(1013, 1003, '权限列表', 'system:permission:list', 2, '/system/permission/list', NULL, 'views/system/permission/index.vue', 1, 1, 1, NOW(), NOW()),
(1014, 1003, '创建权限', 'system:permission:create', 2, NULL, NULL, 'views/system/permission/form.vue', 1, 1, 1, NOW(), NOW()),
(1015, 1003, '更新权限', 'system:permission:update', 2, NULL, NULL, 'views/system/permission/form.vue', 1, 1, 1, NOW(), NOW()),
(1016, 1003, '删除权限', 'system:permission:delete', 2, NULL, NULL, 'views/system/permission/index.vue', 1, 1, 1, NOW(), NOW()),

-- 20: 商品管理 (顶级)
(20, 0, '商品管理', 'product', 1, '/product', 'Goods', NULL, 2, 1, 1, NOW(), NOW()),
(2001, 20, '商品列表', 'product:list', 2, '/product/list', 'List', 'views/product/list/index.vue', 1, 1, 1, NOW(), NOW()),
(2002, 20, '商品详情', 'product:detail', 2, NULL, NULL, 'views/product/list/detail.vue', 1, 1, 1, NOW(), NOW()),
(2003, 20, '创建商品', 'product:create', 2, NULL, NULL, 'views/product/list/form.vue', 1, 1, 1, NOW(), NOW()),
(2004, 20, '更新商品', 'product:update', 2, NULL, NULL, 'views/product/list/form.vue', 1, 1, 1, NOW(), NOW()),
(2005, 20, '删除商品', 'product:delete', 2, NULL, NULL, 'views/product/list/index.vue', 1, 1, 1, NOW(), NOW()),
(2006, 20, '商品上架/下架', 'product:status', 2, NULL, NULL, 'views/product/list/index.vue', 1, 1, 1, NOW(), NOW()),

-- 30: 分类管理 (顶级)
(30, 0, '分类管理', 'category', 1, '/product/category', 'Menu', NULL, 3, 1, 1, NOW(), NOW()),
(3001, 30, '分类列表', 'category:list', 2, '/product/category/list', 'List', 'views/product/category/index.vue', 1, 1, 1, NOW(), NOW()),
(3002, 30, '分类详情', 'category:detail', 2, NULL, NULL, 'views/product/category/form.vue', 1, 1, 1, NOW(), NOW()),
(3003, 30, '创建分类', 'category:create', 2, NULL, NULL, 'views/product/category/form.vue', 1, 1, 1, NOW(), NOW()),
(3004, 30, '更新分类', 'category:update', 2, NULL, NULL, 'views/product/category/form.vue', 1, 1, 1, NOW(), NOW()),
(3005, 30, '删除分类', 'category:delete', 2, NULL, NULL, 'views/product/category/index.vue', 1, 1, 1, NOW(), NOW()),

-- 40: 订单管理 (顶级)
(40, 0, '订单管理', 'order', 1, '/order', 'Document', NULL, 4, 1, 1, NOW(), NOW()),
(4001, 40, '订单列表', 'order:list', 2, '/order/list', 'List', 'views/order/list/index.vue', 1, 1, 1, NOW(), NOW()),
(4002, 40, '订单详情', 'order:detail', 2, NULL, NULL, 'views/order/list/detail.vue', 1, 1, 1, NOW(), NOW()),
(4003, 40, '更新订单状态', 'order:update', 2, NULL, NULL, 'views/order/list/index.vue', 1, 1, 1, NOW(), NOW()),
(4004, 40, '订单发货', 'order:ship', 2, NULL, NULL, 'views/order/list/index.vue', 1, 1, 1, NOW(), NOW()),
(4005, 40, '订单退款', 'order:refund', 2, NULL, NULL, 'views/order/list/index.vue', 1, 1, 1, NOW(), NOW()),

-- 50: 仪表盘 (顶级)
(50, 0, '仪表盘', 'dashboard', 1, '/dashboard', 'Odometer', NULL, 5, 1, 1, NOW(), NOW()),
(5001, 50, '仪表盘', 'dashboard:overview', 2, '/dashboard', NULL, 'views/dashboard/index.vue', 1, 1, 1, NOW(), NOW());

INSERT IGNORE INTO t_admin_user_role (user_id, role_id, create_time) VALUES
(1, 1, NOW());

INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 系统管理 (10-1016)
(1, 10), (1, 1001), (1, 1002), (1, 1003), (1, 1004), (1, 1005), (1, 1006), (1, 1007), (1, 1008),
(1, 1009), (1, 1010), (1, 1011), (1, 1012),
(1, 1013), (1, 1014), (1, 1015), (1, 1016),
-- 商品管理 (20-2006)
(1, 20), (1, 2001), (1, 2002), (1, 2003), (1, 2004), (1, 2005), (1, 2006),
-- 分类管理 (30-3005)
(1, 30), (1, 3001), (1, 3002), (1, 3003), (1, 3004), (1, 3005),
-- 订单管理 (40-4005)
(1, 40), (1, 4001), (1, 4002), (1, 4003), (1, 4004), (1, 4005),
-- 仪表盘 (50, 5001)
(1, 50), (1, 5001);