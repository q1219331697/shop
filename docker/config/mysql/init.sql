-- 删除 shop 数据库（如果存在）
DROP DATABASE IF EXISTS shop;

-- 重新创建 shop 数据库
CREATE DATABASE shop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 授权
GRANT ALL PRIVILEGES ON shop.* TO 'root'@'%';
FLUSH PRIVILEGES;