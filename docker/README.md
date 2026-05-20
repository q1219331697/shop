# Shop 项目 Docker 部署文档

## 目录

- [1. 概述](#1-概述)
- [2. 架构说明](#2-架构说明)
- [3. 环境准备](#3-环境准备)
- [4. 快速开始](#4-快速开始)
- [5. Dockerfile 详解](#5-dockerfile-详解)
- [6. 构建镜像](#6-构建镜像)
- [7. 运行容器](#7-运行容器)
- [8. Docker Compose 部署](#8-docker-compose-部署)
- [9. 环境变量配置](#9-环境变量配置)
- [10. 数据持久化](#10-数据持久化)
- [11. 日志管理](#11-日志管理)
- [12. 健康检查](#12-健康检查)
- [13. 生产环境部署](#13-生产环境部署)
- [14. 常见问题](#14-常见问题)

---

## 1. 概述

Shop 是商城项目，包含 shop-admin（后台管理）和 shop-api（前台API）两个服务模块。本文档详细说明如何使用 Docker 容器化部署 Shop 项目。

### 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 17 | Eclipse Temurin JRE |
| Spring Boot | 3.5.14 | 应用框架 |
| MySQL | 9.7 | 数据库 |
| Redis | 8 (Alpine) | 缓存 |
| Kafka | Latest | 消息队列（日志收集） |
| Elasticsearch | 9.3.3 | 日志存储 |
| Logstash | 9.3.3 | 日志处理 |
| Kibana | 9.3.3 | 日志可视化 |

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| shop-admin | 8081 | 后台管理 API |
| shop-api | 8080 | 前台 API |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| Kafka | 9092 / 9094 | 内部通信 / 外部访问 |
| Elasticsearch | 9200 / 9300 | REST API / 节点通信 |
| Logstash | 5044 / 9600 | Beats 输入 / API |
| Kibana | 5601 | 可视化面板 |
| RabbitMQ | 5672 / 15672 | AMQP / 管理后台 |

---

## 2. 架构说明

### 容器架构图

```
                    ┌─────────────────────────────────────────┐
                    │           Docker Network                │
                    │        (shop_network / bridge)          │
                    │                                         │
  ┌──────────┐      │  ┌───────────┐    ┌───────────┐       │
  │          │      │  │           │    │           │       │
  │ Kibana   │◄─────┼──┤ Elastic   │◄───┤ Logstash  │       │
  │ :5601    │      │  │ search    │    │           │       │
  │          │      │  │ :9200     │    │ :5044     │       │
  └──────────┘      │  └───────────┘    └─────┬─────┘       │
                    │                         │              │
                    │                         ▲              │
                    │                         │              │
                    │                    ┌────┴────┐         │
                    │                    │  Kafka   │         │
                    │                    │ :9092    │         │
                    │                    └────┬────┘         │
                    │                         │              │
                    │                         ▲              │
  ┌──────────┐      │  ┌───────────┐    ┌─────┴─────┐      │
  │          │      │  │           │    │           │      │
  │ 管理端    │──────┼─►│shop-admin │    │  MySQL    │      │
  │          │      │  │ :8081     │───►│  :3306    │      │
  └──────────┘      │  └─────┬─────┘    └───────────┘      │
                    │        │                              │
  ┌──────────┐      │  ┌─────┴─────┐                        │
  │          │      │  │           │                        │
  │ 前台用户  │──────┼─►│ shop-api  │                        │
  │          │      │  │ :8080     │───┐                    │
  └──────────┘      │  └───────────┘   │                    │
                    │        │         │                    │
                    │        ▼         │                    │
                    │  ┌───────────┐   │                    │
                    │  │  Redis    │◄──┘                    │
                    │  │  :6379    │                        │
                    │  └───────────┘                        │
                    │                                         │
                    └─────────────────────────────────────────┘
```

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

---

## 3. 环境准备

### 3.1 安装 Docker

**Windows:**

```bash
# 下载并安装 Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop

# 验证安装
docker --version
docker compose version
```

**Linux (Ubuntu/Debian):**

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

### 3.2 系统要求

| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 20 GB | 50 GB+ |

> **注意**: Elasticsearch 和 Kafka 对内存要求较高，建议至少 8GB 内存。

### 3.3 提前拉取基础镜像

多阶段构建使用以下基础镜像，建议提前拉取以加速构建：

```bash
# 构建阶段：Maven + JDK 17（约 500MB）
docker pull maven:3.9-eclipse-temurin-17

# 运行阶段：JRE 17 Alpine（约 170MB）
docker pull eclipse-temurin:17-jre-alpine
```

> **说明**: 不提前拉取也可以，`docker build` 时会自动下载。提前拉取的好处是构建过程更顺畅，避免网络问题导致构建中断。

---

## 4. 快速开始

### 4.1 一键启动（开发环境）

```bash
# 1. 进入 docker 目录
cd docker

# 2. 启动所有基础设施服务（MySQL、Redis、Kafka、ELK）
docker compose up -d

# 3. 回到项目根目录，构建镜像（多阶段构建，无需本机 Maven）
cd ..
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build -t shop-api:1.0.0 -f docker/Dockerfile.api .

# 4. 启动所有服务（基础设施 + 应用）
cd docker
docker compose up -d

# 5. 查看启动日志
docker compose logs -f
```

### 4.2 验证部署

```bash
# 检查容器状态
docker compose ps

# 健康检查
curl http://localhost:8081/actuator/health
curl http://localhost:8080/actuator/health

# 访问 API 文档
# shop-admin: http://localhost:8081/doc.html
# shop-api:   http://localhost:8080/doc.html
```

---

## 5. Dockerfile 详解

shop-admin 和 shop-api 均采用**多阶段构建**方式，第一阶段在容器内用 Maven 编译打包，第二阶段将 JAR 复制到精简的 JRE Alpine 镜像中运行。两个服务的 Dockerfile 结构相同，仅模块名和端口不同。

### 5.1 构建流程

```bash
# 构建所有镜像（无需本机安装 Maven）
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build -t shop-api:1.0.0 -f docker/Dockerfile.api .

# 或使用构建脚本
docker/scripts/build.sh all
```

### 5.2 多阶段构建详解（以 shop-admin 为例）

```dockerfile
# ---- 阶段1: Maven 构建 ----
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# 配置阿里云 Maven 镜像加速
COPY docker/maven/settings.xml /root/.m2/settings.xml

# 先复制 POM，利用 Docker 缓存加速依赖下载
COPY pom.xml ./
COPY shop-common/pom.xml ./shop-common/
COPY shop-mapper/pom.xml ./shop-mapper/
COPY shop-service/pom.xml ./shop-service/
COPY shop-admin/pom.xml ./shop-admin/
COPY shop-api/pom.xml ./shop-api/

# 下载依赖（POM 不变时此层被缓存）
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn dependency:go-offline -pl shop-admin -am -B

# 复制源代码并构建
COPY shop-common/ ./shop-common/
COPY shop-mapper/ ./shop-mapper/
COPY shop-service/ ./shop-service/
COPY shop-admin/ ./shop-admin/

RUN --mount=type=cache,target=/root/.m2/repository \
    mvn clean package -DskipTests -Dcheckstyle.skip=true -pl shop-admin -am -B

# ---- 阶段2: 运行镜像 ----
FROM eclipse-temurin:17-jre-alpine

RUN apk add --no-cache curl tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# 从构建阶段复制 JAR
COPY --from=builder --chown=appuser:appgroup /build/shop-admin/target/shop-admin-*.jar app.jar

USER appuser
EXPOSE 8081
```

> shop-api 的 Dockerfile 结构完全相同，仅将 `shop-admin` 替换为 `shop-api`，端口为 `8080`。

**关键设计:**

- **多阶段构建**: 编译环境和运行环境分离，最终镜像只包含 JRE + JAR
- **阿里云镜像**: `docker/maven/settings.xml` 配置阿里云加速，容器内依赖下载更快
- **BuildKit 缓存**: `--mount=type=cache` 持久化 Maven 仓库，POM 不变时依赖层直接复用
- **分层 COPY**: 先 COPY POM 下载依赖（缓存层），再 COPY 源码编译（代码变更只重建此层）
- **非 root 用户**: 安全最佳实践，避免容器内权限过大
- **时区预设**: 设置为 Asia/Shanghai，确保日志时间正确

---

## 6. 构建镜像

### 6.1 标准构建

```bash
# 在项目根目录执行
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build -t shop-api:1.0.0 -f docker/Dockerfile.api .
```

### 6.2 指定平台构建

```bash
# 构建 Linux AMD64 镜像（在 Windows ARM 设备上交叉编译）
docker build --platform linux/amd64 -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build --platform linux/amd64 -t shop-api:1.0.0 -f docker/Dockerfile.api .
```

### 6.3 不使用缓存构建

```bash
# 完全重新构建（不使用任何缓存层）
docker build --no-cache -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
docker build --no-cache -t shop-api:1.0.0 -f docker/Dockerfile.api .
```

### 6.4 使用构建脚本

```bash
# 使用脚本构建（推荐）
docker/scripts/build.sh all           # 构建所有镜像
docker/scripts/build.sh admin         # 仅构建 shop-admin
docker/scripts/build.sh api           # 仅构建 shop-api
docker/scripts/build.sh --no-cache    # 不使用缓存构建
docker/scripts/build.sh -v 2.0.0      # 指定版本号
```

### 6.5 镜像标签规范

```bash
# 版本标签
docker tag shop-admin:1.0.0 shop-admin:latest
docker tag shop-api:1.0.0 shop-api:latest
docker tag shop-admin:1.0.0 registry.example.com/shop-admin:1.0.0
docker tag shop-api:1.0.0 registry.example.com/shop-api:1.0.0
```

---

## 7. 运行容器

### 7.1 基础运行

```bash
docker run -d --name shop-admin -p 8081:8081 shop-admin:1.0.0
docker run -d --name shop-api -p 8080:8080 shop-api:1.0.0
```

### 7.2 使用 Docker Compose（推荐）

推荐使用 Docker Compose 统一管理服务，无需手动指定环境变量：

```bash
cd docker

# 启动基础设施
docker/scripts/deploy.sh infra

# 构建并启动应用
docker/scripts/deploy.sh build
```

### 7.3 手动连接基础设施

```bash
# shop-admin
docker run -d   --name shop-admin   --network shop_network   -p 8081:8081   -e SPRING_DATASOURCE_URL="jdbc:mysql://mysql:3306/shop?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true"   -e SPRING_DATASOURCE_USERNAME=root   -e SPRING_DATA_REDIS_HOST=redis   -e SPRING_DATA_REDIS_PORT=6379   -e APP_LOG_KAFKA_BOOTSTRAP__SERVERS=kafka:9092   shop-admin:1.0.0

# shop-api
docker run -d   --name shop-api   --network shop_network   -p 8080:8080   -e SPRING_DATASOURCE_URL="jdbc:mysql://mysql:3306/shop?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true"   -e SPRING_DATASOURCE_USERNAME=root   -e SPRING_DATA_REDIS_HOST=redis   -e SPRING_DATA_REDIS_PORT=6379   -e APP_LOG_KAFKA_BOOTSTRAP__SERVERS=kafka:9092   shop-api:1.0.0
```

### 7.4 容器管理命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f shop-admin

# 查看最近 100 行日志
docker logs --tail 100 shop-admin

# 进入容器
docker exec -it shop-admin sh

# 停止容器
docker stop shop-admin

# 启动已停止的容器
docker start shop-admin

# 重启容器
docker restart shop-admin

# 删除容器
docker rm -f shop-admin
```

---

## 8. Docker Compose 部署

### 8.1 完整 Docker Compose 配置

在项目 `docker/` 目录下已有基础设施的 `docker-compose.yml`，可以扩展加入 shop-admin 服务：

```yaml
# docker/docker-compose.yml 中追加 shop-admin 服务

services:
  # ... 已有的 MySQL、Redis、Kafka、ELK 等服务 ...

  # ==================== shop-admin 后台管理服务 ====================
  shop-admin:
    image: shop-admin:1.0.0
    container_name: ${APP_NAME}-admin
    ports:
      - "8081:8081"
    environment:
      # JVM 参数
      JAVA_OPTS: "-Xms256m -Xmx512m -XX:+UseG1GC"
      # 数据源配置（使用服务名连接）
      SPRING_DATASOURCE_URL: "jdbc:mysql://mysql:3306/shop?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true"
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: ""
      # Redis 配置
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      # 日志Kafka配置
      APP_LOG_KAFKA_BOOTSTRAP__SERVERS: kafka:9092
      # 时区
      TZ: Asia/Shanghai
    depends_on:
      mysql:
        condition: service_started
      redis:
        condition: service_started
    networks:
      - shop_network
    restart: unless-stopped
```

### 8.2 启动服务

```bash
cd docker

# 先 Maven 打包并构建镜像（在项目根目录）
cd ..
mvn clean package -DskipTests -pl shop-admin -am
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .
cd docker

# 启动所有服务
docker compose up -d

# 仅启动 shop-admin 及其依赖
docker compose up -d shop-admin

# 查看服务状态
docker compose ps

# 查看 shop-admin 日志
docker compose logs -f shop-admin
```

### 8.3 服务启动顺序

```
MySQL ──────┐
             ├──► shop-admin
Redis ──────┘
```

> **注意**: `depends_on` 仅保证启动顺序，不保证服务就绪。shop-admin 内置了连接重试机制（Spring Boot 自动配置），会在 MySQL/Redis 就绪后自动连接。

---

## 9. 环境变量配置

### 9.1 完整环境变量列表

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `JAVA_OPTS` | `-Xms256m -Xmx512m -XX:+UseG1GC` | JVM 启动参数 |
| `SERVER_PORT` | `8081` | 服务端口 |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/shop?...` | 数据库连接 URL |
| `SPRING_DATASOURCE_USERNAME` | `root` | 数据库用户名 |
| `SPRING_DATASOURCE_PASSWORD` | (空) | 数据库密码 |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis 主机地址 |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis 端口 |
| `SPRING_DATA_REDIS_PASSWORD` | (空) | Redis 密码 |
| `APP_LOG_KAFKA_BOOTSTRAP__SERVERS` | `localhost:9094` | 日志Kafka服务器地址 |
| `TZ` | `Asia/Shanghai` | 容器时区 |

### 9.2 Spring Boot 环境变量映射

Spring Boot 自动将环境变量映射到配置属性，规则如下：

```
环境变量名                        → 配置属性名
SPRING_DATASOURCE_URL            → spring.datasource.url
SPRING_DATASOURCE_USERNAME       → spring.datasource.username
SPRING_DATASOURCE_PASSWORD       → spring.datasource.password
SPRING_DATA_REDIS_HOST                → spring.data.redis.host
SPRING_DATA_REDIS_PORT                → spring.data.redis.port
SPRING_DATA_REDIS_PASSWORD            → spring.data.redis.password
```

### 9.3 使用 .env 文件

创建 `.env` 文件管理环境变量：

```bash
# docker/.env.admin
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/shop?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=
SPRING_DATA_REDIS_HOST=redis
SPRING_DATA_REDIS_PORT=6379
APP_LOG_KAFKA_BOOTSTRAP__SERVERS=kafka:9092
```

使用方式：

```bash
docker run -d --env-file .env.admin --name shop-admin shop-admin:1.0.0
```

---

## 10. 数据持久化

### 10.1 卷挂载

```bash
docker run -d   --name shop-admin   -v shop-admin-logs:/app/logs   shop-admin:1.0.0
```

### 10.2 基础设施数据卷

已有的基础设施数据卷位于 `docker/volumes/` 目录：

```
docker/volumes/
├── mysql/
│   ├── conf/          # MySQL 自定义配置
│   ├── data/          # MySQL 数据文件
│   └── init/          # 初始化 SQL 脚本
├── redis/
│   └── data/          # Redis AOF 持久化数据
├── kafka/
│   ├── data/          # Kafka 日志数据
│   ├── config/        # Kafka 配置
│   └── secrets/       # Kafka 安全凭证
├── elasticsearch/
│   └── data/          # ES 索引数据
├── logstash/
│   └── data/          # Logstash 数据
└── rabbitmq/
    └── data/          # RabbitMQ 数据
```

### 10.3 备份与恢复

**MySQL 备份：**

```bash
# 备份
docker exec shop-mysql mysqldump -u root shop > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i shop-mysql mysql -u root shop < backup_20260101.sql
```

**Redis 备份：**

```bash
# 触发 RDB 快照
docker exec shop-redis redis-cli BGSAVE

# 复制备份文件
docker cp shop-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

---

## 11. 日志管理

### 11.1 日志架构

shop-admin 采用 **Log4j2 → Kafka → Logstash → Elasticsearch → Kibana** 的日志链路：

1. **Log4j2**: 应用日志通过 Kafka Appender 发送到 Kafka
2. **Kafka**: 作为日志缓冲区，topic 为 `shop-logs`
3. **Logstash**: 从 Kafka 消费日志，解析格式后写入 Elasticsearch
4. **Elasticsearch**: 存储日志，索引格式 `shop-logs-YYYY.MM.dd`
5. **Kibana**: 可视化查询日志

### 11.2 Log4j2 Kafka 配置

`log4j2-spring.xml` 中的关键配置：

```xml
<Kafka name="KafkaAppender" topic="shop-logs">
    <PatternLayout pattern="[%d{ISO8601}] [${spring:spring.application.name}] [%t] [%level] [%C.%M(%L)] - [%msg%n]" charset="UTF-8"/>
    <Property name="bootstrap.servers">${spring:app.log.kafka.bootstrap-servers}</Property>
</Kafka>
```

**Docker 环境中需修改的参数：**

| 环境变量 | 配置属性 | 默认值 | Docker 值 | 说明 |
|----------|----------|--------|-----------|------|
| `APP_LOG_KAFKA_BOOTSTRAP__SERVERS` | `app.log.kafka.bootstrap-servers` | `localhost:9094` | `kafka:9092` | 容器内使用服务名 + 内部端口 |

> **注意**: 环境变量中双下划线 `__` 映射为配置属性中的连字符 `-`，这是 Spring Boot Relaxed Binding 规范。

### 11.3 查看容器日志

```bash
# 实时查看
docker logs -f shop-admin

# 查看最近 200 行
docker logs --tail 200 shop-admin

# 查看指定时间段的日志
docker logs --since "2024-01-01T00:00:00" --until "2024-01-01T12:00:00" shop-admin
```

### 11.4 Kibana 查看日志

1. 打开浏览器访问 `http://localhost:5601`
2. 进入 **Management → Stack Management → Data Views**
3. 创建数据视图：
   - 索引模式：`shop-logs-*`
   - 时间字段：`@timestamp`
4. 进入 **Analytics → Discover** 查看日志
5. 常用筛选：
   - 按级别：`level: "ERROR"`
   - 按类名：`class: "com.shop.admin.controller"`
   - 按时间范围筛选

---

## 12. 健康检查

### 12.1 Docker 健康检查

Dockerfile 中已配置健康检查：

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3     CMD curl -f http://localhost:8081/actuator/health || exit 1
```

**参数说明：**

| 参数 | 值 | 说明 |
|------|----|------|
| `--interval` | 30s | 每 30 秒检查一次 |
| `--timeout` | 10s | 单次检查超时时间 |
| `--start-period` | 60s | 容器启动后 60 秒开始检查（给 Spring Boot 启动时间） |
| `--retries` | 3 | 连续 3 次失败才标记为 unhealthy |

### 12.2 手动健康检查

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' shop-admin

# 手动调用健康接口
curl http://localhost:8081/actuator/health
```

### 12.3 Spring Boot Actuator

确保 `application.yml` 中启用了 Actuator 端点（如需使用健康检查，需添加依赖）：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
```

---

## 13. 生产环境部署

### 13.1 JVM 调优

```bash
# 推荐生产环境 JVM 参数
JAVA_OPTS="-Xms1g -Xmx2g   -XX:+UseG1GC   -XX:MaxGCPauseMillis=200   -XX:+HeapDumpOnOutOfMemoryError   -XX:HeapDumpPath=/app/logs/heapdump.hprof   -XX:+PrintGCDetails   -XX:+PrintGCDateStamps   -Xloggc:/app/logs/gc.log"
```

### 13.2 资源限制

```bash
docker run -d   --name shop-admin   --memory=2g   --cpus=2   --restart unless-stopped   shop-admin:1.0.0
```

Docker Compose 方式：

```yaml
shop-admin:
  image: shop-admin:1.0.0
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
  restart: unless-stopped
```

### 13.3 安全加固

1. **非 root 用户运行**: Dockerfile 中已配置 `USER appuser`
2. **只读文件系统**: 可挂载 tmpfs 用于临时文件
3. **网络隔离**: 仅暴露必要端口
4. **密钥管理**: 使用 Docker Secrets 或外部密钥管理服务

```bash
docker run -d   --name shop-admin   --read-only   --tmpfs /tmp   --tmpfs /app/logs   shop-admin:1.0.0
```

### 13.4 镜像推送到私有仓库

```bash
# 登录私有仓库
docker login registry.example.com

# 标记镜像
docker tag shop-admin:1.0.0 registry.example.com/shop-admin:1.0.0
docker tag shop-admin:1.0.0 registry.example.com/shop-admin:latest

# 推送镜像
docker push registry.example.com/shop-admin:1.0.0
docker push registry.example.com/shop-admin:latest
```

### 13.5 滚动更新

```bash
# 拉取新镜像
docker pull registry.example.com/shop-admin:1.0.1

# 停止旧容器
docker stop shop-admin
docker rm shop-admin

# 启动新容器
docker run -d   --name shop-admin   --network shop_network   -p 8081:8081   registry.example.com/shop-admin:1.0.1
```

---

## 14. 常见问题

### 14.1 容器启动失败

**问题**: 容器启动后立即退出

```bash
# 查看退出日志
docker logs shop-admin

# 常见原因：
# 1. MySQL 未就绪 → 等待 MySQL 完全启动后重启容器
# 2. 端口冲突 → 修改 -p 映射端口
# 3. 内存不足 → 调整 JAVA_OPTS 或增加 Docker 内存限制
```

### 14.2 无法连接 MySQL

**问题**: `Communications link failure`

```bash
# 检查 MySQL 容器是否运行
docker ps | grep mysql

# 检查网络连通性
docker exec shop-admin ping mysql

# 检查 MySQL 是否就绪
docker exec shop-mysql mysqladmin ping -h localhost

# 解决方案：
# 1. 确保 shop-admin 和 MySQL 在同一 Docker 网络
# 2. 使用服务名 mysql 而非 localhost
# 3. 等待 MySQL 完全启动（约 30 秒）
```

### 14.3 无法连接 Redis

**问题**: `Unable to connect to Redis`

```bash
# 检查 Redis 容器
docker exec shop-admin ping redis

# 测试 Redis 连接
docker exec shop-redis redis-cli ping

# 解决方案：
# 1. 设置 SPRING_DATA_REDIS_HOST=redis（服务名）
# 2. 检查 Redis 密码配置
```

### 14.4 Kafka 连接失败

**问题**: 日志无法发送到 Kafka

```bash
# 检查 Kafka 容器
docker ps | grep kafka

# 检查 Kafka topic
docker exec shop-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# 解决方案：
# 1. 容器内使用 APP_LOG_KAFKA_BOOTSTRAP__SERVERS=kafka:9092（内部端口）
# 2. 宿主机使用 APP_LOG_KAFKA_BOOTSTRAP__SERVERS=localhost:9094（外部端口）
```

### 14.5 镜像构建缓慢

**问题**: 每次构建都要重新下载依赖

```bash
# 解决方案1: 使用 Maven 本地仓库缓存
mvn clean package -DskipTests -pl shop-admin -am
docker build -t shop-admin:1.0.0 -f docker/Dockerfile.admin .

# 解决方案2: 使用 BuildKit 缓存 Maven 仓库
docker build   --mount=type=cache,target=/root/.m2/repository   -t shop-admin:1.0.0   -f docker/Dockerfile.admin .
```

### 14.6 时区问题

**问题**: 日志时间与实际时间相差 8 小时

```bash
# 解决方案：设置容器时区
docker run -d   -e TZ=Asia/Shanghai   shop-admin:1.0.0

# Dockerfile 中已预设时区，一般无需额外配置
```

### 14.7 Elasticsearch 内存不足

**问题**: Elasticsearch 容器频繁重启

```bash
# 调整 ES JVM 堆内存
# 在 docker-compose.yml 中修改：
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"

# 增加 Docker Desktop 内存限制（建议 8GB+）
# Docker Desktop → Settings → Resources → Memory
```

---

## 附录

### A. 常用 Docker 命令速查

```bash
# 镜像管理
docker images                          # 列出镜像
docker rmi shop-admin:1.0.0            # 删除镜像
docker system prune -a                 # 清理无用镜像

# 容器管理
docker ps                              # 运行中容器
docker ps -a                           # 所有容器
docker stats shop-admin                # 资源占用
docker inspect shop-admin              # 详细信息

# Docker Compose
docker compose up -d                   # 启动所有服务
docker compose down                    # 停止并删除所有容器
docker compose restart shop-admin      # 重启单个服务
docker compose logs -f shop-admin      # 查看日志
docker compose pull                    # 拉取最新镜像

# 清理
docker system df                       # 查看磁盘占用
docker volume prune                    # 清理无用卷
docker system prune                    # 一键清理
```

### B. 端口速查表

| 服务 | 容器端口 | 宿主机端口 | 用途 |
|------|----------|------------|------|
| shop-admin | 8081 | 8081 | 管理 API |
| shop-api | 8080 | 8080 | 前台 API |
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
| Kibana | 5601 | 5601 | 可视化面板 |
