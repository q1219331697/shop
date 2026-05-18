# 部署文档

## 环境要求

- JDK 17+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+
- Kafka 2.8+
- Elasticsearch 9.x+
- Logstash 9.x+
- Kibana 9.x+

## 数据库配置

### 1. 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS `shop` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 执行数据库脚本

项目使用 Liquibase 进行数据库版本管理，启动应用时会自动执行数据库初始化脚本。

## 配置文件修改

### 1. application.yml

修改以下配置项：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/shop?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false
    username: root
    password: your_password

  redis:
    host: localhost
    port: 6379
    password: your_redis_password

jwt:
  secret: your-secret-key
  expiration: 604800000
```

## 构建项目

```bash
# 编译打包
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests
```

## 启动应用

### 1. 本地启动

```bash
# 使用 Maven 启动
mvn spring-boot:run

# 或使用 java -jar 启动
java -jar target/shop-1.0.0.jar
```

### 2. 生产环境启动

```bash
# 后台启动
nohup java -jar shop-1.0.0.jar > app.log 2>&1 &

# 指定配置文件启动
java -jar shop-1.0.0.jar --spring.config.location=/path/to/application-prod.yml
```

## Docker 部署

### 1. 构建镜像

```bash
docker build -t shop:1.0.0 .
```

### 2. 运行容器

```bash
docker run -d \
  --name shop \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/shop \
  -e SPRING_DATASOURCE_USERNAME=root \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e SPRING_DATA_REDIS_HOST=redis \
  shop:1.0.0
```

### 3. Docker Compose 部署

```bash
docker-compose up -d
```

### 4. Logstash 配置部署

#### 4.1 复制 Logstash 配置文件

将项目中的 Logstash 配置文件复制到 Docker 的 Logstash pipeline 目录：

```bash
# Windows
copy docker\config\logstash\shop-logs.conf C:\Users\lzz\docker\volumes\logstash\pipeline\

# Linux/Mac
cp docker/config/logstash/shop-logs.conf /path/to/docker/volumes/logstash/pipeline/
```

#### 4.2 配置说明

Logstash 配置文件位于 `docker/config/logstash/shop-logs.conf`，主要功能：

- 从 Kafka 的 `shop-logs` 主题接收日志
- 解析 log4j2 格式的日志
- 输出到 Elasticsearch

#### 4.3 修改配置

根据实际环境修改以下配置：

```conf
# Kafka 配置
bootstrap_servers => "your-kafka-server:9092"

# Elasticsearch 配置
hosts => ["your-elasticsearch-server:9200"]
```

#### 4.4 重启 Logstash

```bash
# Docker 方式
docker restart logstash

# Docker Compose 方式
docker-compose restart logstash
```

## 健康检查

应用启动后，可以通过以下接口检查健康状态：

```bash
curl http://localhost:8080/actuator/health
```

## 日志查看

### 1. 应用日志

```bash
# 查看实时日志
tail -f logs/shop.log

# 查看错误日志
grep ERROR logs/shop.log
```

### 2. Docker 日志

```bash
docker logs -f shop
```

### 3. ELK 日志查看

#### 3.1 访问 Kibana

打开浏览器访问：`http://localhost:5601`

#### 3.2 创建索引模式

1. 进入 Management > Stack Management > Index Patterns
2. 点击 "Create index pattern"
3. 输入索引模式：`shop-logs-*`
4. 选择时间字段：`@timestamp`
5. 点击 "Create index pattern"

注意：在 Elasticsearch 9.x 中，索引模式已更名为数据视图（Data Views）

#### 3.3 查看日志

1. 进入 Analytics > Discover
2. 选择 `shop-logs-*` 索引模式
3. 可以通过以下方式筛选日志：
   - 按时间范围筛选
   - 按日志级别筛选（level: ERROR）
   - 按应用名称筛选（application: shop）
   - 按环境筛选（environment: prod）
   - 使用 KQL 查询语言进行复杂查询

#### 3.4 查看错误日志

错误日志会额外存储在 `shop-logs-error-*` 索引中，可以单独创建索引模式进行查看。

## 常见问题

### 1. 数据库连接失败

检查数据库服务是否启动，配置是否正确。

### 2. Redis 连接失败

检查 Redis 服务是否启动，密码是否正确。

### 3. 端口冲突

修改 application.yml 中的 server.port 配置。

### 4. 内存不足

调整 JVM 参数：

```bash
java -Xms512m -Xmx1024m -jar shop-1.0.0.jar
```

## 性能优化

### 1. 数据库优化

- 合理设置连接池大小
- 添加必要的索引
- 定期清理历史数据

### 2. Redis 优化

- 设置合理的过期时间
- 使用连接池

### 3. 应用优化

- 开启缓存
- 使用异步处理
- 合理使用线程池
