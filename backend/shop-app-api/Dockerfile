# ============================================================
# shop-app-api Dockerfile
# 构建命令：
#   1. 在项目根目录执行：docker compose up -d shop-app-api --build
#   2. 在 backend 目录执行：docker build . -f shop-app-api/Dockerfile -t shop-app-api:1.0.0
# ============================================================

# -------------------- 阶段1: Maven 构建 --------------------
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 1. 配置 Maven 镜像（注意：此处的源路径也是相对于docker-compose.yml:context backend/ 目录）
COPY .mvn/settings.xml /root/.m2/settings.xml

# 2. 严格显式复制多模块项目的所有 pom.xml（在 backend/ 根目录下能直接看到它们）
COPY pom.xml .
COPY shop-common/pom.xml ./shop-common/
COPY shop-dao/pom.xml ./shop-dao/
COPY shop-service/pom.xml ./shop-service/
COPY shop-app-api/pom.xml ./shop-app-api/
COPY shop-admin-api/pom.xml ./shop-admin-api/

# 3. 【核心优化】使用 -fn (Fail Never) 预下载外部依赖并稳固缓存层
RUN mvn dependency:resolve-plugins dependency:resolve -fn

# 4. 【核心优化】预下载所有第三方依赖
# 先复制源码并使用 -fn 确保在多模块结构下最大化缓存外部依赖
COPY . .

# 5. 编译并打包项目(最大化利用 Docker 缓存)
RUN mvn clean package -DskipTests -Dcheckstyle.skip=true -pl shop-app-api -am

# -------------------- 阶段2: 运行镜像 --------------------
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="shop-team"
LABEL description="shop-app-api 前台API服务"
LABEL version="1.0.0"

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 复制 JAR 文件
COPY --from=builder --chown=appuser:appgroup /build/shop-app-api/target/shop-app-api-*.jar app.jar

USER appuser

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["java", "-jar", "app.jar"]
