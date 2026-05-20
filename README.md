
# Shop 商城项目

<p align="center">
  <strong>Spring Boot 3.5 + Vue 3 全栈商城系统</strong>
</p>

---

## 📖 项目简介

Shop 是一个基于 Spring Boot 3.5 和 Vue 3 构建的全栈商城系统，采用前后端分离架构，支持 Docker 容器化部署。项目包含后台管理（shop-admin）和前台 API（shop-api）两个核心服务，配套完整的中间件基础设施。

## 🏗️ 项目结构

```
shop/
├── backend/                  # 后端工程（Maven 多模块）
│   ├── shop-admin/           # 后台管理服务（端口 8081）
│   ├── shop-api/             # 前台 API 服务（端口 8080）
│   ├── shop-common/          # 公共模块（工具类、常量、通用实体）
│   ├── shop-mapper/          # 数据访问层（Mapper / DAO）
│   └── shop-service/         # 业务逻辑层（Service）
├── frontend/                 # 前端工程
│   ├── admin-ui/             # 后台管理界面（Vue 3 + Element Plus）
│   └── mini-app/             # 小程序端
├── docker/                   # Docker 部署配置
│   ├── Dockerfile.admin      # shop-admin 多阶段构建
│   ├── Dockerfile.api        # shop-api 多阶段构建
│   ├── docker-compose.infra.yml  # 基础设施编排
│   ├── docker-compose.app.yml    # 应用服务编排
│   ├── docker-compose.yml        # 完整编排（include）
│   ├── .env                  # 环境变量配置
│   ├── maven/                # Maven settings.xml（阿里云镜像）
│   ├── scripts/              # 构建 & 部署脚本
│   │   ├── build.bat / build.sh
│   │   └── deploy.bat / deploy.sh
│   ├── config/               # Logstash 等配置
│   └── volumes/              # 数据持久化卷
└── docs/                     # 项目文档
```

## 🛠️ 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 17 | Eclipse Temurin |
| Spring Boot | 3.5.14 | 应用框架 |
| MyBatis Plus | 3.5.16 | ORM 框架 |
| Knife4j | 4.5.0 | API 文档 |
| Hutool | 5.8.44 | 工具库 |
| JWT | 0.12.7 | 认证令牌 |

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.13 | 前端框架 |
| Vue Router | 4.5.0 | 路由管理 |
| Pinia | 3.0.2 | 状态管理 |
| Element Plus | 2.9.7 | UI 组件库 |
| Vite | 6.3.5 | 构建工具 |
| TypeScript | 5.7.3 | 类型支持 |
| Axios | 1.9.0 | HTTP 客户端 |

### 中间件

| 组件 | 版本 | 端口 | 说明 |
|------|------|------|------|
| MySQL | 9.7 | 3306 | 关系型数据库 |
| Redis | 8 (Alpine) | 6379 | 缓存 |
| Kafka | Latest | 9092 / 9094 | 消息队列（内部 / 外部） |
| RabbitMQ | 3-management | 5672 / 15672 | 消息队列（AMQP / 管理后台） |
| Elasticsearch | 9.3.3 | 9200 / 9300 | 搜索引擎 & 日志存储 |
| Logstash | 9.3.3 | 5044 / 9600 | 日志处理 |
| Kibana | 9.3.3 | 5601 | 日志可视化 |

## 🚀 快速开始

### 环境要求

| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 20 GB | 50 GB+ |

### 前置条件

