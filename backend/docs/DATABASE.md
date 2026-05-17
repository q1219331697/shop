# 数据库设计文档

## 数据库表结构

### 1. 用户表 (t_user)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 用户ID | 主键，自增 |
| username | VARCHAR(50) | 用户名 | 唯一索引 |
| password | VARCHAR(100) | 密码 | 加密存储 |
| nickname | VARCHAR(50) | 昵称 | |
| phone | VARCHAR(20) | 手机号 | 索引 |
| email | VARCHAR(100) | 邮箱 | 索引 |
| avatar | VARCHAR(255) | 头像 | |
| status | TINYINT | 状态 | 0-禁用，1-正常，2-锁定 |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2. 商品分类表 (t_category)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 分类ID | 主键，自增 |
| name | VARCHAR(50) | 分类名称 | |
| description | VARCHAR(255) | 分类描述 | |
| sort | INT | 排序 | 索引 |
| status | TINYINT | 状态 | 0-禁用，1-启用 |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 3. 商品表 (t_product)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 商品ID | 主键，自增 |
| name | VARCHAR(100) | 商品名称 | |
| description | TEXT | 商品描述 | |
| price | DECIMAL(10,2) | 商品价格 | |
| stock | INT | 库存数量 | |
| image | VARCHAR(255) | 商品图片 | |
| category_id | BIGINT | 分类ID | 索引 |
| status | TINYINT | 状态 | 0-下架，1-上架，2-库存不足 |
| sales | INT | 销量 | |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 4. 购物车表 (t_cart)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 购物车ID | 主键，自增 |
| user_id | BIGINT | 用户ID | 索引 |
| product_id | BIGINT | 商品ID | |
| product_name | VARCHAR(100) | 商品名称 | |
| product_image | VARCHAR(255) | 商品图片 | |
| quantity | INT | 商品数量 | |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 5. 订单表 (t_order)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 订单ID | 主键，自增 |
| order_no | VARCHAR(50) | 订单号 | 唯一索引 |
| user_id | BIGINT | 用户ID | 索引 |
| total_amount | DECIMAL(10,2) | 订单总金额 | |
| status | TINYINT | 状态 | 0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-已退款 |
| receiver_name | VARCHAR(50) | 收货人姓名 | |
| receiver_phone | VARCHAR(20) | 收货人电话 | |
| receiver_address | VARCHAR(255) | 收货人地址 | |
| remark | VARCHAR(255) | 备注 | |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 6. 订单详情表 (t_order_item)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 订单详情ID | 主键，自增 |
| order_id | BIGINT | 订单ID | 索引 |
| product_id | BIGINT | 商品ID | 索引 |
| product_name | VARCHAR(100) | 商品名称 | |
| product_image | VARCHAR(255) | 商品图片 | |
| product_price | DECIMAL(10,2) | 商品价格 | |
| quantity | INT | 购买数量 | |
| total_price | DECIMAL(10,2) | 小计金额 | |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |

## 索引说明

### t_user 表
- PRIMARY KEY (id)
- UNIQUE KEY uk_username (username)
- KEY idx_phone (phone)
- KEY idx_email (email)

### t_category 表
- PRIMARY KEY (id)
- KEY idx_sort (sort)

### t_product 表
- PRIMARY KEY (id)
- KEY idx_category_id (category_id)
- KEY idx_status (status)

### t_cart 表
- PRIMARY KEY (id)
- UNIQUE KEY uk_user_product (user_id, product_id)
- KEY idx_user_id (user_id)

### t_order 表
- PRIMARY KEY (id)
- UNIQUE KEY uk_order_no (order_no)
- KEY idx_user_id (user_id)
- KEY idx_status (status)

### t_order_item 表
- PRIMARY KEY (id)
- KEY idx_order_id (order_id)
- KEY idx_product_id (product_id)
