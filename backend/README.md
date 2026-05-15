spring boot 项目，实现一个简单的购物车功能，包括添加商品到购物车、从购物车中删除商品、查看购物车中的商品列表等功能。

**文档目录**：doc/

## 项目结构

Maven 多模块架构，前后端分离，模块间单向依赖。

```
shop (父POM，统一版本管理)
├── shop-common      # 公共模块（无依赖）
├── shop-mapper      # 数据层模块 ← shop-common
├── shop-service     # 业务层模块 ← shop-mapper
├── shop-api         # 前端接口模块 ← shop-service（C端用户API）
└── shop-admin       # 后台管理模块 ← shop-service（管理后台API）
```

### 模块职责

| 模块 | 职责 | 包含内容 |
|------|------|---------|
| shop-common | 公共定义，无框架依赖 | Result、ResultCode、Entity、Enum、Constant、JwtUtil |
| shop-mapper | 数据访问层 | Mapper接口、MybatisPlusConfig、CustomMetaObjectHandler、Liquibase脚本 |
| shop-service | 业务逻辑层 | Service接口、ServiceImpl |
| shop-api | 前端接口服务 | Controller（C端）、SecurityConfig、Knife4jConfig、ShopApplication |
| shop-admin | 后台管理服务 | Controller（管理端）、SecurityConfig、Knife4jConfig、AdminApplication |

### 依赖关系

```
shop-common ← shop-mapper ← shop-service ← shop-api
                                         ← shop-admin
```


## 技术栈

### Spring Boot 核心

- java:17 / maven / Git

- Spring Boot:3.5.14 (Web / Validation / Configuration Processor / DevTools)

- Spring Boot Log4j2

### 数据层

- MyBatis-Plus:3.5.16 + JSqlParser (SQL解析/分页)

- MySQL:9.7 (Docker, utf8mb4 / utf8mb4_0900_ai_ci)

- Redis:8-alpine (Docker, AOF持久化)

- Liquibase (数据库版本管理)

### 安全与认证

- Spring Boot Security

- JJWT:0.12.7 (JWT认证, jjwt-impl + jjwt-jackson)

### 消息队列

- RabbitMQ:3-management (Docker)

- Kafka:latest (Docker, KRaft模式)

### 日志与搜索

- Elasticsearch:9.3.3 / Logstash:9.3.3 / Kibana:9.3.3 (Docker)

### 工具库

- Knife4j:4.5.0 (API文档)

- Hutool:5.8.44 (工具集)

- Lombok

### 代码质量

- SonarQube / Checkstyle:3.3.0 / JaCoCo:0.8.10


## 细节调整

- 中文注释
- swagger注解
- liquibase，sql文件方式配置，目录方式，文件名对应版本号
- 表名前缀t_，实体不带t_
