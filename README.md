# Shop 项目

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 快速开始](#2-快速开始)
- [3. Dockerfile 详解](#3-dockerfile-详解)
- [4. Docker Compose 部署](#4-docker-compose-部署)
- [5. 环境变量配置](#5-环境变量配置)
- [6. 数据持久化](#6-数据持久化)
- [7. 生产环境部署](#7-生产环境部署)

---

## 1. 项目概述

Shop 是商城项目，包含以下服务模块：

### 架构设计

#### 1.1 路由架构
系统采用 **RBAC（Role-Based Access Control）** 权限模型，路由按以下层级组织：

```
模块/功能/按钮
├── /order          (订单管理)
├── /product        (商品管理)
├── /member         (会员管理)
└── /system         (系统管理)
    ├── /user       (用户管理)
    ├── /role       (角色管理)
    └── /permission (权限管理)
```

**特点：**
- 所有路由配置存储在数据库 `t_admin_permission` 表
- 路由根据用户角色动态加载
- 前端组件路径与后端菜单路径一一对应

#### 1.2 API 前缀处理
为统一管理API请求，采用以下架构：

**前端调用：**
- 所有API请求统一添加 `/api` 前缀
- 环境变量：`VITE_API_PREFIX=/api`

**Nginx 代理：**
- 接收 `/api` 开头的请求
- 自动去掉 `/api` 前缀后转发到后端
- 后端API无前缀（例如：`/adminUser` 而非 `/api/adminUser`）

**示例：**
```
前端请求: /api/adminUser
   ↓
Nginx 接收: http://localhost:8000/api/adminUser
   ↓
Nginx 代理: http://shop-admin-api:8080/adminUser
   ↓
后端接收: /adminUser (无前缀)
```

#### 1.3 用户管理功能
系统提供完整的用户管理功能，包括：
- 分页查询管理员列表（支持多条件筛选）
- 增删改查管理员
- 批量操作（批量删除、批量禁用、批量启用、批量恢复）
- 为用户分配角色
- 查看用户权限详情
- 用户状态管理（启用/禁用/删除/恢复）

### 服务组成

| 服务           | 端口 | 说明         |
| -------------- | ---- | ------------ |
| shop-admin-api | 8081 | 后台管理 API |
| shop-admin-ui  | 8000 | 管理前端界面 |
| shop-app-api   | 8080 | 前台 API     |

### 技术栈

| 组件               | 版本         | 说明                 |
| ------------------ | ------------ | -------------------- |
| Java               | 17           | Eclipse Temurin JRE  |
| Spring Boot        | 3.5.14       | 应用框架             |
| MySQL              | 9            | 数据库               |
| Redis              | 8 (Alpine)   | 缓存                 |
| Kafka              | Latest       | 消息队列（日志收集） |
| RabbitMQ           | 3-management | 消息队列（业务消息） |
| Elasticsearch      | 9.3.3        | 日志存储             |
| Logstash           | 9.3.3        | 日志处理             |
| Kibana             | 9.3.3        | 日志可视化           |

### 容器架构

```
┌──────────┐         ┌──────────┐
│ admin-ui │         │   app    │
│  (8000)  │         │  (8080)  │
└──────────┘         └──────────┘
        │                     │
        ▼                     ▼
┌──────────┐         ┌──────────┐
│ admin-api│         │  app-api │
│  (8081)  │         │  (8080)  │
└──────────┘         └──────────┘
        │                     │
        ├─────────────────────┤
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────┐
│   中间件层    │    │   日志层     │
├──────────────┤    ├──────────────┤
│   MySQL      │    │   Kafka      │
│  (3306)      │    │  (9092)      │
│   Redis      │    │   Logstash   │
│  (6379)      │    │  (5044)      │
│   RabbitMQ   │    │   ES         │
│  (5672)      │    │  (9200)      │
└──────────────┘    └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Kibana     │
                      │   (5601)     │
                      └──────────────┘
```

---

## 2. 快速开始

### 2.1 一键启动（默认环境）

```bash
# 在项目根目录执行
docker compose up -d

# 查看启动日志
docker compose logs -f shop-admin-api
```

### 2.2 验证部署

```bash
# 检查容器状态
docker compose ps

# 健康检查
curl http://localhost:8081/actuator/health
curl http://localhost:8080/actuator/health

# 访问 API 文档
# shop-admin-api: http://localhost:8081/doc.html
# shop-app-api:   http://localhost:8080/doc.html
# shop-admin-ui:  http://localhost:8000
```

---

## 3. Dockerfile 详解

shop-admin-api 和 shop-app-api 均采用**多阶段构建**方式，位于 backend/ 目录，结构相同，仅模块名和端口不同。

### 构建流程

```bash
# 在项目根目录执行
cd backend

# 构建所有服务
docker build -t shop-admin-api:1.0.0 -f shop-admin-api/Dockerfile .
docker build -t shop-app-api:1.0.0 -f shop-app-api/Dockerfile .

# 或只构建特定服务
docker build -t shop-admin-api:1.0.0 -f shop-admin-api/Dockerfile .
docker build -t shop-app-api:1.0.0 -f shop-app-api/Dockerfile .
```

### 关键设计

- **多阶段构建**: 编译环境和运行环境分离，最终镜像只包含 JRE + JAR
- **阿里云镜像**: `.mvn/settings.xml` 配置阿里云加速
- **分层 COPY**: 先复制 pom.xml 下载依赖，再复制源码编译
- **非 root 用户**: 安全最佳实践
- **时区预设**: Asia/Shanghai

---

## 4. Docker Compose 部署

### 4.1 环境说明

项目支持三个环境，通过不同的 `.env` 文件区分：

| 环境     | 配置文件    | COMPOSE_PROJECT_NAME | 端口前缀 |
| -------- | ----------- | -------------------- | -------- |
| 开发环境 | `.env`      | `shop`               | 80xx     |
| 测试环境 | `.env.test` | `shop-test`          | 18xxx    |
| 生产环境 | `.env.prod` | `shop-prod`          | 28xxx    |

### 4.2 启动命令

```bash
# 开发环境
docker compose --env-file .env up -d

# 测试环境
docker compose --env-file .env.test up -d

# 生产环境
docker compose --env-file .env.prod up -d
```

### 4.3 停止命令

```bash
# 停止当前环境
docker compose down

# 清理数据卷
docker compose down -v
```

---

## 5. 环境变量配置

### 5.1 关键环境变量

| 环境变量               | 说明                | 示例                |
| ---------------------- | ------------------- | ------------------- |
| `COMPOSE_PROJECT_NAME` | 容器项目名前缀      | `shop`              |
| `ADMIN_PORT`           | shop-admin-api 端口 | `8081`              |
| `API_PORT`             | shop-app-api 端口   | `8080`              |
| `ADMIN_UI_PORT`        | shop-admin-ui 端口  | `8000`              |
| `MYSQL_PORT`           | MySQL 端口          | `3306`              |
| `REDIS_PORT`           | Redis 端口          | `6379`              |
| `KAFKA_PORT`           | Kafka 端口          | `9092`              |
| `RABBITMQ_PORT`        | RabbitMQ 端口       | `5672`              |
| `ES_PORT`              | Elasticsearch 端口  | `9200`              |
| `MYSQL_USERNAME`       | 数据库用户名        | `root`              |
| `MYSQL_PASSWORD`       | 数据库密码          | `root123`           |
| `REDIS_PASSWORD`       | Redis 密码          | (空)                |
| `RABBITMQ_USER`        | RabbitMQ 用户名     | `shop`              |
| `RABBITMQ_PASSWORD`    | RabbitMQ 密码       | `shop123`           |
| `JWT_SECRET`           | JWT 签名密钥        | `shop-secret-key`   |
| `JAVA_OPTS`            | JVM 启动参数        | `-Xms256m -Xmx512m` |
| `TZ`                   | 容器时区            | `Asia/Shanghai`     |

---

## 6. 数据持久化

### 6.1 数据卷机制

项目使用 **Docker 命名卷** 进行数据持久化，命名卷会自动加上 `COMPOSE_PROJECT_NAME` 前缀，因此不同环境（dev/test/prod）的数据卷相互隔离，不会冲突。

### 6.2 自动创建的卷

当您启动服务时，Docker Compose 会自动创建以下命名卷：

| 卷名称                           | 用途               |
| -------------------------------- | ------------------ |
| `<project-name>-mysql`           | MySQL 数据         |
| `<project-name>-redis`           | Redis 数据         |
| `<project-name>-kafka`           | Kafka 数据         |
| `<project-name>-kafka_secrets`   | Kafka 密钥         |
| `<project-name>-kafka_config`    | Kafka 配置         |
| `<project-name>-rabbitmq`        | RabbitMQ 数据      |
| `<project-name>-elasticsearch`   | Elasticsearch 数据 |
| `<project-name>-logstash_config` | Logstash 配置      |
| `<project-name>-kibana_config`   | Kibana 配置        |

> **示例**:
>
> - 开发环境会创建 `shop-mysql`、`shop-redis` 等卷
> - 生产环境会创建 `shop-prod-mysql`、`shop-prod-redis` 等卷
> - 切换环境不会影响其他环境的数据

---

## 7. 生产环境部署

### 7.1 部署步骤

1. **创建生产环境配置并生成随机密码**

```bash
# 生成随机密码
MYSQL_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)
RABBITMQ_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)
COMPOSE_PROJECT_NAME=shop-prod

# 创建配置文件
cp .env.prod.template .env.prod

# 使用 sed 替换密码
sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" .env.prod
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env.prod
sed -i "s/^RABBITMQ_PASSWORD=.*/RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD/" .env.prod
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.prod
sed -i "s/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME/" .env.prod

# 查看生成的配置
cat .env.prod
```

2. **启动服务**

```bash
docker compose --env-file .env.prod up -d
```

3. **验证部署**

```bash
# 检查容器状态
docker compose --env-file .env.prod ps

# 检查健康状态
curl http://localhost:28081/actuator/health
curl http://localhost:28080/actuator/health

# 检查数据库连接
docker exec shop-prod-mysql mysql -uroot -pPASSWORD -e "SELECT 1"

# 检查 Redis 连接
docker exec shop-prod-redis redis-cli -a PASSWORD PING

# 检查 RabbitMQ 连接
docker exec shop-prod-rabbitmq rabbitmq-diagnostics -u shop -p shop123 ping
```

---

## 附录

### A. 端口速查表

| 服务           | 容器内部端口  | 开发环境  | 测试环境  | 生产环境 | 环境变量               |
| -------------- | ------------ | -------- | -------- | -------- | --------------------- |
| shop-admin-api | 8081         | 8081     | 18081    | 28081    | `ADMIN_PORT`          |
| shop-app-api   | 8080         | 8080     | 18080    | 28080    | `API_PORT`            |
| shop-admin-ui  | 80           | 8000     | 18000    | 28000    | `ADMIN_UI_PORT`       |
| MySQL          | 3306         | 3306     | 13306    | 23306    | `MYSQL_PORT`          |
| Redis          | 6379         | 6379     | 16379    | 26379    | `REDIS_PORT`          |
| Kafka          | 9092         | 9092     | 19092    | 29092    | `KAFKA_PORT`          |
| Kafka          | 9094         | 9094     | 19094    | 29094    | `KAFKA_EXTERNAL_PORT` |
| RabbitMQ       | 5672         | 5672     | 15672    | 25672    | `RABBITMQ_PORT`       |
| RabbitMQ       | 15672        | 5673     | 15673    | 25673    | `RABBITMQ_MGMT_PORT`  |
| Elasticsearch  | 9200         | 9200     | 19200    | 29200    | `ES_PORT`             |
| Logstash       | 5044         | 5044     | 15044    | 25044    | -                     |
| Kibana         | 5601         | 5601     | 15601    | 25601    | -                     |

> **说明**: 所有宿主机端口均可在对应环境变量中自定义。
