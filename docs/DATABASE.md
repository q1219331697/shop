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

### 7. 后台管理用户表 (t_admin_user)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 管理用户ID | 主键，自增 |
| username | VARCHAR(50) | 用户名 | |
| password | VARCHAR(100) | 密码 | 加密存储 |
| real_name | VARCHAR(50) | 姓名 | |
| status | TINYINT | 状态 | 0-禁用，1-正常 |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 8. 后台登录日志表 (t_admin_login_log)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 日志ID | 主键，自增 |
| user_id | BIGINT | 管理用户ID | 索引 |
| username | VARCHAR(50) | 用户名 | 索引 |
| login_time | DATETIME | 登录时间 | 索引 |
| status | TINYINT | 状态 | 0-失败，1-成功，索引 |
| message | VARCHAR(255) | 提示信息 | |
| create_time | DATETIME | 创建时间 | |

### 9. 后台角色表 (t_admin_role)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 角色ID | 主键，自增 |
| role_name | VARCHAR(50) | 角色名称 | |
| role_code | VARCHAR(50) | 角色编码 | 索引 |
| description | VARCHAR(200) | 角色描述 | |
| sort_order | INT | 排序 | |
| status | TINYINT | 状态 | 0-禁用，1-正常，索引 |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 10. 后台权限表 (t_admin_permission)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 权限ID | 主键，自增 |
| parent_id | BIGINT | 父权限ID | 0为顶级，索引 |
| permission_name | VARCHAR(50) | 权限名称 | |
| permission_code | VARCHAR(100) | 权限编码 | 索引 |
| permission_type | TINYINT | 类型 | 1-菜单，2-按钮，索引 |
| path | VARCHAR(255) | 菜单路径/路由 | |
| icon | VARCHAR(100) | 菜单图标 | |
| component | VARCHAR(255) | 前端组件路径 | |
| sort_order | INT | 排序 | |
| visible | TINYINT | 是否可见 | 0-隐藏，1-显示 |
| status | TINYINT | 状态 | 0-禁用，1-正常，索引 |
| deleted | TINYINT | 删除标记 | 0-未删除，1-已删除 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 11. 后台用户角色关联表 (t_admin_user_role)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | ID | 主键，自增 |
| user_id | BIGINT | 用户ID | 索引 |
| role_id | BIGINT | 角色ID | 索引 |
| create_time | DATETIME | 创建时间 | |

### 12. 后台角色权限关联表 (t_admin_role_permission)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | ID | 主键，自增 |
| role_id | BIGINT | 角色ID | 索引 |
| permission_id | BIGINT | 权限ID | 索引 |
| create_time | DATETIME | 创建时间 | |

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

### t_admin_user 表
- PRIMARY KEY (id)
- KEY idx_status (status)

### t_admin_login_log 表
- PRIMARY KEY (id)
- KEY idx_user_id (user_id)
- KEY idx_username (username)
- KEY idx_login_time (login_time)
- KEY idx_status (status)

### t_admin_role 表
- PRIMARY KEY (id)
- KEY idx_role_code (role_code)
- KEY idx_status (status)

### t_admin_permission 表
- PRIMARY KEY (id)
- KEY idx_parent_id (parent_id)
- KEY idx_permission_code (permission_code)
- KEY idx_permission_type (permission_type)
- KEY idx_status (status)

### t_admin_user_role 表
- PRIMARY KEY (id)
- KEY idx_user_id (user_id)
- KEY idx_role_id (role_id)

### t_admin_role_permission 表
- PRIMARY KEY (id)
- KEY idx_role_id (role_id)
- KEY idx_permission_id (permission_id)
