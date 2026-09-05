# Shop 架构设计文档

## 目录
- [1. 架构概述](#1-架构概述)
- [2. 路由架构](#2-路由架构)
- [3. API 前缀处理](#3-api-前缀处理)
- [4. 权限系统](#4-权限系统)
- [5. 技术栈](#5-技术栈)

---

## 1. 架构概述

Shop 采用微服务架构，基于 Spring Boot + Vue 3 实现。

### 核心特点
- **容器化部署**：使用 Docker Compose 统一管理服务
- **RBAC 权限模型**：基于角色的访问控制
- **动态路由**：路由配置存储在数据库，根据权限动态加载
- **API 统一前缀**：前端统一使用 `/api` 前缀，Nginx 层去前缀

---

## 2. 路由架构

### 2.1 路由层级
系统采用 `模块/功能/按钮` 的三级路由结构：

```
系统模块
├── 订单管理 (/order)
│   ├── 订单列表
│   ├── 订单详情
│   └── 订单状态更新
├── 商品管理 (/product)
│   ├── 商品列表
│   ├── 商品详情
│   └── 商品上下架
├── 会员管理 (/member)
│   ├── 会员列表
│   └── 会员信息
└── 系统管理 (/system)
    ├── 用户管理 (/user)
    │   ├── 用户列表
    │   ├── 用户详情
    │   ├── 用户创建/编辑/删除
    │   ├── 批量操作
    │   └── 用户角色分配
    ├── 角色管理 (/role)
    │   ├── 角色列表
    │   ├── 角色创建/编辑/删除
    │   └── 权限分配
    └── 权限管理 (/permission)
        ├── 权限列表
        └── 权限详情
```

### 2.2 路由配置存储
所有路由配置存储在数据库表 `t_admin_permission` 中：

| 字段 | 说明 |
|------|------|
| id | 主键 |
| parent_id | 父菜单ID（0表示顶级菜单） |
| permission_name | 权限名称 |
| path | 路由路径（例如：/system/admin） |
| component | 前端组件路径（例如：views/system/admin/index.vue） |
| permission_code | 权限编码（例如：system:admin:list） |
| permission_type | 权限类型（1-目录，2-菜单，3-操作） |
| sort_order | 排序 |
| visible | 是否可见（0-隐藏，1-显示） |

### 2.3 前端路由生成
前端从后端获取菜单树，动态生成路由：
1. 调用 `/api/adminUser/menus` 接口获取当前用户的菜单
2. 构建树形结构
3. 转换为 Vue Router 路由配置
4. 注册到路由系统中

---

## 3. API 前缀处理

### 3.1 整体流程
```
前端 → Nginx → 后端
 ↓       ↓       ↓
/api/xxx  xxx   /xxx
```

### 3.2 配置说明

#### 前端配置 (.env.development)
```env
VITE_API_BASE_URL=http://localhost:8081
VITE_API_PREFIX=/api
```

#### Nginx 配置
```nginx
location /api/ {
    proxy_pass http://shop-admin-api:8080/;
    # 注意末尾的 / 会自动去掉 /api 前缀
}
```

#### 后端接口
- Controller 使用 `@RequestMapping("/adminUser")` 等无前缀路径
- API 文档路径：`/api/adminUser`

### 3.3 请求示例
**前端请求：**
```
GET http://localhost:8000/api/adminUser?pageNum=1&pageSize=10
```

**Nginx 转发：**
```
GET http://shop-admin-api:8080/adminUser?pageNum=1&pageSize=10
```

**后端接收：**
```java
@RequestMapping("/adminUser")
public Result<IPage<AdminUserEntity>> list(...) {
    // 处理逻辑
}
```

---

## 4. 权限系统

### 4.1 RBAC 模型
系统采用标准的 RBAC（Role-Based Access Control）模型：

```
用户 (AdminUser)
  ↓ 1:N
角色 (AdminRole)
  ↓ 1:N
权限 (AdminPermission)
  ↓ 1:N
资源 (Controller/Method)
```

### 4.2 权限分类
1. **菜单权限**：permission_type = 1
   - 控制路由和侧边栏显示
   - 路径对应前端路由
   - 组件对应前端页面

2. **按钮权限**：permission_type = 2
   - 控制页面内按钮的显示
   - 用于增删改查等操作
   - 例如：system:user:create, system:user:update

### 4.3 权限编码规则
格式：`模块:功能:操作`

| 示例 | 说明 |
|------|------|
| system:user:list | 系统-用户-列表查询 |
| system:user:create | 系统-用户-创建 |
| system:user:update | 系统-用户-更新 |
| system:user:delete | 系统-用户-删除 |
| system:user:detail | 系统-用户-详情查看 |

---

## 5. 技术栈

### 5.1 后端技术栈
| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 17 | Eclipse Temurin JRE |
| Spring Boot | 3.5.14 | 应用框架 |
| MyBatis Plus | - | ORM 框架 |
| MySQL | 9 | 数据库 |
| Redis | 8 (Alpine) | 缓存 |
| JWT | - | Token 认证 |
| Swagger/OpenAPI | - | API 文档 |

### 5.2 前端技术栈
| 组件 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | 渐进式框架 |
| TypeScript | - | 类型安全 |
| Vite | - | 构建工具 |
| Element Plus | - | UI 组件库 |
| Vue Router | - | 路由管理 |
| Axios | - | HTTP 客户端 |
| Pinia | - | 状态管理 |

### 5.3 基础设施
| 组件 | 版本 | 说明 |
|------|------|------|
| Docker | - | 容器化 |
| Docker Compose | - | 编排工具 |
| Kafka | Latest | 消息队列 |
| RabbitMQ | 3-management | 消息队列 |
| Elasticsearch | 9.3.3 | 搜索引擎 |
| Logstash | 9.3.3 | 日志处理 |
| Kibana | 9.3.3 | 日志可视化 |

---

## 6. 数据库设计

### 6.1 核心表结构

#### t_admin_user（管理员表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(100) | 密码（加密） |
| real_name | VARCHAR(50) | 真实姓名 |
| status | TINYINT | 状态（0-禁用，1-启用） |
| deleted | TINYINT | 删除标记（0-正常，1-已删除） |

#### t_admin_role（角色表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| role_name | VARCHAR(50) | 角色名称 |
| role_code | VARCHAR(50) | 角色编码 |
| description | VARCHAR(200) | 描述 |

#### t_admin_permission（权限表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| parent_id | BIGINT | 父权限ID |
| permission_name | VARCHAR(50) | 权限名称 |
| path | VARCHAR(100) | 路径 |
| component | VARCHAR(200) | 组件路径 |
| permission_code | VARCHAR(100) | 权限编码 |
| permission_type | TINYINT | 类型（1-菜单，2-按钮） |
| sort_order | INT | 排序 |
| visible | TINYINT | 可见性 |

#### t_admin_user_role（用户-角色关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | BIGINT | 用户ID |
| role_id | BIGINT | 角色ID |

#### t_admin_role_permission（角色-权限关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| role_id | BIGINT | 角色ID |
| permission_id | BIGINT | 权限ID |

---

## 7. 安全设计

### 7.1 认证机制
- **JWT Token**：无状态认证
- **滑动过期**：每次有效请求自动续期
- **Token 刷新**：前端定时刷新，后端滑动延长

### 7.2 接口安全
- **权限验证**：`@RequirePermission` 注解
- **防重复登录**：基于 Token 的单点登录控制
- **CSRF 防护**：基于 Token 的请求签名

### 7.3 数据安全
- **密码加密**：BCrypt 加密
- **敏感数据**：数据库字段加密
- **SQL 注入防护**：MyBatis Plus 参数化查询

---

## 8. 部署架构

### 8.1 容器网络
- 使用 Docker bridge 网络
- 服务间通过容器名访问
- 端口映射到宿主机

### 8.2 数据持久化
- **命名卷**：MySQL、Redis、Kafka 等数据
- **环境变量**：配置文件
- **命名空间**：不同环境隔离

### 8.3 健康检查
- Spring Boot Actuator
- Docker healthcheck
- 监控指标收集

---

## 9. 开发规范

### 9.1 命名规范
- **Controller**：`{Module}Controller`
- **Service**：`{Module}Service`
- **Entity**：`{Module}Entity`
- **VO/DTO**：`{Module}Vo` / `{Module}Dto`

### 9.2 API 规范
- 统一使用 RESTful 风格
- 统一返回 Result 对象
- 统一错误码枚举

### 9.3 前端规范
- 组件按功能拆分
- 状态管理使用 Pinia
- API 封装在 api 目录

---

## 10. 后续优化方向

1. **性能优化**
   - 接口响应缓存
   - 数据库查询优化
   - 前端懒加载

2. **安全增强**
   - 请求签名验证
   - IP 白名单
   - 操作日志审计

3. **可观测性**
   - 分布式链路追踪
   - 实时监控告警
   - 日志集中分析

4. **扩展性**
   - 多租户支持
   - 多语言支持
   - 微服务拆分