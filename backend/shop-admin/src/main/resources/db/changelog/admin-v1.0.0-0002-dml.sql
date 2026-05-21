-- liquibase formatted sql

-- =====================================================
-- 初始化管理员数据（密码: admin123）
-- =====================================================
-- changeset shop:1.0.0-insert-admin-user-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_user (username, password, real_name, status) VALUES
('admin', 'admin123', '超级管理员', 1);

INSERT IGNORE INTO t_admin_user (username, password, real_name, status) VALUES
('manager', 'admin123', '运营管理员', 1);

-- =====================================================
-- 初始化角色数据
-- =====================================================
-- changeset shop:1.0.0-insert-role-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_role (id, role_name, role_code, description, sort_order, status) VALUES
(1, '超级管理员', 'super_admin', '拥有系统所有权限', 1, 1),
(2, '运营管理员', 'operator', '负责商品和订单运营管理', 2, 1),
(3, '客服人员', 'customer_service', '负责订单和用户咨询处理', 3, 1);

-- =====================================================
-- 初始化权限数据 - 菜单
-- =====================================================
-- changeset shop:1.0.0-insert-permission-menu-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status) VALUES
-- 一级菜单
(1,  0, '系统管理', 'system',         1, '/system',         'setting',   NULL,                  1, 1, 1),
(2,  0, '商品管理', 'product',         1, '/product',        'shopping',  NULL,                  2, 1, 1),
(3,  0, '订单管理', 'order',           1, '/order',          'list',      NULL,                  3, 1, 1),
(4,  0, '用户管理', 'user',            1, '/user',           'user',      NULL,                  4, 1, 1),
-- 二级菜单 - 系统管理
(10, 1, '管理员管理', 'system:admin',   1, '/system/admin',   'user',      'system/AdminUser',   1, 1, 1),
(11, 1, '角色管理',   'system:role',    1, '/system/role',    'peoples',   'system/Role',        2, 1, 1),
(12, 1, '权限管理',   'system:permission', 1, '/system/permission', 'lock', 'system/Permission', 3, 1, 1),
-- 二级菜单 - 商品管理
(20, 2, '商品列表',   'product:list',   1, '/product/list',   'component', 'product/ProductList', 1, 1, 1),
(21, 2, '分类管理',   'product:category', 1, '/product/category', 'tree', 'product/Category',   2, 1, 1),
-- 二级菜单 - 订单管理
(30, 3, '订单列表',   'order:list',     1, '/order/list',     'documentation', 'order/OrderList', 1, 1, 1),
-- 二级菜单 - 用户管理
(40, 4, '用户列表',   'user:list',      1, '/user/list',      'peoples',   'user/UserList',      1, 1, 1);

-- =====================================================
-- 初始化权限数据 - 按钮
-- =====================================================
-- changeset shop:1.0.0-insert-permission-button-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, sort_order, visible, status) VALUES
-- 管理员管理按钮
(100, 10, '创建管理员', 'system:admin:create',  2, 1, 1, 1),
(101, 10, '编辑管理员', 'system:admin:update',  2, 2, 1, 1),
(102, 10, '删除管理员', 'system:admin:delete',  2, 3, 1, 1),
(103, 10, '查看管理员', 'system:admin:query',   2, 4, 1, 1),
-- 角色管理按钮
(110, 11, '创建角色',   'system:role:create',   2, 1, 1, 1),
(111, 11, '编辑角色',   'system:role:update',   2, 2, 1, 1),
(112, 11, '删除角色',   'system:role:delete',   2, 3, 1, 1),
(113, 11, '查看角色',   'system:role:query',    2, 4, 1, 1),
(114, 11, '分配权限',   'system:role:assign',   2, 5, 1, 1),
-- 权限管理按钮
(120, 12, '创建权限',   'system:permission:create', 2, 1, 1, 1),
(121, 12, '编辑权限',   'system:permission:update', 2, 2, 1, 1),
(122, 12, '删除权限',   'system:permission:delete', 2, 3, 1, 1),
(123, 12, '查看权限',   'system:permission:query',  2, 4, 1, 1),
-- 商品管理按钮
(200, 20, '添加商品',   'product:create',       2, 1, 1, 1),
(201, 20, '编辑商品',   'product:update',       2, 2, 1, 1),
(202, 20, '删除商品',   'product:delete',       2, 3, 1, 1),
(203, 20, '查看商品',   'product:query',        2, 4, 1, 1),
-- 分类管理按钮
(210, 21, '创建分类',   'product:category:create', 2, 1, 1, 1),
(211, 21, '编辑分类',   'product:category:update', 2, 2, 1, 1),
(212, 21, '删除分类',   'product:category:delete', 2, 3, 1, 1),
-- 订单管理按钮
(300, 30, '查看订单',   'order:query',          2, 1, 1, 1),
(301, 30, '更新订单状态', 'order:update',        2, 2, 1, 1),
-- 用户管理按钮
(400, 40, '查看用户',   'user:query',           2, 1, 1, 1),
(401, 40, '编辑用户',   'user:update',          2, 2, 1, 1),
(402, 40, '删除用户',   'user:delete',          2, 3, 1, 1);

-- =====================================================
-- 初始化角色权限关联 - 超级管理员拥有所有权限
-- =====================================================
-- changeset shop:1.0.0-insert-super-admin-role-permission context:admin stripComments:false
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id)
SELECT 1, id FROM t_admin_permission WHERE status = 1;

-- =====================================================
-- 初始化角色权限关联 - 运营管理员
-- =====================================================
-- changeset shop:1.0.0-insert-operator-role-permission context:admin stripComments:false
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 商品管理菜单及按钮
(2, 2), (2, 20), (2, 21), (2, 200), (2, 201), (2, 202), (2, 203), (2, 210), (2, 211), (2, 212),
-- 订单管理菜单及按钮
(2, 3), (2, 30), (2, 300), (2, 301),
-- 用户管理菜单及按钮（只读）
(2, 4), (2, 40), (2, 400);

-- =====================================================
-- 初始化角色权限关联 - 客服人员
-- =====================================================
-- changeset shop:1.0.0-insert-customer-service-role-permission context:admin stripComments:false
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 订单管理菜单及按钮（只读）
(3, 3), (3, 30), (3, 300),
-- 用户管理菜单及按钮（只读）
(3, 4), (3, 40), (3, 400);

-- =====================================================
-- 初始化用户角色关联
-- =====================================================
-- changeset shop:1.0.0-insert-user-role-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2);
