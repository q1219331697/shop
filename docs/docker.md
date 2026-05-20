# Shop 项目 Docker 部署文档

## 目录

- [1. 架构总览](#1-架构总览)
- [2. 目录结构](#2-目录结构)
- [3. 快速开始](#3-快速开始)
- [4. 分层部署模式](#4-分层部署模式)
- [5. Dockerfile 详解](#5-dockerfile-详解)
- [6. 构建镜像](#6-构建镜像)
- [7. Docker Compose 详解](#7-docker-compose-详解)
- [8. 环境变量配置](#8-环境变量配置)
- [9. 服务依赖与健康检查](#9-服务依赖与健康检查)
- [10. 日志管理](#10-日志管理)
- [11. 数据持久化与备份](#11-数据持久化与备份)
- [12. 生产环境部署](#12-生产环境部署)
- [13. 常见问题](#13-常见问题)
- [附录](#附录)

---

## 1. 架构总览

### 1.1 服务架构图

```
                         ┌──────────────────────────────────────────────────┐
                         │              Docker Network                      │
                         │           (shop_network / bridge)                │
                         │                                                  │
  ┌──────────┐           │  ┌──────────────┐      ┌──────────────┐         │
  │          │           │  │              │      │              │         │
  │  管理端   │──────────►│  │ shop-admin   │      │   MySQL      │         │
  │  前端     │  :8081    │  │  :8081       │─────►│   :3306      │         │
  │          │           │  │              │      │              │         │
  └──────────┘           │  └──────┬───────┘      └──────────────┘         │
                         │         │              ┌──────────────┐         │
  ┌──────────┐           │  ┌──────┴───────┐      │              │         │
  │          │           │  │              │      │   Redis      │         │
  │  用户端   │──────────►│  │ shop-api     │─────►│   :6379      │         │
  │  前端     │  :8080    │  │  :8080       │      │              │         │
  │          │           │  │              │      └──────────────┘         │
  └──────────┘           │  └──────┬───────┘                               │
                         │         │                                       │
                         │         ▼                                       │
                         │  ┌──────────────┐    ┌──────────────┐          │
                         │  │   Kafka      │    │ Elasticsearch│          │
                         │  │  :9092/:9094 │    │   :9200      │          │
                         │  └──────┬───────┘    └──────▲───────┘          │
                         │         │                   │                  │
                         │         ▼                   │                  │
                         │  ┌──────────────┐           │                  │
                         │  │  Logstash    │───────────┘                  │
                         │  │  :5044       │    ┌──────────────┐          │
                         │  └──────────────┘    │   Kibana     │          │
                         │                      │   :5601      │          │
                         │                      └──────────────┘          │
                         └──────────────────────────────────────────────────┘
```

### 1.2 双模块说明

| 模块 | 端口 | 定位 | 说明 |
|------|------|------|------|
| **shop-admin** | 8081 | 后台管理 API | 管理端 REST 接口，商品/订单/用户管理 |
| **shop-api** | 8080 | 前台用户 API | 用户端 REST 接口，商品浏览/购物车/下单 |

两个模块是**独立运行的 Spring Boot 应用**，共享同一套基础设施（MySQL/Redis/Kafka），但各自独立部署、独立扩缩容。

### 1.3 日志流向

```
shop-admin ──┐                          ┌── Elasticsearch ── Kibana
             ├──► Kafka (shop-logs) ───►│
shop-api ────┘                          └── (Logstash 解析过滤)
```

---

## 2. 目录结构

```
shop/                              # 项目根目录
├── .dockerignore                  # 根目录统一 Docker 忽略规则
│
├── shop-admin/                    # 后台管理模块
│   ├── Dockerfile                 # admin 独立 Dockerfile（就近维护）
│   ├── .dockerignore              # admin 模块忽略规则
│   └── src/
│
├── shop-api/                      # 前台 API 模块
│   ├── Dockerfile                 # api 独立 Dockerfile（就近维护）
│   ├── .dockerignore              # api 模块忽略规则
│   └── src/
│
├── shop-common/                   # 公共模块（库，不可独立运行）
├── shop-mapper/                   # 数据访问层（库，不可独立运行）
├── shop-service/                  # 业务逻辑层（库，不可独立运行）
│
└── docker/                        # 📁 Docker 部署中心（统一管理）
    ├── docker-compose.yml         # 完整编排（基础设施 + 应用）
    ├── docker-compose.infra.yml   # 仅基础设施（MySQL/Redis/Kafka/ELK）
    ├── docker-compose.app.yml     # 仅应用服务（admin + api）
    ├── .env                       # 开发环境变量
    ├── .env.prod.template         # 生产环境变量模板
    ├── config/
    │   └── logstash/
    │       └── shop-logs.conf     # Logstash 管道配置
    ├── volumes/                   # 基础设施数据持久化
    │   ├── mysql/
    │   ├── redis/
    │   ├── kafka/
    │   ├── elasticsearch/
    │   ├── logstash/
    │   └── rabbitmq/
    └── scripts/                   # 📁 部署脚本
        ├── build.sh               # 构建脚本（Linux/Mac）
        ├── build.bat              # 构建脚本（Windows）
        ├── deploy.sh              # 部署脚本（Linux/Mac）
        └── deploy.bat             # 部署脚本（Windows）
```

### 设计原则

| 原则 | 说明 |
|------|------|
| **Dockerfile 就近** | 每个可运行模块的 Dockerfile 放在各自目录下，方便独立维护和 CI/CD |
| **部署配置集中** | docker-compose、环境变量、脚本统一放在 `docker/` 目录 |
| **分层编排** | 基础设施和应用服务分离，支持按需启动 |
| **脚本双平台** | 同时提供 .sh 和 .bat 脚本，兼容 Linux/Mac 和 Windows |

---

## 3. 快速开始

### 3.1 前置条件

- Docker 20.10+ 和 Docker Compose V2
- 内存 ≥ 8GB（Elasticsearch + Kafka 需要较多内存）
- 磁盘 ≥ 20GB

### 3.2 一键部署（全部服务）

```bash
# 1. 构建镜像（在项目根目录）
cd shop
docker/scripts/build.bat          # Windows
# docker/scripts/build.sh         # Linux/Mac

# 2. 启动所有服务
cd docker
docker compose up -d

# 3. 查看状态
docker compose ps

# 4. 查看日志
docker compose logs -f shop-admin
docker compose logs -f shop-api
```

### 3.3 开发模式（仅基础设施 + 本地 IDE）

```bash
# 仅启动 MySQL、Redis、Kafka、ELK
cd docker
docker compose -f docker-compose.infra.yml up -d

# 在 IDE 中启动 shop-admin / shop-api（连接 localhost 的基础设施）
```

### 3.4 验证部署

```bash
# 检查所有容器状态
docker compose ps

# 健康检查
curl http://localhost:8081/actuator/health   # shop-admin
curl http://localhost:8080/actuator/health   # shop-api

# API 文档
# http://localhost:8081/doc.html             # shop-admin
# http://localhost:8080/doc.html             # shop-api
```

---

## 4. 分层部署模式

项目提供三个 docker-compose 文件，支持灵活的部署组合：

### 4.1 三种编排文件

| 文件 | 包含服务 | 使用场景 |
|------|----------|----------|
| `docker-compose.infra.yml` | MySQL、Redis、Kafka、RabbitMQ、ELK | 开发时在 IDE 运行应用 |
| `docker-compose.app.yml` | shop-admin、shop-api | 基础设施已就绪，只部署应用 |
| `docker-compose.yml` | 全部服务 | 一键部署完整环境 |

### 4.2 典型使用场景

**场景 A：日常开发（推荐）**

```bash
# 只启动基础设施，应用在 IDE 中调试
docker compose -f docker-compose.infra.yml up -d

# IDE 中配置连接:
#   MySQL:   localhost:3306
#   Redis:   localhost:6379
#   Kafka:   localhost:9094
```

**场景 B：测试应用容器化**

```bash
# 先启动基础设施
docker compose -f docker-compose.infra.yml up -d

# 再启动应用（自动连接同一网络）
docker compose -f docker-compose.app.yml up -d
```

**场景 C：完整部署**

```bash
# 一键启动全部
docker compose up -d
```

**场景 D：仅更新应用**

```bash
# 重新构建镜像
docker build -t shop-admin:1.0.0 -f shop-admin/Dockerfile .

# 仅重启应用服务
docker compose -f docker-compose.app.yml up -d shop-admin
```

### 4.3 使用部署脚本

```bash
# Linux/Mac
./scripts/deploy.sh infra     # 仅基础设施
./scripts/deploy.sh app       # 仅应用
./scripts/deploy.sh all       # 全部
./scripts/deploy.sh down      # 停止
./scripts/deploy.sh status    # 状态
./scripts/deploy.sh logs shop-admin  # 日志

# Windows
scripts\deploy.bat infra
scripts\deploy.bat app
scripts\deploy.bat all
scripts\deploy.bat down
scripts\deploy.bat status
scripts\deploy.bat logs shop-admin
```

---

## 5. Dockerfile 详解

### 5.1 多阶段构建

shop-admin 和 shop-api 使用相同的多阶段构建模式：

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│     Stage 1: 构建阶段        │     │     Stage 2: 运行阶段        │
│                             │     │                             │
│  基础镜像: maven:3.9-       │     │  基础镜像: eclipse-temurin: │
│           eclipse-temurin-17│     │            17-jre-alpine    │
│  产物: shop-xxx-1.0.0.jar  │────►│  体积: ~170MB (vs JDK 450MB)│
│  体积: ~800MB               │     │  用户: appuser (非 root)    │
│                             │     │  时区: Asia/Shanghai        │
└─────────────────────────────┘     └─────────────────────────────┘
```

### 5.2 依赖缓存优化

```dockerfile
# 先复制 POM 文件 → 下载依赖（仅 POM 变化时重新下载）
COPY pom.xml ./
COPY shop-common/pom.xml shop-common/
COPY shop-mapper/pom.xml shop-mapper/
COPY shop-service/pom.xml shop-service/
COPY shop-admin/pom.xml shop-admin/
RUN mvn dependency:go-offline -B -pl shop-admin -am

# 再复制源码 → 编译打包（源码变更不影响依赖缓存）
COPY shop-common/ shop-common/
COPY shop-mapper/ shop-mapper/
COPY shop-service/ shop-service/
COPY shop-admin/ shop-admin/
RUN mvn clean package -DskipTests -B -pl shop-admin -am
```

**缓存效果：**

| 变更内容 | 依赖下载 | 编译打包 | 总耗时 |
|----------|----------|----------|--------|
| 首次构建 | ✅ 下载 | ✅ 编译 | ~5 分钟 |
| 仅改源码 | ❌ 缓存 | ✅ 编译 | ~1 分钟 |
| 仅改 POM | ✅ 下载 | ✅ 编译 | ~5 分钟 |

### 5.3 两个模块的差异

| 配置项 | shop-admin | shop-api |
|--------|-----------|----------|
| 端口 | 8081 | 8080 |
| JAR 名 | shop-admin-1.0.0.jar | shop-api-1.0.0.jar |
| 描述 | 后台管理服务 | 前台API服务 |
| Maven 模块 | `-pl shop-admin` | `-pl shop-api` |

---

## 6. 构建镜像

### 6.1 使用构建脚本（推荐）

```bash
# Linux/Mac
cd docker
./scripts/build.sh              # 构建所有
./scripts/build.sh admin        # 仅构建 admin
./scripts/build.sh api          # 仅构建 api
./scripts/build.sh --no-cache   # 不使用缓存
./scripts/build.sh -v 1.0.1     # 指定版本号

# Windows
scripts\build.bat              # 构建所有
scripts\build.bat admin        # 仅构建 admin
scripts\build.bat api          # 仅构建 api
scripts\build.bat --no-cache   # 不使用缓存
```

### 6.2 手动构建

```bash
# 在项目根目录执行
cd shop

# 构建 shop-admin
docker build -t shop-admin:1.0.0 -f shop-admin/Dockerfile .

# 构建 shop-api
docker build -t shop-api:1.0.0 -f shop-api/Dockerfile .

# 同时打上 latest 标签
docker build -t shop-admin:1.0.0 -t shop-admin:latest -f shop-admin/Dockerfile .
docker build -t shop-api:1.0.0 -t shop-api:latest -f shop-api/Dockerfile .
```

### 6.3 构建后验证

```bash
# 查看镜像
docker images | grep shop

# 预期输出:
# shop-admin   1.0.0   ...   ~170MB
# shop-api      1.0.0   ...   ~170MB

# 测试运行
docker run --rm -p 8081:8081 shop-admin:1.0.0
docker run --rm -p 8080:8080 shop-api:1.0.0
```

---

## 7. Docker Compose 详解

### 7.1 服务依赖关系

```
                    MySQL (healthy) ──────┐
                                          ├──► shop-admin
                    Redis (healthy) ──────┤
                                          ├──► shop-api
                    Kafka ────────────────┘

  Elasticsearch (healthy) ───► Logstash ───► Kibana
```

### 7.2 健康检查配置

| 服务 | 检查方式 | 间隔 | 启动等待 |
|------|----------|------|----------|
| MySQL | `mysqladmin ping` | 10s | 30s |
| Redis | `redis-cli ping` | 10s | - |
| Kafka | `kafka-broker-api-versions` | 15s | 30s |
| Elasticsearch | `curl /_cluster/health` | 15s | 40s |
| RabbitMQ | `rabbitmq-diagnostics` | 15s | 30s |
| shop-admin | `curl /actuator/health` | 30s | 60s |
| shop-api | `curl /actuator/health` | 30s | 60s |

### 7.3 网络架构

所有服务在同一个 `shop_network` 桥接网络中，通过**服务名**互相访问：

```
容器内访问:
  shop-admin → mysql:3306      ✅ 使用服务名
  shop-admin → redis:6379      ✅ 使用服务名
  shop-admin → kafka:9092      ✅ 使用内部端口

宿主机访问:
  开发者 → localhost:3306      ✅ 映射端口
  开发者 → localhost:8081      ✅ 映射端口
  开发者 → localhost:9094      ✅ Kafka 外部端口
```

> **重要**: 容器内使用 `kafka:9092`（内部端口），宿主机使用 `localhost:9094`（外部端口）。

---

## 8. 环境变量配置

### 8.1 完整变量列表

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_NAME` | `shop` | 容器名前缀 |
| `APP_VERSION` | `1.0.0` | 镜像版本标签 |
| `ADMIN_PORT` | `8081` | admin 宿主机端口 |
| `API_PORT` | `8080` | api 宿主机端口 |
| `ADMIN_JAVA_OPTS` | `-Xms256m -Xmx512m -XX:+UseG1GC` | admin JVM 参数 |
| `API_JAVA_OPTS` | `-Xms256m -Xmx512m -XX:+UseG1GC` | api JVM 参数 |
| `MYSQL_USERNAME` | `root` | 数据库用户名 |
| `MYSQL_PASSWORD` | (空) | 数据库密码 |
| `REDIS_PASSWORD` | (空) | Redis 密码 |
| `APP_LOG_KAFKA_BOOTSTRAP__SERVERS` | `kafka:9092` | 日志Kafka服务器地址 |

### 8.2 Spring Boot 环境变量映射

```
环境变量                              →  配置属性
SPRING_DATASOURCE_URL                →  spring.datasource.url
SPRING_DATASOURCE_USERNAME           →  spring.datasource.username
SPRING_DATASOURCE_PASSWORD           →  spring.datasource.password
SPRING_DATA_REDIS_HOST               →  spring.data.redis.host
SPRING_DATA_REDIS_PORT               →  spring.data.redis.port
SPRING_DATA_REDIS_PASSWORD           →  spring.data.redis.password
```

### 8.3 开发 vs 生产环境变量

```bash
# 开发环境: docker/.env（默认值，无需修改）
MYSQL_PASSWORD=
REDIS_PASSWORD=

# 生产环境: docker/.env.prod（⚠️ 必须修改）
MYSQL_PASSWORD=YOUR_STRONG_PASSWORD
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
ADMIN_JAVA_OPTS=-Xms1g -Xmx2g -XX:+UseG1GC
API_JAVA_OPTS=-Xms1g -Xmx2g -XX:+UseG1GC
```

---

## 9. 服务依赖与健康检查

### 9.1 启动顺序

Docker Compose 根据 `depends_on` + `condition` 控制启动顺序：

```
1. MySQL、Redis、Kafka、RabbitMQ、Elasticsearch（无依赖，并行启动）
2. Logstash、Kibana（依赖 ES healthy）
3. shop-admin、shop-api（依赖 MySQL + Redis healthy）
```

### 9.2 手动检查服务健康

```bash
# 检查所有容器健康状态
docker compose ps

# 检查单个容器
docker inspect --format='{{.State.Health.Status}}' shop-admin
docker inspect --format='{{.State.Health.Status}}' shop-mysql

# 查看健康检查日志
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' shop-admin
```

---

## 10. 日志管理

### 10.1 日志架构

```
shop-admin (Log4j2) ──┐
                       ├──► Kafka (shop-logs) ──► Logstash ──► Elasticsearch ──► Kibana
shop-api (Log4j2) ────┘
```

### 10.2 容器内 vs 宿主机 Kafka 配置

| 环境 | APP_LOG_KAFKA_BOOTSTRAP__SERVERS | 说明 |
|------|----------------------------------|------|
| 容器内 | `kafka:9092` | 使用服务名 + 内部端口 |
| 宿主机 IDE | `localhost:9094` | 使用 localhost + 外部端口 |

### 10.3 查看日志

```bash
# Docker 容器日志
docker compose logs -f shop-admin
docker compose logs -f shop-api

# Kibana 可视化
# http://localhost:5601 → Analytics → Discover
# 创建数据视图: shop-admin-logs-* / shop-api-logs-*
```

---

## 11. 数据持久化与备份

### 11.1 数据卷映射

| 服务 | 容器路径 | 宿主机路径 |
|------|----------|------------|
| MySQL | `/var/lib/mysql` | `./volumes/mysql/data` |
| Redis | `/data` | `./volumes/redis/data` |
| Kafka | `/var/lib/kafka/data` | `./volumes/kafka/data` |
| Elasticsearch | `/usr/share/elasticsearch/data` | `./volumes/elasticsearch/data` |

### 11.2 备份与恢复

**MySQL:**

```bash
# 备份
docker exec shop-mysql mysqldump -u root shop > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i shop-mysql mysql -u root shop < backup_20260101.sql
```

**Redis:**

```bash
# 触发快照
docker exec shop-redis redis-cli BGSAVE

# 复制备份
docker cp shop-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

---

## 12. 生产环境部署

### 12.1 部署清单

- [ ] 复制 `.env.prod.template` 为 `.env.prod` 并修改所有密码
- [ ] 调整 JVM 参数（建议 `-Xms1g -Xmx2g`）
- [ ] 配置 Elasticsearch 安全认证
- [ ] 设置 MySQL 强密码
- [ ] 设置 Redis 密码
- [ ] 配置日志保留策略
- [ ] 设置容器资源限制

### 12.2 生产部署命令

```bash
# 1. 构建镜像
./scripts/build.sh -v 1.0.0

# 2. 使用生产环境变量启动
docker compose --env-file .env.prod up -d

# 3. 验证
docker compose ps
curl http://localhost:8081/actuator/health
curl http://localhost:8080/actuator/health
```

### 12.3 资源限制

```yaml
# docker-compose.app.yml 中添加
shop-admin:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### 12.4 镜像推送私有仓库

```bash
# 登录
docker login registry.example.com

# 标记
docker tag shop-admin:1.0.0 registry.example.com/shop-admin:1.0.0
docker tag shop-api:1.0.0 registry.example.com/shop-api:1.0.0

# 推送
docker push registry.example.com/shop-admin:1.0.0
docker push registry.example.com/shop-api:1.0.0
```

### 12.5 滚动更新

```bash
# 构建新版本
./scripts/build.sh -v 1.0.1

# 更新 shop-admin
docker compose -f docker-compose.app.yml up -d shop-admin

# 更新 shop-api
docker compose -f docker-compose.app.yml up -d shop-api
```

---

## 13. 常见问题

### 13.1 容器启动失败

```bash
# 查看日志
docker compose logs shop-admin

# 常见原因:
# 1. MySQL 未就绪 → 等待 MySQL healthy 后重启
# 2. 端口冲突 → 修改 .env 中的端口
# 3. 内存不足 → 调整 JAVA_OPTS 或 Docker 内存限制
```

### 13.2 无法连接 MySQL/Redis

```bash
# 检查网络
docker exec shop-admin ping mysql
docker exec shop-admin ping redis

# 解决方案:
# 1. 确保在同一 Docker 网络
# 2. 容器内使用服务名（mysql/redis），而非 localhost
# 3. 检查密码配置
```

### 13.3 Kafka 连接失败

```bash
# 容器内: APP_LOG_KAFKA_BOOTSTRAP__SERVERS=kafka:9092
# 宿主机: APP_LOG_KAFKA_BOOTSTRAP__SERVERS=localhost:9094

# 检查 Kafka 状态
docker exec shop-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### 13.4 镜像构建缓慢

```bash
# 利用 Docker 缓存: 先改源码再改 POM
# 依赖下载仅在 POM 变更时触发

# 完全重新构建
docker build --no-cache -t shop-admin:1.0.0 -f shop-admin/Dockerfile .
```

### 13.5 Elasticsearch 内存不足

```bash
# 调整 ES JVM 堆内存
# docker-compose.infra.yml 中:
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"

# 增加 Docker Desktop 内存: Settings → Resources → Memory (建议 8GB+)
```

---

## 附录

### A. 端口速查表

| 服务 | 容器端口 | 宿主机端口 | 用途 |
|------|----------|------------|------|
| shop-admin | 8081 | 8081 | 管理 API |
| shop-api | 8080 | 8080 | 用户 API |
| MySQL | 3306 | 3306 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| Kafka | 9092 | 9092 | 内部通信 |
| Kafka | 9094 | 9094 | 外部访问 |
| RabbitMQ | 5672 | 5672 | AMQP |
| RabbitMQ | 15672 | 15672 | 管理后台 |
| Elasticsearch | 9200 | 9200 | REST API |
| Elasticsearch | 9300 | 9300 | 节点通信 |
| Logstash | 5044 | 5044 | Beats 输入 |
| Logstash | 9600 | 9600 | API |
| Kibana | 5601 | 5601 | 可视化面板 |

### B. 常用命令速查

```bash
# === 构建镜像 ===
docker build -t shop-admin:1.0.0 -f shop-admin/Dockerfile .     # 手动构建
docker/scripts/build.sh admin                                     # 脚本构建

# === 服务管理 ===
docker compose up -d                                              # 启动全部
docker compose -f docker-compose.infra.yml up -d                  # 仅基础设施
docker compose -f docker-compose.app.yml up -d                    # 仅应用
docker compose down                                               # 停止全部
docker compose restart shop-admin                                 # 重启单个

# === 日志查看 ===
docker compose logs -f shop-admin                                 # 实时日志
docker compose logs --tail 100 shop-api                           # 最近100行

# === 状态检查 ===
docker compose ps                                                 # 所有容器
docker inspect --format='{{.State.Health.Status}}' shop-admin     # 健康状态

# === 清理 ===
docker system df                                                  # 磁盘占用
docker system prune                                               # 一键清理
docker volume prune                                               # 清理无用卷
```

### C. 开发工作流推荐

```
1. 启动基础设施
   docker compose -f docker-compose.infra.yml up -d

2. IDE 中开发调试 shop-admin / shop-api
   （连接 localhost:3306 / localhost:6379 / localhost:9094）

3. 测试容器化部署
   docker build -t shop-admin:1.0.0 -f shop-admin/Dockerfile .
   docker compose -f docker-compose.app.yml up -d shop-admin

4. 验证通过后推送镜像
   docker push registry.example.com/shop-admin:1.0.0
```
```
