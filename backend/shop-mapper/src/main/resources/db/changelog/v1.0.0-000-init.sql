-- liquibase formatted sql

-- 修改数据库字符集和排序规则
-- changeset shop:1.0.0-alter-database-charset
ALTER DATABASE shop
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;
