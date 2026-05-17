-- liquibase formatted sql

-- 插入商品分类数据
-- changeset shop:1.0.0-insert-category-data stripComments:false
INSERT INTO t_category (name, description, sort, status) VALUES ('电子产品', '各类电子产品', 1, 1);
INSERT INTO t_category (name, description, sort, status) VALUES ('服装鞋帽', '各类服装鞋帽', 2, 1);
INSERT INTO t_category (name, description, sort, status) VALUES ('食品饮料', '各类食品饮料', 3, 1);
INSERT INTO t_category (name, description, sort, status) VALUES ('家居用品', '各类家居用品', 4, 1);
INSERT INTO t_category (name, description, sort, status) VALUES ('图书音像', '各类图书音像', 5, 1);

-- 插入商品数据
-- changeset shop:1.0.0-insert-product-data stripComments:false
INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('智能手机', '高性能智能手机', 3999.00, 100, 'https://example.com/phone.jpg', 1, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('笔记本电脑', '轻薄笔记本电脑', 5999.00, 50, 'https://example.com/laptop.jpg', 1, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('无线耳机', '蓝牙无线耳机', 299.00, 200, 'https://example.com/earphone.jpg', 1, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('男士T恤', '纯棉男士T恤', 99.00, 300, 'https://example.com/tshirt.jpg', 2, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('运动鞋', '舒适运动鞋', 399.00, 150, 'https://example.com/shoes.jpg', 2, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('休闲裤', '时尚休闲裤', 199.00, 200, 'https://example.com/pants.jpg', 2, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('零食礼包', '精选零食礼包', 99.00, 500, 'https://example.com/snacks.jpg', 3, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('饮料组合', '多款饮料组合', 49.00, 800, 'https://example.com/drinks.jpg', 3, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('床上四件套', '舒适床上四件套', 299.00, 100, 'https://example.com/bedding.jpg', 4, 1, 0);

INSERT INTO t_product (name, description, price, stock, image, category_id, status, sales) VALUES
('收纳箱', '大容量收纳箱', 59.00, 300, 'https://example.com/storage.jpg', 4, 1, 0);

-- 插入用户数据
-- changeset shop:1.0.0-insert-user-data stripComments:false
INSERT INTO t_user (username, password, nickname, phone, email, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', '13800138000', 'admin@shop.com', 1);

INSERT INTO t_user (username, password, nickname, phone, email, status) VALUES
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '用户1', '13800138001', 'user1@shop.com', 1);

INSERT INTO t_user (username, password, nickname, phone, email, status) VALUES
('user2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '用户2', '13800138002', 'user2@shop.com', 1);
