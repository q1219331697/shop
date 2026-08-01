# syntax=docker/dockerfile:1

# ============================================================
# shop-admin-ui Dockerfile - 多阶段构建
# 构建命令: docker compose up -d shop-admin-ui --build
# ============================================================

# -------------------- 阶段1: Node 构建 --------------------
FROM node:24-alpine as builder

WORKDIR /build

# 先复制依赖文件，利用 Docker 缓存加速依赖安装
COPY package.json package-lock.json* ./

# 复制 npm 配置文件，确保使用国内镜像源加速
COPY .npmrc ./

# 安装依赖（使用国内镜像加速）
RUN npm install

# 复制源代码
COPY . ./

# 构建生产包
RUN npm run build

# -------------------- 阶段2: Nginx 运行 --------------------
FROM nginx:1.31-alpine

# 添加标签
LABEL maintainer="shop-team"
LABEL description="shop-admin-ui 后台管理前端"
LABEL version="1.0.0"

# 设置时区
ENV TZ=Asia/Shanghai

# 复制自定义 Nginx 配置
COPY ./nginx/conf/admin-ui.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制产物
COPY --from=builder /build/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx（前台运行）
CMD ["nginx", "-g", "daemon off;"]
