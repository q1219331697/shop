# Shop 项目 Docker 部署文档

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
| MySQL              | 9.7          | 数据库               |
| Redis              | 8 (Alpine)   | 缓存                 |
| Kafka              | Latest       | 消息队列（日志收集） |
| RabbitMQ           | 3-management | 消息队列（业务消息） |
| Elasticsearch      | 9.3.3        | 日志存储             |
| Logstash           | 9.3.3        | 日志处理             |
| Kibana             | 9.3.3        | 日志可视化           |
| Logstash TCP Input | 5044         | 日志接收端口         |

### 容器架构

```
                    ┌─────────────────────────────────────────┐
                    │           Docker Network                │
                    │        (shop_network / bridge)          │
                    │                                         │
  ┌──────────┐      │                    ┌────┴────┐         │
  │          │      │                    │  Kafka   │         │
  │          │      │                    │ :9092    │         │
  │ 管理端    │──────┼─►│shop-admin-api │    └────┬────┘         │
  │          │      │  │ :8081         │───┐     │              │
  └──────────┘      │  └─────┬─────────┘   │     │              │
                    │        │              │     │              │
  ┌──────────┐      │  ┌─────┴─────┐       │     │              │
  │          │      │  │           │       │     │              │
  │ 前台用户  │──────┼─►│ shop-app-api│──────┘     │              │
  │          │      │  │ :8080     │          │              │
  └──────────┘      │  └───────────┘          │              │
                    │        │                │              │
                    │        ▼                │              │
                    │  ┌───────────┐          │              │
                    │  │  MySQL    │◄─────────┘              │
                    │  │  :3306    │                         │
                    │  └───────────┘                         │
                    │                                         │
                    │        ┌───────────┐                    │
                    │        │  Redis    │                    │
                    │        │  :6379    │                    │
                    │        └───────────┘                    │
                    │                                         │
                    │        ┌───────────┐                    │
                    │        │ RabbitMQ  │                    │
                    │        │ :5672     │                    │
                    │        └───────────┘                    │
                    │                                         │
                    └─────────────────────────────────────────┘
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
# shop-admin-ui:  http://localhost:5173
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

### 4.1 文件结构

```
docker-compose.yml          # 完整编排（基础设施 + 应用服务）
docker/data/                # 数据卷
├── shop-dev/               # 开发环境数据
│   ├── mysql/
│   ├── redis/
│   ├── kafka/
│   └── rabbitmq/
├── shop-test/              # 测试环境数据
└── shop-prod/              # 生产环境数据
.env.dev                    # 开发环境配置
.env.test                   # 测试环境配置
.env.prod.template          # 生产环境配置模板
.env.prod                   # 生产环境配置（不提交）
```

### 4.2 环境说明

项目支持三个环境，通过不同的 `.env` 文件区分：

| 环境     | 配置文件    | COMPOSE_PROJECT_NAME | 端口前缀 |
| -------- | ----------- | -------------------- | -------- |
| 开发环境 | `.env.dev`  | `shop-dev`           | 80xx     |
| 测试环境 | `.env.test` | `shop-test`          | 18xxx    |
| 生产环境 | `.env.prod` | `shop-prod`          | 28xxx    |

### 4.3 启动命令

```bash
# 开发环境
docker compose --env-file .env.dev up -d

# 测试环境
docker compose --env-file .env.test up -d

# 生产环境
docker compose --env-file .env.prod up -d
```

### 4.4 停止命令

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
| `COMPOSE_PROJECT_NAME` | 容器项目名前缀      | `shop-dev`          |
| `ADMIN_PORT`           | shop-admin-api 端口 | `8081`              |
| `API_PORT`             | shop-app-api 端口   | `8080`              |
| `ADMIN_UI_PORT`        | shop-admin-ui 端口  | `5173`              |
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

### 5.2 生产环境配置

生产环境配置文件位于 `docker/.env.prod`，从模板创建：

```bash
# 生成随机密码
MYSQL_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)
RABBITMQ_PASSWORD=$(openssl rand -base64 16)
JWT_SECRET=$(openssl rand -base64 32)
COMPOSE_PROJECT_NAME=shop-prod

# 创建配置文件
cp docker/.env.prod.template docker/.env.prod

