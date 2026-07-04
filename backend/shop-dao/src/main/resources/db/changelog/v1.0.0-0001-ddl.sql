-- 数据库表结构变更
-- 添加索引和约束
ALTER TABLE `product` ADD CONSTRAINT `fk_category_id` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`);

-- 添加状态枚举
ALTER TABLE `product` MODIFY COLUMN `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0-下架,1-上架';

-- 添加订单状态枚举
ALTER TABLE `order` MODIFY COLUMN `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态:0-待付款,1-已付款,2-已发货,3-已完成,4-已取消';

-- 添加支付方式枚举
ALTER TABLE `order` MODIFY COLUMN `payment_method` varchar(20) DEFAULT NULL COMMENT '支付方式:alipay-支付宝,wechat-微信';

-- 添加用户状态枚举
ALTER TABLE `user` MODIFY COLUMN `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0-禁用,1-正常';

-- 添加分类状态枚举
ALTER TABLE `category` MODIFY COLUMN `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态:0-禁用,1-正常';

-- 添加索引优化
CREATE INDEX `idx_product_status` ON `product` (`status`);
CREATE INDEX `idx_order_status` ON `order` (`status`);
CREATE INDEX `idx_category_status` ON `category` (`status`);
