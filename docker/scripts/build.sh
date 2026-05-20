#!/bin/bash
# ============================================================
# Shop 项目 Docker 镜像构建脚本
# 用法:
#   ./build.sh           # 构建所有镜像
#   ./build.sh admin     # 仅构建 shop-admin
#   ./build.sh api       # 仅构建 shop-api
#   ./build.sh --no-cache # 不使用缓存构建
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 项目根目录（scripts 在 docker/scripts 下，需向上两级）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION="${APP_VERSION:-1.0.0}"

# 解析参数
NO_CACHE=""
TARGET="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache) NO_CACHE="--no-cache"; shift ;;
        admin)      TARGET="admin"; shift ;;
        api)        TARGET="api"; shift ;;
        all)        TARGET="all"; shift ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项] [目标]"
            echo ""
            echo "目标:"
            echo "  admin       仅构建 shop-admin 镜像"
            echo "  api         仅构建 shop-api 镜像"
            echo "  all         构建所有镜像（默认）"
            echo ""
            echo "选项:"
            echo "  --no-cache  不使用 Docker 缓存"
            echo "  -v VERSION  指定版本号（默认: 1.0.0）"
            echo "  -h          显示帮助信息"
            exit 0
            ;;
        *)
            error "未知参数: $1，使用 -h 查看帮助"
            ;;
    esac
done

cd "$PROJECT_ROOT"

info "项目根目录: $PROJECT_ROOT"
info "镜像版本: $VERSION"

# -------------------- 拉取基础镜像 --------------------
info "==========================================="
info "拉取基础镜像..."
info "==========================================="
docker pull maven:3.9-eclipse-temurin-17 || error "拉取 maven:3.9-eclipse-temurin-17 失败"
docker pull eclipse-temurin:17-jre-alpine || error "拉取 eclipse-temurin:17-jre-alpine 失败"
info "✅ 基础镜像拉取完成"

# 构建镜像（多阶段构建，Maven 编译在容器内完成）
build_image() {
    local name=$1
    local dockerfile=$2

    info "==========================================="
    info "构建 ${name}:${VERSION} 镜像（多阶段构建）"
    info "Dockerfile: ${dockerfile}"
    info "==========================================="

    docker build \
        ${NO_CACHE} \
        -t "${name}:${VERSION}" \
        -t "${name}:latest" \
        -f "${dockerfile}" \
        .
    info "✅ ${name}:${VERSION} 镜像构建成功"
}

case $TARGET in
    admin)
        build_image "shop-admin" "docker/Dockerfile.admin"
        ;;
    api)
        build_image "shop-api" "docker/Dockerfile.api"
        ;;
    all)
        build_image "shop-admin" "docker/Dockerfile.admin"
        build_image "shop-api" "docker/Dockerfile.api"
        ;;
esac

info "==========================================="
info "构建完成！"
info "==========================================="

# 显示镜像信息
docker images | grep -E "shop-(admin|api)" | head -10
