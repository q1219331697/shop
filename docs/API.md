# API 文档

> 本文档基于项目实际控制器代码自动整理，涵盖 **shop-admin-api（后台管理，端口 8081）** 和 **shop-app-api（前台接口，端口 8080）** 两个模块。

## 通用说明

### 统一响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 响应码说明
| 响应码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 500 | 操作失败 |
| 1001 | 用户不存在 |
| 1002 | 用户名已存在 |
| 1003 | 手机号已存在 |
| 1004 | 密码错误 |
| 1005 | 用户已被禁用 |
| 2001 | 商品不存在 |
| 2002 | 库存不足 |
| 3001 | 分类不存在 |
| 3002 | 分类名称已存在 |
| 3003 | 分类下存在商品 |
| 4001 | 购物车项不存在 |
| 5001 | 订单不存在 |
| 5002 | 订单状态错误 |
| 5003 | 订单详情不存在 |
| 9001 | 操作失败 |
| 9002 | 参数错误 |

### 认证方式
- 后台管理接口（`/admin/**`、`/admin-user/**`）需要在请求头中携带 Token：
  ```
  Authorization: Bearer <token>
  ```
- 登录接口（`/admin-user/login`）无需认证
- Knife4j 文档接口（`/doc.html`、`/v3/api-docs` 等）无需认证

---

## 一、后台管理模块（shop-admin-api，端口 8081）

### 1. 管理员管理

#### 1.1 管理员登录
- **接口路径**: `POST /admin-user/login`
- **是否需要认证**: 否
- **请求参数**:
  ```json
  {
    "username": "admin",
    "password": "123456"
  }
  ```
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": "eyJhbGciOiJIUzI1NiJ9..."
  }
  ```
  > data 字段直接返回 Token 字符串

#### 1.2 管理员登出
- **接口路径**: `POST /admin-user/logout`
- **是否需要认证**: 是
- **请求头**: `Authorization: Bearer <token>`
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

#### 1.3 分页查询管理员列表
- **接口路径**: `GET /adminUser/list`
- **是否需要认证**: 是
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | pageNum | Long | 否 | 1 | 页码 |
  | pageSize | Long | 否 | 10 | 每页数量 |
  | username | String | 否 | - | 用户名（模糊查询） |
  | realName | String | 否 | - | 姓名（模糊查询） |
  | status | Integer | 否 | - | 状态：0-禁用，1-正常 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "username": "admin",
          "realName": "超级管理员",
          "status": 1,
          "createTime": "2024-01-01 00:00:00",
          "updateTime": "2024-01-01 12:00:00"
        }
      ],
      "total": 1,
      "size": 10,
      "current": 1,
      "pages": 1
    }
  }
  ```

#### 1.4 获取管理员详情
- **接口路径**: `GET /adminUser/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 管理员ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "username": "admin",
      "realName": "超级管理员",
      "status": 1,
      "createTime": "2024-01-01 00:00:00",
      "updateTime": "2024-01-01 12:00:00"
    }
  }
  ```

#### 1.5 创建管理员
- **接口路径**: `POST /adminUser/create`
- **是否需要认证**: 是
- **请求参数**:
  ```json
  {
    "username": "newadmin",
    "password": "123456",
    "realName": "新管理员",
    "status": 1
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | username | String | 用户名 |
  | password | String | 密码 |
  | realName | String | 姓名 |
  | status | Integer | 状态：0-禁用，1-正常 |

#### 1.6 更新管理员信息
- **接口路径**: `PUT /adminUser/update`
- **是否需要认证**: 是
- **请求参数**:
  ```json
  {
    "id": 2,
    "realName": "更新姓名",
    "status": 1
  }
  ```

#### 1.7 删除管理员
- **接口路径**: `DELETE /adminUser/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 管理员ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

### 2. 登录日志管理

