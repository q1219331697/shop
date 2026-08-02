-- liquibase formatted sql
-- changeset 1.0.0.0012-dml::insert-category-data::admin: insert category data
INSERT INTO `category` (`name`, `description`, `parent_id`, `sort`, `status`, `create_time`, `update_time`) VALUES
('电子产品', '各类电子产品', 0, 1, 1, NOW(), NOW());

-- changeset 1.0.0.0013-dml::insert-user-data::admin: insert user data
INSERT INTO `user` (`username`, `password`, `email`, `nickname`, `status`, `create_time`, `update_time`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVYITi', 'admin@example.com', '管理员', 1, NOW(), NOW());

-- changeset 1.0.0.0014-dml::insert-product-data::admin: insert product data
INSERT INTO `product` (`name`, `description`, `price`, `stock`, `image`, `category_id`, `status`, `create_time`, `update_time`) VALUES
('iPhone 14 Pro', '苹果最新款手机，搭载A16芯片', 7999.00, 100, '/images/iphone14.jpg', 1, 1, NOW(), NOW());

-- changeset 1.0.0.0015-dml::insert-admin-user-data::admin: insert admin user data
INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1);

-- changeset 1.0.0.0016-dml::insert-admin-role-data::admin: insert admin role data
INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1);

-- changeset 1.0.0.0016.1-dml::insert-admin-user-role-data::admin: insert admin user role data
INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1);