# 使用 sed 替换密码（根据实际情况调整）
sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" docker/.env.prod
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" docker/.env.prod
sed -i "s/^RABBITMQ_PASSWORD=.*/RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD/" docker/.env.prod
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" docker/.env.prod
sed -i "s/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME/" docker/.env.prod

# 查看生成的配置
cat docker/.env.prod
```

**配置说明**：

```properties
# 容器项目名前缀（必须不同）
COMPOSE_PROJECT_NAME=shop-prod

# 数据库密码（自动生成，建议至少 16 字符）
MYSQL_PASSWORD=生成的随机密码

# Redis 密码（自动生成，建议至少 16 字符）
REDIS_PASSWORD=生成的随机密码

# RabbitMQ 密码（自动生成，建议至少 16 字符）
RABBITMQ_PASSWORD=生成的随机密码

# JWT 签名密钥（自动生成，建议至少 32 字符）
JWT_SECRET=生成的随机密钥

# JVM 内存（生产环境建议调大）
ADMIN_JAVA_OPTS=-Xms1g -Xmx2g -XX:+UseG1GC
API_JAVA_OPTS=-Xms1g -Xmx2g -XX:+UseG1GC
```

---

## 6. 数据持久化

### 6.1 数据卷结构

```
docker/data/
├── shop-dev/              # 开发环境数据
│   ├── mysql/
│   ├── redis/
│   ├── kafka/
│   ├── rabbitmq/
│   ├── elasticsearch/     # Elasticsearch 数据
│   ├── logstash/
│   │   └── pipeline/      # Logstash 配置
│   └── kibana/            # Kibana 配置
├── shop-test/             # 测试环境数据
│   ├── mysql/
│   ├── redis/
│   ├── kafka/
│   ├── rabbitmq/
│   ├── elasticsearch/
│   ├── logstash/
│   │   └── pipeline/
│   └── kibana/
├── shop-prod/             # 生产环境数据
│   ├── mysql/
│   ├── redis/
│   ├── kafka/
│   ├── rabbitmq/
│   ├── elasticsearch/
│   ├── logstash/
│   │   └── pipeline/
│   └── kibana/
└── mysql/                 # MySQL 配置（共享）
    └── conf/
└── kafka/                 # Kafka 配置（共享）
    └── config/
```

> **说明**: 数据目录按 `COMPOSE_PROJECT_NAME` 隔离，切换环境不会丢失数据。

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
cp docker/.env.prod.template docker/.env.prod

# 使用 sed 替换密码
sed -i "s/^MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" docker/.env.prod
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" docker/.env.prod
sed -i "s/^RABBITMQ_PASSWORD=.*/RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD/" docker/.env.prod
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" docker/.env.prod
sed -i "s/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME/" docker/.env.prod

# 查看生成的配置
cat docker/.env.prod
```

2. **启动服务**

```bash
docker compose --env-file docker/.env.prod up -d
```

3. **验证部署**

```bash
# 检查容器状态
docker compose --env-file docker/.env.prod ps

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

| 服务           | 容器端口 | 宿主机端口 | 环境变量              |
| -------------- | -------- | ---------- | --------------------- |
| shop-admin-api | 8081     | 8081       | `ADMIN_PORT`          |
| shop-app-api   | 8080     | 8080       | `API_PORT`            |
| shop-admin-ui  | 80       | 8000       | `ADMIN_UI_PORT`       |
| MySQL          | 3306     | 3306       | `MYSQL_PORT`          |
| Redis          | 6379     | 6379       | `REDIS_PORT`          |
| Kafka          | 9092     | 9092       | `KAFKA_PORT`          |
| Kafka          | 9094     | 9094       | `KAFKA_EXTERNAL_PORT` |
| RabbitMQ       | 5672     | 5672       | `RABBITMQ_PORT`       |
| RabbitMQ       | 15672    | 5673       | `RABBITMQ_MGMT_PORT`  |
| Elasticsearch  | 9200     | 9200       | `ES_PORT`             |
| Logstash       | 5044     | 5044       | -                     |
| Kibana         | 5601     | 5601       | -                     |

> **说明**: 所有宿主机端口均可在对应环境变量中自定义。
