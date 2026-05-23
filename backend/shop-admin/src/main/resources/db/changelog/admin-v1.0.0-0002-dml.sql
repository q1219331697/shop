-- liquibase formatted sql

-- =====================================================
-- 初始化管理员数据（密码: admin123）
-- =====================================================
-- changeset shop:1.0.0-insert-admin-user-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1),
(2, 'manager', 'admin123', '运营管理员', 1),
(3, 'service', 'admin123', '客服人员', 1);

-- =====================================================
-- 初始化角色数据
-- =====================================================
-- changeset shop:1.0.0-insert-role-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1),
(2, '运营管理员', '负责商品和订单运营管理', 2, 1),
(3, '客服人员', '负责订单和用户咨询处理', 3, 1);

-- =====================================================
-- 初始化权限数据 - 菜单
-- =====================================================
-- changeset shop:1.0.0-insert-permission-menu-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status) VALUES
-- 一级菜单
(1,  0, '仪表盘',   'dashboard',       1, '/dashboard',      'Odometer',  'dashboard/index',    0, 1, 1),
(2,  0, '系统管理', 'system',          1, '/system',         'Setting',   NULL,                  1, 1, 1),
(3,  0, '商品管理', 'product',         1, '/product',        'Goods',     NULL,                  2, 1, 1),
(4,  0, '订单管理', 'order',           1, '/order',          'Document',  NULL,                  3, 1, 1),
-- 二级菜单 - 系统管理
(20, 2, '用户管理',   'system:admin',   1, 'user',            'User',      'system/user/index',   1, 1, 1),
(21, 2, '角色管理',   'system:role',    1, 'role',            'UserFilled', 'system/role/index',  2, 1, 1),
(22, 2, '权限管理',   'system:permission', 1, 'permission',   'Lock',      'system/permission/index', 3, 1, 1),
-- 二级菜单 - 商品管理
(30, 3, '商品列表',   'product:list',   1, 'list',            'List',      'product/list/index',  1, 1, 1),
(31, 3, '分类管理',   'product:category', 1, 'category',      'Menu',      'product/category/index', 2, 1, 1),
-- 二级菜单 - 订单管理
(40, 4, '订单列表',   'order:list',     1, 'list',            'List',      'order/list/index',   1, 1, 1);

-- =====================================================
-- 初始化权限数据 - 按钮
-- =====================================================
-- changeset shop:1.0.0-insert-permission-button-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, sort_order, visible, status) VALUES
-- 用户管理按钮（parentId=20）
(100, 20, '创建管理员', 'system:admin:create',  2, 1, 1, 1),
(101, 20, '编辑管理员', 'system:admin:update',  2, 2, 1, 1),
(102, 20, '删除管理员', 'system:admin:delete',  2, 3, 1, 1),
(103, 20, '查看管理员', 'system:admin:query',   2, 4, 1, 1),
-- 角色管理按钮（parentId=21）
(110, 21, '创建角色',   'system:role:create',   2, 1, 1, 1),
(111, 21, '编辑角色',   'system:role:update',   2, 2, 1, 1),
(112, 21, '删除角色',   'system:role:delete',   2, 3, 1, 1),
(113, 21, '查看角色',   'system:role:query',    2, 4, 1, 1),
(114, 21, '分配权限',   'system:role:assign',   2, 5, 1, 1),
-- 权限管理按钮（parentId=22）
(120, 22, '创建权限',   'system:permission:create', 2, 1, 1, 1),
(121, 22, '编辑权限',   'system:permission:update', 2, 2, 1, 1),
(122, 22, '删除权限',   'system:permission:delete', 2, 3, 1, 1),
(123, 22, '查看权限',   'system:permission:query',  2, 4, 1, 1),
-- 商品管理按钮（parentId=30）
(300, 30, '添加商品',     'product:create',       2, 1, 1, 1),
(301, 30, '编辑商品',     'product:update',       2, 2, 1, 1),
(302, 30, '删除商品',     'product:delete',       2, 3, 1, 1),
(303, 30, '查看商品',     'product:query',        2, 4, 1, 1),
-- 分类管理按钮（parentId=31）
(310, 31, '创建分类',     'product:category:create', 2, 1, 1, 1),
(311, 31, '编辑分类',     'product:category:update', 2, 2, 1, 1),
(312, 31, '删除分类',     'product:category:delete', 2, 3, 1, 1),
-- 订单管理按钮（parentId=40）
(400, 40, '查看订单',     'order:query',          2, 1, 1, 1),
(401, 40, '更新订单状态', 'order:update',         2, 2, 1, 1);

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
-- 仪表盘
(2, 1),
-- 系统管理菜单及按钮
(2, 2), (2, 20), (2, 21), (2, 22), (2, 100), (2, 101), (2, 102), (2, 103), (2, 110), (2, 111), (2, 112), (2, 113), (2, 114), (2, 120), (2, 121), (2, 122), (2, 123),
-- 商品管理菜单及按钮
(2, 3), (2, 30), (2, 31), (2, 300), (2, 301), (2, 302), (2, 303), (2, 310), (2, 311), (2, 312),
-- 订单管理菜单及按钮
(2, 4), (2, 40), (2, 400), (2, 401);

-- =====================================================
-- 初始化角色权限关联 - 客服人员
-- =====================================================
-- changeset shop:1.0.0-insert-customer-service-role-permission context:admin stripComments:false
INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 仪表盘
(3, 1),
-- 订单管理菜单及按钮（只读）
(3, 4), (3, 40), (3, 400),
-- 系统管理 - 用户管理（只读）
(3, 2), (3, 20), (3, 103);

-- =====================================================
-- 初始化用户角色关联
-- =====================================================
-- changeset shop:1.0.0-insert-user-role-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3);