-- changeset 1.0.0.0017-dml::insert-admin-permission-data-1::admin: insert admin permission data (part 1)
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(1, 0, '仪表盘', 'dashboard', 1, '/dashboard', 'Odometer', 0, 1, 1, 0, NOW(), NOW()),
(2, 0, '系统管理', 'system', 1, '/system', 'Setting', 1, 1, 1, 0, NOW(), NOW()),
(3, 0, '商品管理', 'product', 1, '/product', 'ShoppingCart', 2, 1, 1, 0, NOW(), NOW()),
(4, 0, '订单管理', 'order', 1, '/order', 'Clock', 3, 1, 1, 0, NOW(), NOW()),
(5, 0, '会员管理', 'member', 1, '/member', 'User', 4, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0018-dml::insert-admin-permission-data-2::admin: insert admin permission data for system (part 2)
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(10, 2, '用户管理', 'system:admin', 1, 'user', 'User', 1, 1, 1, 0, NOW(), NOW()),
(11, 2, '角色管理', 'system:role', 1, 'role', 'Team', 2, 1, 1, 0, NOW(), NOW()),
(12, 2, '菜单管理', 'system:menu', 1, 'menu', 'Menu', 3, 1, 1, 0, NOW(), NOW()),
(13, 2, '部门管理', 'system:dept', 1, 'dept', 'Branches', 4, 1, 1, 0, NOW(), NOW()),
(14, 2, '参数设置', 'system:config', 1, 'config', 'Settings', 5, 1, 1, 0, NOW(), NOW()),
(15, 2, '系统监控', 'system:monitor', 1, 'monitor', 'Monitor', 6, 1, 1, 0, NOW(), NOW()),
(16, 2, '操作日志', 'system:log:operation', 1, 'log:operation', 'FileText', 7, 1, 1, 0, NOW(), NOW()),
(17, 2, '登录日志', 'system:log:login', 1, 'log:login', 'Key', 8, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0019-dml::insert-admin-permission-data-3::admin: insert admin permission data for products
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(20, 3, '商品列表', 'product:query', 1, 'list', 'List', 1, 1, 1, 0, NOW(), NOW()),
(21, 3, '商品分类', 'product:category', 1, 'category', 'Grid', 2, 1, 1, 0, NOW(), NOW()),
(22, 3, '库存管理', 'product:stock', 1, 'stock', 'Inventory', 3, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0020-dml::insert-admin-permission-data-4::admin: insert admin permission data for orders
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(30, 4, '订单列表', 'order:query', 1, 'list', 'List', 1, 1, 1, 0, NOW(), NOW()),
(31, 4, '订单详情', 'order:detail', 1, 'detail', 'View', 2, 1, 1, 0, NOW(), NOW()),
(32, 4, '订单退款', 'order:refund', 1, 'refund', 'Money', 3, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0021-dml::insert-admin-permission-data-5::admin: insert admin permission data for members
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(40, 5, '会员列表', 'member:query', 1, 'list', 'List', 1, 1, 1, 0, NOW(), NOW()),
(41, 5, '会员等级', 'member:level', 1, 'level', 'Medal', 2, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0022-dml::insert-admin-permission-data-6::admin: insert admin permission data for user management (part 2)
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(100, 10, '创建管理员', 'system:admin:create', 1, 'create', NULL, 1, 1, 1, 0, NOW(), NOW()),
(101, 10, '编辑管理员', 'system:admin:update', 1, 'edit', NULL, 2, 1, 1, 0, NOW(), NOW()),
(102, 10, '删除管理员', 'system:admin:delete', 1, 'delete', NULL, 3, 1, 1, 0, NOW(), NOW()),
(103, 10, '查看管理员', 'system:admin:query', 1, 'query', NULL, 4, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0023-dml::insert-admin-permission-data-7::admin: insert admin permission data for role management
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(110, 11, '创建角色', 'system:role:create', 1, 'create', NULL, 1, 1, 1, 0, NOW(), NOW()),
(111, 11, '编辑角色', 'system:role:update', 1, 'edit', NULL, 2, 1, 1, 0, NOW(), NOW()),
(112, 11, '删除角色', 'system:role:delete', 1, 'delete', NULL, 3, 1, 1, 0, NOW(), NOW()),
(113, 11, '查看角色', 'system:role:query', 1, 'query', NULL, 4, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0024-dml::insert-admin-permission-data-8::admin: insert admin permission data for menu management
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(120, 12, '创建菜单', 'system:menu:create', 1, 'create', NULL, 1, 1, 1, 0, NOW(), NOW()),
(121, 12, '编辑菜单', 'system:menu:update', 1, 'edit', NULL, 2, 1, 1, 0, NOW(), NOW()),
(122, 12, '删除菜单', 'system:menu:delete', 1, 'delete', NULL, 3, 1, 1, 0, NOW(), NOW()),
(123, 12, '查看菜单', 'system:menu:query', 1, 'query', NULL, 4, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0025-dml::insert-admin-permission-data-9::admin: insert admin permission data for dept management
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(130, 13, '创建部门', 'system:dept:create', 1, 'create', NULL, 1, 1, 1, 0, NOW(), NOW()),
(131, 13, '编辑部门', 'system:dept:update', 1, 'edit', NULL, 2, 1, 1, 0, NOW(), NOW()),
(132, 13, '删除部门', 'system:dept:delete', 1, 'delete', NULL, 3, 1, 1, 0, NOW(), NOW()),
(133, 13, '查看部门', 'system:dept:query', 1, 'query', NULL, 4, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0026-dml::insert-admin-permission-data-10::admin: insert admin permission data for operation logs
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(140, 16, '查看日志', 'system:log:operation:query', 1, 'query', NULL, 1, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0027-dml::insert-admin-permission-data-11::admin: insert admin permission data for login logs
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, sort_order, visible, status, deleted, create_time, update_time) VALUES
(150, 17, '查看日志', 'system:log:login:query', 1, 'query', NULL, 1, 1, 1, 0, NOW(), NOW());

-- changeset 1.0.0.0028-dml::insert-admin-role-permission::admin: insert admin role permission relation
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17),
(1, 20), (1, 21), (1, 22),
(1, 30), (1, 31), (1, 32),
(1, 40), (1, 41),
(1, 100), (1, 101), (1, 102), (1, 103),
(1, 110), (1, 111), (1, 112), (1, 113),
(1, 120), (1, 121), (1, 122), (1, 123),
(1, 130), (1, 131), (1, 132), (1, 133),
(1, 140), (1, 150);