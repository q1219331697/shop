-- liquibase formatted sql
-- changeset admin:v1.0.0-dml-0001
--
-- 约定（开发阶段）：本文件是初始化种子数据的唯一来源，新增/调整初始数据请【直接修改本文件的 INSERT】，不要再新增 v1.0.0-dml-000x 文件。
-- 原因：开发环境以 drop-first 启动，每次删库重建、从头执行本 changeset，历史增量文件只会造成膨胀且用不到。
-- 写法：只用 INSERT 写入（保持 id 稳定便于外键关联），非默认字段（如 log_flag=0）在 INSERT 里直接写死，不要事后 UPDATE/DELETE 去改已存在的数据。生产如需增量迁移再单独评估。

INSERT IGNORE INTO t_admin_user (id, username, password, real_name, status) VALUES
(1, 'admin', 'admin123', '超级管理员', 1);

INSERT IGNORE INTO t_admin_role (id, role_name, description, sort_order, status) VALUES
(1, '超级管理员', '拥有系统所有权限', 1, 1);

-- 权限数据（目录 + 菜单 + 任务页 + 操作权限点）
-- 节点类型约定：
--   type=1 目录：仅作导航分组，permission_code 为 NULL，不参与授权
--   type=2 菜单/任务页：visible=1 显示在侧边栏；visible=0 为隐藏任务页（可路由，不进侧边栏）
--   type=3 操作权限点：仅授权点，path/component 均为 NULL
-- 菜单节点不携带权限码：其「查看/访问」能力由下级的「XX列表」权限点承载。
-- 这样在授权树上勾菜单可一键全选，同时也能单独授予「只查看」，两者兼得。
-- id 编码规则：父id + 2位序号，逐层拼接（如 4 → 401 → 40101）；同一父节点下序号连续，与 sort_order 对齐
-- log_flag: 1-记录操作日志, 0-不记录。开发阶段库每次重建，直接在此初始化，勿用后续 UPDATE 反复改。
INSERT IGNORE INTO t_admin_permission (id, parent_id, permission_name, permission_code, permission_type, path, icon, component, sort_order, visible, status, log_flag) VALUES
-- 订单管理（目录 + 列表页）
(1, 0, '订单管理', NULL, 1, '/order', 'Document', NULL, 1, 1, 1, 1),
(101, 1, '订单列表', 'order:list', 2, '/order/list', 'List', 'views/order/list/index.vue', 1, 1, 1, 1),
-- 商品管理（目录 + 列表页 + 分类页）
(2, 0, '商品管理', NULL, 1, '/product', 'Goods', NULL, 2, 1, 1, 1),
(201, 2, '商品列表', 'product:list', 2, '/product/list', 'List', 'views/product/list/index.vue', 1, 1, 1, 1),
(202, 2, '商品分类', 'product:category', 2, '/product/category', 'Menu', 'views/product/category/index.vue', 2, 1, 1, 1),
-- 会员管理（目录 + 列表页，功能待开发）
(3, 0, '会员管理', NULL, 1, '/member', 'User', NULL, 3, 1, 1, 1),
(301, 3, '会员列表', 'member:list', 2, '/member/list', 'List', 'views/member/list/index.vue', 1, 1, 1, 1),
-- 系统管理（目录）
(4, 0, '系统管理', NULL, 1, '/system', 'Setting', NULL, 4, 1, 1, 1),
-- 管理员管理（菜单 + 列表权限点 + 隐藏任务页 + 操作权限点）
(401, 4, '管理员管理', NULL, 2, '/system/admin', 'User', 'views/system/admin/index.vue', 1, 1, 1, 1),
(40101, 401, '管理员列表', 'system:admin:list', 3, NULL, NULL, NULL, 1, 1, 1, 1),
(40102, 401, '管理员详情', 'system:admin:detail', 2, '/system/admin/detail/:id', NULL, 'views/system/admin/AdminDetailPage.vue', 2, 0, 1, 1),
(40103, 401, '新增管理员', 'system:admin:create', 2, '/system/admin/create', NULL, 'views/system/admin/AdminFormPage.vue', 3, 0, 1, 1),
(40104, 401, '编辑管理员', 'system:admin:update', 2, '/system/admin/edit/:id', NULL, 'views/system/admin/AdminFormPage.vue', 4, 0, 1, 1),
(40105, 401, '管理员删除', 'system:admin:delete', 3, NULL, NULL, NULL, 5, 1, 1, 1),
(40106, 401, '分配角色', 'system:admin:assign-role', 2, '/system/admin/assign-role/:id', NULL, 'views/system/admin/AssignRolePage.vue', 6, 0, 1, 1),
(40107, 401, '重置密码', 'system:admin:reset-password', 3, NULL, NULL, NULL, 7, 1, 1, 1),
(40108, 401, '禁用管理员', 'system:admin:disable', 3, NULL, NULL, NULL, 8, 1, 1, 1),
(40109, 401, '启用管理员', 'system:admin:enable', 3, NULL, NULL, NULL, 9, 1, 1, 1),
(40110, 401, '恢复管理员', 'system:admin:restore', 3, NULL, NULL, NULL, 10, 1, 1, 1),
(40111, 401, '解锁管理员', 'system:admin:unlock', 3, NULL, NULL, NULL, 11, 1, 1, 1),
(40112, 401, 'E2E测试清理', 'system:admin:cleanup', 3, NULL, NULL, NULL, 12, 0, 1, 0),
-- 角色管理（菜单 + 列表权限点 + 隐藏任务页 + 操作权限点）
(402, 4, '角色管理', NULL, 2, '/system/role', 'UserFilled', 'views/system/role/index.vue', 2, 1, 1, 1),
(40201, 402, '角色列表', 'system:role:list', 3, NULL, NULL, NULL, 1, 1, 1, 1),
(40202, 402, '新增角色', 'system:role:create', 2, '/system/role/create', NULL, 'views/system/role/RoleFormPage.vue', 2, 0, 1, 1),
(40203, 402, '编辑角色', 'system:role:update', 2, '/system/role/edit/:id', NULL, 'views/system/role/RoleFormPage.vue', 3, 0, 1, 1),
(40204, 402, '角色删除', 'system:role:delete', 3, NULL, NULL, NULL, 4, 1, 1, 1),
(40205, 402, '分配权限', 'system:role:assign', 2, '/system/role/assign-permission/:id', NULL, 'views/system/role/AssignPermissionPage.vue', 5, 0, 1, 1),
(40206, 402, '禁用角色', 'system:role:disable', 3, NULL, NULL, NULL, 6, 1, 1, 1),
(40207, 402, '启用角色', 'system:role:enable', 3, NULL, NULL, NULL, 7, 1, 1, 1),
(40208, 402, '角色详情', 'system:role:detail', 2, '/system/role/detail/:id', NULL, 'views/system/role/RoleDetailPage.vue', 8, 0, 1, 1),
-- 权限管理（菜单 + 列表权限点 + 隐藏任务页 + 操作权限点）
(403, 4, '权限管理', NULL, 2, '/system/permission', 'Lock', 'views/system/permission/index.vue', 3, 1, 1, 1),
(40301, 403, '权限列表', 'system:permission:list', 3, NULL, NULL, NULL, 1, 1, 1, 1),
(40302, 403, '新增权限', 'system:permission:create', 2, '/system/permission/create', NULL, 'views/system/permission/PermissionFormPage.vue', 2, 0, 1, 1),
(40303, 403, '编辑权限', 'system:permission:update', 2, '/system/permission/edit/:id', NULL, 'views/system/permission/PermissionFormPage.vue', 3, 0, 1, 1),
(40304, 403, '权限删除', 'system:permission:delete', 3, NULL, NULL, NULL, 4, 1, 1, 1),
(40305, 403, '权限详情', 'system:permission:detail', 2, '/system/permission/detail/:id', NULL, 'views/system/permission/PermissionDetailPage.vue', 5, 0, 1, 1),
-- 操作日志（自身查询接口不记录操作日志，避免「查日志又产生日志」无限增长）
(404, 4, '操作日志', 'system:operationlog:list', 2, '/system/operationLog', 'Document', 'views/system/operationLog/index.vue', 4, 1, 1, 0),
-- 店铺设置（功能未实现，页面暂用占位页 views/shop/setting/index.vue）
(5, 0, '店铺设置', 'shop', 2, '/shop', 'Shop', 'views/shop/setting/index.vue', 5, 1, 1, 1),
-- 支付设置（功能未实现，页面暂用占位页 views/payment/setting/index.vue）
(6, 0, '支付设置', 'payment', 2, '/payment', 'CreditCard', 'views/payment/setting/index.vue', 6, 1, 1, 1);

INSERT IGNORE INTO t_admin_user_role (user_id, role_id) VALUES
(1, 1);

INSERT IGNORE INTO t_admin_role_permission (role_id, permission_id) VALUES
-- 顶级目录
(1, 1), (1, 2), (1, 3), (1, 4),
-- 订单 / 商品 / 会员
(1, 101), (1, 201), (1, 202), (1, 301),
-- 管理员管理
(1, 401), (1, 40101), (1, 40102), (1, 40103), (1, 40104), (1, 40105), (1, 40106), (1, 40107), (1, 40108), (1, 40109), (1, 40110),
(1, 40111), (1, 40112),
-- 角色管理
(1, 402), (1, 40201), (1, 40202), (1, 40203), (1, 40204), (1, 40205), (1, 40206), (1, 40207), (1, 40208),
-- 权限管理
(1, 403), (1, 40301), (1, 40302), (1, 40303), (1, 40304), (1, 40305),
-- 登录日志
(1, 404),
-- 店铺设置 / 支付设置
(1, 5), (1, 6);
