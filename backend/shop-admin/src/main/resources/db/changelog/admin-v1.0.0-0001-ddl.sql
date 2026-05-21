-- liquibase formatted sql

-- =====================================================
-- 用户模块 - 后台管理用户表
-- =====================================================
-- changeset shop:1.0.0-create-admin-user-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '管理用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    name VARCHAR(50) COMMENT '姓名',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记：0-未删除，1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台管理用户表';

-- =====================================================
-- 用户模块 - 后台登录日志表
-- =====================================================
-- changeset shop:1.0.0-create-admin-login-log-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_login_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    user_id BIGINT COMMENT '管理用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    login_time DATETIME NOT NULL COMMENT '登录时间',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-失败，1-成功',
    message VARCHAR(255) COMMENT '提示信息',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_user_id (user_id),
    KEY idx_username (username),
    KEY idx_login_time (login_time),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台登录日志表';

-- =====================================================
-- RBAC模型 - 角色表
-- =====================================================
-- changeset shop:1.0.0-create-admin-role-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记：0-未删除，1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_role_code (role_code),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台角色表';

-- =====================================================
-- RBAC模型 - 权限表（菜单+按钮级）
-- =====================================================
-- changeset shop:1.0.0-create-admin-permission-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
    parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '父权限ID，0为顶级',
    permission_name VARCHAR(50) NOT NULL COMMENT '权限名称',
    permission_code VARCHAR(100) NOT NULL COMMENT '权限编码',
    permission_type TINYINT NOT NULL COMMENT '类型：1-菜单，2-按钮',
    path VARCHAR(255) COMMENT '菜单路径/路由',
    icon VARCHAR(100) COMMENT '菜单图标',
    component VARCHAR(255) COMMENT '前端组件路径',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    visible TINYINT NOT NULL DEFAULT 1 COMMENT '是否可见：0-隐藏，1-显示',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记：0-未删除，1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_parent_id (parent_id),
    KEY idx_permission_code (permission_code),
    KEY idx_permission_type (permission_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台权限表';

-- =====================================================
-- RBAC模型 - 用户角色关联表
-- =====================================================
-- changeset shop:1.0.0-create-admin-user-role-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_user_id (user_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台用户角色关联表';

-- =====================================================
-- RBAC模型 - 角色权限关联表
-- =====================================================
-- changeset shop:1.0.0-create-admin-role-permission-table context:admin
CREATE TABLE IF NOT EXISTS t_admin_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_role_id (role_id),
    KEY idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='后台角色权限关联表';


