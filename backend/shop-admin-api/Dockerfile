# ============================================================
# shop-admin-api Dockerfile
# 构建命令: docker compose up -d shop-admin-api --build
# ============================================================

# -------------------- 阶段1: Maven 构建 --------------------
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# 配置阿里云 Maven 镜像加速
COPY .mvn/settings.xml /root/.m2/settings.xml

# 下载依赖
RUN mvn dependency:go-offline -B

# 复制所有源代码
COPY pom.xml ./
COPY shop-common/ ./shop-common/
COPY shop-dao/ ./shop-dao/
COPY shop-service/ ./shop-service/
COPY shop-app-api/ ./shop-app-api/
COPY shop-admin-api/ ./shop-admin-api/

# 构建 JAR
RUN mvn clean package -DskipTests -Dcheckstyle.skip=true -B

# -------------------- 阶段2: 运行镜像 --------------------
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="shop-team"
LABEL description="shop-admin-api 后台管理API服务"
LABEL version="1.0.0"

# 设置时区
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 复制 JAR 文件
COPY --from=builder --chown=appuser:appgroup /build/shop-admin-api/target/shop-admin-api-*.jar app.jar

USER appuser

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["java", "-jar", "app.jar"]