#### 2.1 分页查询登录日志
- **接口路径**: `GET /adminLoginLog/list`
- **是否需要认证**: 是
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | pageNum | Long | 否 | 1 | 页码 |
  | pageSize | Long | 否 | 10 | 每页数量 |
  | username | String | 否 | - | 用户名（模糊查询） |
  | status | Integer | 否 | - | 状态：0-失败，1-成功 |
  | startTime | String | 否 | - | 开始时间，格式：yyyy-MM-dd HH:mm:ss |
  | endTime | String | 否 | - | 结束时间，格式：yyyy-MM-dd HH:mm:ss |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "userId": 1,
          "username": "admin",
          "loginTime": "2024-01-01 12:00:00",
          "status": 1,
          "message": "登录成功",
          "createTime": "2024-01-01 12:00:00"
        }
      ],
      "total": 1,
      "size": 10,
      "current": 1,
      "pages": 1
    }
  }
  ```

---

### 3. 商品管理（后台）

#### 2.1 分页查询商品列表
- **接口路径**: `GET /admin/product/list`
- **是否需要认证**: 是
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | current | Long | 否 | 1 | 页码 |
  | size | Long | 否 | 10 | 每页数量 |
  | categoryId | Long | 否 | - | 分类ID |
  | keyword | String | 否 | - | 搜索关键词 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "name": "智能手机",
          "description": "高性能智能手机",
          "price": 3999.00,
          "stock": 100,
          "image": "/images/phone.jpg",
          "categoryId": 1,
          "status": 1,
          "sales": 50,
          "createTime": "2024-01-01 00:00:00",
          "updateTime": "2024-01-01 12:00:00"
        }
      ],
      "total": 100,
      "size": 10,
      "current": 1,
      "pages": 10
    }
  }
  ```

#### 2.2 获取商品详情
- **接口路径**: `GET /admin/product/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 商品ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "name": "智能手机",
      "description": "高性能智能手机",
      "price": 3999.00,
      "stock": 100,
      "image": "/images/phone.jpg",
      "categoryId": 1,
      "status": 1,
      "sales": 50
    }
  }
  ```

#### 2.3 添加商品
- **接口路径**: `POST /admin/product/add`
- **是否需要认证**: 是
- **请求参数**:
  ```json
  {
    "name": "新商品",
    "description": "商品描述",
    "price": 199.00,
    "stock": 200,
    "image": "/images/new.jpg",
    "categoryId": 1,
    "status": 1
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | name | String | 商品名称 |
  | description | String | 商品描述 |
  | price | BigDecimal | 商品价格 |
  | stock | Integer | 库存数量 |
  | image | String | 商品图片 |
  | categoryId | Integer | 分类ID |
  | status | Integer | 状态：0-下架，1-上架，2-库存不足 |

#### 2.4 更新商品
- **接口路径**: `PUT /admin/product/update`
- **是否需要认证**: 是
- **请求参数**:
  ```json
  {
    "id": 1,
    "name": "更新商品",
    "description": "更新描述",
    "price": 299.00,
    "stock": 150,
    "status": 1
  }
  ```

#### 2.5 删除商品
- **接口路径**: `DELETE /admin/product/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 商品ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 3. 用户管理（后台）

