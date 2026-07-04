-- 初始化数据
-- 插入分类数据
INSERT INTO `category` (`name`, `description`, `parent_id`, `sort`, `status`, `create_time`, `update_time`) VALUES
('电子产品', '各类电子产品', 0, 1, 1, NOW(), NOW()),
('手机数码', '手机和数码产品', 1, 1, 1, NOW(), NOW()),
('电脑办公', '电脑和办公设备', 1, 2, 1, NOW(), NOW()),
('家用电器', '家用电器产品', 0, 2, 1, NOW(), NOW()),
('大家电', '大型家用电器', 4, 1, 1, NOW(), NOW()),
('生活日用', '日常生活用品', 0, 3, 1, NOW(), NOW());

-- 插入用户数据 (密码为123456的BCrypt加密值)
INSERT INTO `user` (`username`, `password`, `email`, `nickname`, `status`, `create_time`, `update_time`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVYITi', 'admin@example.com', '管理员', 1, NOW(), NOW()),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVYITi', 'user1@example.com', '用户一', 1, NOW(), NOW()),
('user2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVYITi', 'user2@example.com', '用户二', 1, NOW(), NOW());

-- 插入商品数据
INSERT INTO `product` (`name`, `description`, `price`, `stock`, `image`, `category_id`, `status`, `create_time`, `update_time`) VALUES
('iPhone 14 Pro', '苹果最新款手机，搭载A16芯片', 7999.00, 100, '/images/iphone14.jpg', 2, 1, NOW(), NOW()),
('MacBook Pro', '苹果专业级笔记本电脑', 12999.00, 50, '/images/macbook.jpg', 3, 1, NOW(), NOW()),
('小米13', '小米旗舰手机，徕卡影像', 4299.00, 200, '/images/xiaomi13.jpg', 2, 1, NOW(), NOW()),
('戴尔显示器', '27英寸4K显示器，专业设计', 1999.00, 80, '/images/dell-monitor.jpg', 3, 1, NOW(), NOW()),
('海尔冰箱', '对开门冰箱，大容量', 3999.00, 30, '/images/haier-fridge.jpg', 5, 1, NOW(), NOW()),
('美的空调', '1.5匹变频空调', 2499.00, 60, '/images/midea-ac.jpg', 5, 1, NOW(), NOW());

-- 插入购物车数据
INSERT INTO `cart` (`user_id`, `product_id`, `quantity`, `create_time`, `update_time`) VALUES
(2, 1, 1, NOW(), NOW()),
(2, 3, 2, NOW(), NOW()),
(3, 2, 1, NOW(), NOW()),
(3, 4, 1, NOW(), NOW());

-- 插入订单数据
INSERT INTO `order` (`order_no`, `user_id`, `total_amount`, `status`, `payment_method`, `shipping_address`, `create_time`, `update_time`) VALUES
('ORDER2023062800001', 2, 7999.00, 2, 'alipay', '北京市朝阳区XX路XX号', NOW(), NOW()),
('ORDER2023062800002', 3, 14998.00, 1, 'wechat', '上海市浦东新区XX路XX号', NOW(), NOW());

-- 插入订单项数据
INSERT INTO `order_item` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `create_time`, `update_time`) VALUES
(1, 1, 'iPhone 14 Pro', 7999.00, 1, NOW(), NOW()),
(2, 2, 'MacBook Pro', 12999.00, 1, NOW(), NOW()),
(2, 4, '戴尔显示器', 1999.00, 1, NOW(), NOW());
