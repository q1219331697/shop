-- liquibase formatted sql
-- changeset admin:v1.0.0-ddl-0001
--
-- 约定（开发阶段）：本文件是建库的唯一来源，新增表/字段请【直接修改本文件】，不要再新增 v1.0.0-ddl-000x 文件。
-- 原因：开发环境每次启动都重建数据库（drop-first 或清空卷），Liquibase 会从头执行本 changeset，
--        历史增量文件（0002/0003…）只会造成文件膨胀且永远用不到。生产如需增量迁移再单独评估。

CREATE TABLE IF NOT EXISTS t_admin_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态(0:禁用 1:启用)',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记(0:未删除 1:已删除)',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员用户表';

CREATE TABLE IF NOT EXISTS t_admin_operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id BIGINT DEFAULT NULL COMMENT '操作人ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '操作人用户名',
    operation_type TINYINT NOT NULL DEFAULT 7 COMMENT '操作类型(1:登录 2:登出 3:新增 4:修改 5:删除 6:查询 7:其它)',
    module VARCHAR(50) DEFAULT NULL COMMENT '所属模块(菜单名)',
    operation VARCHAR(100) DEFAULT NULL COMMENT '操作名称',
    permission_code VARCHAR(100) DEFAULT NULL COMMENT '操作对应权限编码',
    request_method VARCHAR(10) DEFAULT NULL COMMENT 'HTTP方法',
    request_uri VARCHAR(255) DEFAULT NULL COMMENT '请求URI',
    class_method VARCHAR(255) DEFAULT NULL COMMENT '类#方法',
    request_params VARCHAR(2000) DEFAULT NULL COMMENT '请求参数(脱敏并截断)',
    response_data VARCHAR(2000) DEFAULT NULL COMMENT '响应结果(脱敏并截断)',
    ip VARCHAR(50) DEFAULT NULL COMMENT '操作IP',
    duration INT DEFAULT NULL COMMENT '耗时(毫秒)',
    success TINYINT NOT NULL DEFAULT 1 COMMENT '是否成功(0:失败 1:成功)',
    message VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
    operation_time DATETIME NOT NULL COMMENT '操作时间',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_user_id (user_id),
    KEY idx_username (username),
    KEY idx_permission_code (permission_code),
    KEY idx_operation_type (operation_type),
    KEY idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员操作日志表';

CREATE TABLE IF NOT EXISTS t_admin_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    description VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态(0:禁用 1:启用)',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记(0:未删除 1:已删除)',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员角色表';

CREATE TABLE IF NOT EXISTS t_admin_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '父权限ID',
    permission_name VARCHAR(50) NOT NULL COMMENT '权限名称',
    permission_code VARCHAR(100) DEFAULT NULL COMMENT '权限编码(目录为NULL，其余唯一)',
    permission_type TINYINT NOT NULL COMMENT '类型(1:目录 2:菜单/任务页 3:操作按钮)',
    path VARCHAR(255) DEFAULT NULL COMMENT '路由路径(仅type=1/2有效)',
    icon VARCHAR(100) DEFAULT NULL COMMENT '图标',
    component VARCHAR(255) DEFAULT NULL COMMENT '组件路径(仅type=2有效)',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    visible TINYINT NOT NULL DEFAULT 1 COMMENT '侧边栏可见(0:隐藏任务页 1:显示)',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态(0:禁用 1:启用)',
    log_flag TINYINT NOT NULL DEFAULT 1 COMMENT '是否记录操作日志(0:否 1:是)',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '删除标记(0:未删除 1:已删除)',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_permission_code (permission_code, deleted),
    KEY idx_parent_id (parent_id),
    KEY idx_permission_type (permission_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员权限表(目录+菜单+任务页+操作按钮)';

CREATE TABLE IF NOT EXISTS t_admin_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_user_id (user_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员用户角色关联表';

CREATE TABLE IF NOT EXISTS t_admin_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_role_id (role_id),
    KEY idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员角色权限关联表';