#### 3.1 分页查询用户列表
- **接口路径**: `GET /admin/user/list`
- **是否需要认证**: 是
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | current | Long | 否 | 1 | 页码 |
  | size | Long | 否 | 10 | 每页数量 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "username": "user1",
          "nickname": "用户1",
          "phone": "13800000001",
          "email": "user1@shop.com",
          "avatar": null,
          "status": 1,
          "createTime": "2024-01-01 00:00:00",
          "updateTime": "2024-01-01 12:00:00"
        }
      ],
      "total": 50,
      "size": 10,
      "current": 1,
      "pages": 5
    }
  }
  ```

#### 3.2 获取用户详情
- **接口路径**: `GET /admin/user/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 用户ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "username": "user1",
      "nickname": "用户1",
      "phone": "13800000001",
      "email": "user1@shop.com",
      "status": 1
    }
  }
  ```

#### 3.3 更新用户信息
- **接口路径**: `PUT /admin/user/update`
- **是否需要认证**: 是
- **请求参数**:
  ```json
  {
    "id": 1,
    "nickname": "新昵称",
    "phone": "13800000002",
    "email": "newemail@shop.com",
    "status": 1
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 用户ID（必填） |
  | nickname | String | 昵称 |
  | phone | String | 手机号 |
  | email | String | 邮箱 |
  | status | Integer | 状态：0-禁用，1-正常，2-锁定 |

#### 3.4 删除用户
- **接口路径**: `DELETE /admin/user/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 用户ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 4. 订单管理（后台）

#### 4.1 分页查询所有订单
- **接口路径**: `GET /admin/order/list`
- **是否需要认证**: 是
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | current | Long | 否 | 1 | 页码 |
  | size | Long | 否 | 10 | 每页数量 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "orderNo": "202401010001",
          "userId": 1,
          "totalAmount": 7998.00,
          "status": 0,
          "receiverName": "张三",
          "receiverPhone": "13800138000",
          "receiverAddress": "北京市朝阳区",
          "remark": null,
          "createTime": "2024-01-01 12:00:00",
          "updateTime": "2024-01-01 12:00:00"
        }
      ],
      "total": 30,
      "size": 10,
      "current": 1,
      "pages": 3
    }
  }
  ```

#### 4.2 获取订单详情
- **接口路径**: `GET /admin/order/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "orderNo": "202401010001",
      "userId": 1,
      "totalAmount": 7998.00,
      "status": 0,
      "receiverName": "张三",
      "receiverPhone": "13800138000",
      "receiverAddress": "北京市朝阳区"
    }
  }
  ```

#### 4.3 更新订单状态
- **接口路径**: `PUT /admin/order/status/{id}`
- **是否需要认证**: 是
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单ID |
- **请求参数**:
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | status | Integer | 是 | 订单状态 |
- **订单状态说明**:
  | 值 | 说明 |
  |----|------|
  | 0 | 待付款 |
  | 1 | 待发货 |
  | 2 | 待收货 |
  | 3 | 已完成 |
  | 4 | 已取消 |
  | 5 | 退款中 |
  | 6 | 已退款 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

## 二、前台接口模块（shop-app-api，端口 8080）

### 5. 用户接口

#### 5.1 用户登录
- **接口路径**: `POST /user/login`
- **请求参数**:
  ```json
  {
    "username": "user1",
    "password": "123456"
  }
  ```
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": "eyJhbGciOiJIUzI1NiJ9..."
  }
  ```

#### 5.2 用户注册
- **接口路径**: `POST /user/register`
- **请求参数**:
  ```json
  {
    "username": "newuser",
    "password": "123456",
    "nickname": "新用户",
    "phone": "13800000001",
    "email": "newuser@shop.com"
  }
  ```
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

#### 5.3 获取用户信息
- **接口路径**: `GET /user/info/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 用户ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "username": "user1",
      "nickname": "用户1",
      "phone": "13800000001",
      "email": "user1@shop.com",
      "avatar": null,
      "status": 1
    }
  }
  ```

#### 5.4 更新用户信息
- **接口路径**: `PUT /user/update`
- **请求参数**:
  ```json
  {
    "id": 1,
    "nickname": "新昵称",
    "phone": "13800000002",
    "email": "newemail@shop.com"
  }
  ```

---

### 6. 商品接口

#### 6.1 分页查询商品列表
- **接口路径**: `GET /product/list`
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | current | Long | 否 | 1 | 页码 |
  | size | Long | 否 | 10 | 每页数量 |
  | categoryId | Long | 否 | - | 分类ID |
  | keyword | String | 否 | - | 搜索关键词 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [
        {
          "id": 1,
          "name": "智能手机",
          "description": "高性能智能手机",
          "price": 3999.00,
          "stock": 100,
          "image": "/images/phone.jpg",
          "categoryId": 1,
          "status": 1,
          "sales": 50
        }
      ],
      "total": 100,
      "size": 10,
      "current": 1,
      "pages": 10
    }
  }
  ```