- [Docker](https://www.docker.com/products/docker-desktop) 已安装并运行
- [JDK 17](https://adoptium.net/) （本地开发时需要）
- [Node.js 18+](https://nodejs.org/) （前端开发时需要）

### Docker 部署（推荐）

#### 1️⃣ 启动中间件

```bash
cd docker

# 启动基础设施（MySQL、Redis、Kafka、RabbitMQ、ELK）
docker compose -f docker-compose.infra.yml up -d

# 查看状态
docker compose -f docker-compose.infra.yml ps
```

#### 2️⃣ 构建应用镜像

```bash
# 回到项目根目录
cd ..

# 构建 shop-admin 镜像（多阶段构建，无需本机 Maven）
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .

# 构建 shop-api 镜像
docker build -t shop-api:1.0.0 -f docker/Dockerfile.api .

# 或使用构建脚本
docker/scripts/build.bat all          # Windows
./docker/scripts/build.sh all         # Linux / macOS
```

#### 3️⃣ 启动应用服务

```bash
cd docker

# 同时指定 infra 和 app 配置文件启动应用（app 依赖 infra 中的 mysql、redis）
docker compose -f docker-compose.infra.yml -f docker-compose.app.yml up -d shop-admin shop-api

# 查看状态
docker compose -f docker-compose.infra.yml -f docker-compose.app.yml ps
```

> ⚠️ **注意**: `docker-compose.app.yml` 中的 `depends_on` 引用了 `docker-compose.infra.yml` 中定义的 `mysql` 和 `redis` 服务，因此单独使用 `docker-compose.app.yml` 启动会报错。必须同时指定两个文件，或使用 `docker compose up -d`（通过 `docker-compose.yml` 的 include 机制加载全部服务）。

#### 🎯 一键部署

```bash
cd docker

# 方式一：使用部署脚本
docker/scripts/deploy.bat build       # Windows（构建 + 启动全部）
./docker/scripts/deploy.sh build      # Linux / macOS

# 方式二：使用 docker compose（需先构建镜像）
docker compose up -d
```

### 本地开发

#### 后端

```bash
cd backend

# 1. 先启动中间件
cd ../docker
docker compose -f docker-compose.infra.yml up -d
cd ../backend

# 2. 编译项目
./mvnw clean package -DskipTests

# 3. 启动 shop-admin
java -jar shop-admin/target/shop-admin-1.0.0.jar

# 4. 启动 shop-api
java -jar shop-api/target/shop-api-1.0.0.jar
```

#### 前端

```bash
cd frontend/admin-ui

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🌐 服务访问

| 服务 | 地址 | 说明 |
|------|------|------|
| shop-admin API | http://localhost:8081 | 后台管理接口 |
| shop-admin Doc | http://localhost:8081/doc.html | 后台 API 文档 |
| shop-api API | http://localhost:8080 | 前台接口 |
| shop-api Doc | http://localhost:8080/doc.html | 前台 API 文档 |
| RabbitMQ 管理 | http://localhost:15672 | 账号: shop / shop123 |
| Elasticsearch | http://localhost:9200 | REST API |
| Kibana | http://localhost:5601 | 日志可视化 |

## 📂 架构说明

### 日志流向

```
shop-admin / shop-api (Log4j2 Kafka Appender)
    │
    ▼
Kafka (shop-logs topic)
    │
    ▼
Logstash (解析、过滤、格式化)
    │
    ▼
Elasticsearch (索引: shop-logs-YYYY.MM.dd)
    │
    ▼
Kibana (可视化查询)
```

### Docker 网络架构

所有容器运行在 `shop_network`（bridge 网络）中，应用服务通过服务名访问中间件：

- shop-admin / shop-api → `mysql:3306`
- shop-admin / shop-api → `redis:6379`
- shop-admin / shop-api → `kafka:9092`

## 🔧 常用命令

```bash
# ==================== Docker Compose ====================
# 启动基础设施
docker compose -f docker/docker-compose.infra.yml up -d

# 启动全部服务
cd docker && docker compose up -d

# 停止全部服务
cd docker && docker compose down

# 查看服务状态
docker compose -f docker/docker-compose.infra.yml ps
docker compose -f docker/docker-compose.app.yml ps

# 查看日志
docker compose -f docker/docker-compose.app.yml logs -f shop-admin
docker compose -f docker/docker-compose.infra.yml logs -f mysql

# ==================== 镜像构建 ====================
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build -t shop-api:1.0.0 -f docker/Dockerfile.api .
docker build --no-cache -t shop-admin:1.0.0 -f docker/Dockerfile.admin .   # 不使用缓存

# ==================== 部署脚本 ====================
docker/scripts/deploy.bat infra     # 仅启动基础设施
docker/scripts/deploy.bat app       # 仅启动应用
docker/scripts/deploy.bat all       # 启动全部
docker/scripts/deploy.bat down      # 停止全部
docker/scripts/deploy.bat status    # 查看状态
docker/scripts/deploy.bat logs      # 查看日志
```

## 📄 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源协议发布。
