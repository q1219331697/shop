-- liquibase formatted sql

-- 插入超级管理员数据（密码: admin123）
-- changeset shop:1.0.0-insert-admin-user-data context:admin stripComments:false
INSERT IGNORE INTO t_admin_user (username, password, nickname, phone, email, role, status) VALUES
('admin', 'admin123', '超级管理员', '13900139000', 'admin@shop.com', 1, 1);

INSERT IGNORE INTO t_admin_user (username, password, nickname, phone, email, role, status) VALUES
('manager', 'admin123', '运营管理员', '13900139001', 'manager@shop.com', 2, 1);