#### 6.2 获取商品详情
- **接口路径**: `GET /product/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 商品ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "name": "智能手机",
      "description": "高性能智能手机",
      "price": 3999.00,
      "stock": 100,
      "image": "/images/phone.jpg",
      "categoryId": 1,
      "status": 1,
      "sales": 50
    }
  }
  ```

#### 6.3 添加商品
- **接口路径**: `POST /product/add`
- **请求参数**:
  ```json
  {
    "name": "新商品",
    "description": "商品描述",
    "price": 199.00,
    "stock": 200,
    "categoryId": 1,
    "status": 1
  }
  ```

#### 6.4 更新商品
- **接口路径**: `PUT /product/update`
- **请求参数**:
  ```json
  {
    "id": 1,
    "name": "更新商品",
    "price": 299.00,
    "stock": 150
  }
  ```

#### 6.5 删除商品
- **接口路径**: `DELETE /product/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 商品ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 7. 分类接口

#### 7.1 获取所有分类列表
- **接口路径**: `GET /category/list`
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": [
      {
        "id": 1,
        "name": "手机数码",
        "description": "手机及数码产品",
        "sort": 1,
        "status": 1,
        "createTime": "2024-01-01 00:00:00",
        "updateTime": "2024-01-01 00:00:00"
      }
    ]
  }
  ```

#### 7.2 获取分类详情
- **接口路径**: `GET /category/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 分类ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "name": "手机数码",
      "description": "手机及数码产品",
      "sort": 1,
      "status": 1
    }
  }
  ```

#### 7.3 添加分类
- **接口路径**: `POST /category/add`
- **请求参数**:
  ```json
  {
    "name": "新分类",
    "description": "分类描述",
    "sort": 1,
    "status": 1
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | name | String | 分类名称 |
  | description | String | 分类描述 |
  | sort | Integer | 排序 |
  | status | Integer | 状态：0-禁用，1-启用 |

#### 7.4 更新分类
- **接口路径**: `PUT /category/update`
- **请求参数**:
  ```json
  {
    "id": 1,
    "name": "更新分类",
    "description": "更新描述",
    "sort": 2,
    "status": 1
  }
  ```

#### 7.5 删除分类
- **接口路径**: `DELETE /category/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 分类ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 8. 购物车接口

#### 8.1 获取用户购物车列表
- **接口路径**: `GET /cart/list/{userId}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | userId | Long | 用户ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": [
      {
        "id": 1,
        "userId": 1,
        "productId": 1,
        "productName": "智能手机",
        "productImage": "/images/phone.jpg",
        "quantity": 2,
        "createTime": "2024-01-01 12:00:00",
        "updateTime": "2024-01-01 12:00:00"
      }
    ]
  }
  ```

#### 8.2 添加商品到购物车
- **接口路径**: `POST /cart/add`
- **请求参数**:
  ```json
  {
    "userId": 1,
    "productId": 1,
    "productName": "智能手机",
    "productImage": "/images/phone.jpg",
    "quantity": 2
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | userId | Long | 用户ID |
  | productId | Long | 商品ID |
  | productName | String | 商品名称 |
  | productImage | String | 商品图片 |
  | quantity | Integer | 商品数量 |

#### 8.3 更新购物车商品数量
- **接口路径**: `PUT /cart/update`
- **请求参数**:
  ```json
  {
    "id": 1,
    "quantity": 3
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 购物车项ID（必填） |
  | quantity | Integer | 商品数量 |

#### 8.4 删除购物车商品
- **接口路径**: `DELETE /cart/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 购物车项ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

#### 8.5 清空用户购物车
- **接口路径**: `DELETE /cart/clear/{userId}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | userId | Long | 用户ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 9. 订单接口

#### 9.1 创建订单
- **接口路径**: `POST /order/create`
- **请求参数**:
  ```json
  {
    "userId": 1,
    "receiverName": "张三",
    "receiverPhone": "13800138000",
    "receiverAddress": "北京市朝阳区",
    "remark": "请尽快发货"
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | userId | Long | 用户ID |
  | receiverName | String | 收货人姓名 |
  | receiverPhone | String | 收货人电话 |
  | receiverAddress | String | 收货人地址 |
  | remark | String | 备注（可选） |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "orderNo": "202401010001",
      "userId": 1,
      "totalAmount": 7998.00,
      "status": 0,
      "receiverName": "张三",
      "receiverPhone": "13800138000",
      "receiverAddress": "北京市朝阳区"
    }
  }
  ```

#### 9.2 获取订单详情
- **接口路径**: `GET /order/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "orderNo": "202401010001",
      "userId": 1,
      "totalAmount": 7998.00,
      "status": 0,
      "receiverName": "张三",
      "receiverPhone": "13800138000",
      "receiverAddress": "北京市朝阳区",
      "remark": null,
      "createTime": "2024-01-01 12:00:00",
      "updateTime": "2024-01-01 12:00:00"
    }
  }
  ```

#### 9.3 获取用户订单列表
- **接口路径**: `GET /order/list/{userId}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | userId | Long | 用户ID |
- **请求参数**:
  | 参数 | 类型 | 必填 | 默认值 | 说明 |
  |------|------|------|--------|------|
  | current | Long | 否 | 1 | 页码 |
  | size | Long | 否 | 10 | 每页数量 |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "records": [...],
      "total": 10,
      "size": 10,
      "current": 1,
      "pages": 1
    }
  }
  ```

#### 9.4 取消订单
- **接口路径**: `PUT /order/cancel/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

#### 9.5 更新订单状态
- **接口路径**: `PUT /order/status/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单ID |
- **请求参数**:
  | 参数 | 类型 | 必填 | 说明 |
  |------|------|------|------|
  | status | Integer | 是 | 订单状态（0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-已退款） |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功"
  }
  ```

---

### 10. 订单详情接口

#### 10.1 获取订单详情列表
- **接口路径**: `GET /order-item/list/{orderId}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | orderId | Long | 订单ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": [
      {
        "id": 1,
        "orderId": 1,
        "productId": 1,
        "productName": "智能手机",
        "productImage": "/images/phone.jpg",
        "productPrice": 3999.00,
        "quantity": 2,
        "totalPrice": 7998.00
      }
    ]
  }
  ```

#### 10.2 获取订单详情
- **接口路径**: `GET /order-item/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单详情ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "orderId": 1,
      "productId": 1,
      "productName": "智能手机",
      "productImage": "/images/phone.jpg",
      "productPrice": 3999.00,
      "quantity": 2,
      "totalPrice": 7998.00
    }
  }
  ```

#### 10.3 添加订单详情
- **接口路径**: `POST /order-item/add`
- **请求参数**:
  ```json
  {
    "orderId": 1,
    "productId": 1,
    "productName": "智能手机",
    "productImage": "/images/phone.jpg",
    "productPrice": 3999.00,
    "quantity": 2,
    "totalPrice": 7998.00
  }
  ```
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | orderId | Long | 订单ID |
  | productId | Long | 商品ID |
  | productName | String | 商品名称 |
  | productImage | String | 商品图片 |
  | productPrice | BigDecimal | 商品价格 |
  | quantity | Integer | 购买数量 |
  | totalPrice | BigDecimal | 小计金额 |

#### 10.4 获取订单详情
- **接口路径**: `GET /order-item/{id}`
- **路径参数**:
  | 参数 | 类型 | 说明 |
  |------|------|------|
  | id | Long | 订单详情ID |
- **返回结果**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": 1,
      "orderId": 1,
      "productId": 1,
      "productName": "智能手机",
      "productImage": "/images/phone.jpg",
      "productPrice": 3999.00,
      "quantity": 2,
      "totalPrice": 7998.00
    }
  }
  ```

