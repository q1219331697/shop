#!/bin/bash
# ============================================================
# Shop 项目 Docker 镜像构建脚本
# 用法:
#   ./build.sh           # 构建所有镜像
#   ./build.sh admin     # 仅构建 shop-admin
#   ./build.sh api       # 仅构建 shop-api
#   ./build.sh admin-ui  # 仅构建 shop-admin-ui
#   ./build.sh --no-cache # 不使用缓存构建
#
# 版本标签格式: 基础版本-日期-序号（如 1.0.0-20260518-1）
#   -v 1.2.0             → 1.2.0-20260518-1
#   同日再次构建          → 1.2.0-20260518-2
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
BASE_VERSION="${APP_VERSION:-1.0.0}"

# 生成版本标签: 基础版本-日期-序号（如 1.0.0-20260518-1）
BUILD_DATE=$(date +%Y%m%d)

# 自动计算当日构建序号：查找已有镜像中同日期的最大序号 +1
get_next_seq() {
    local name=$1
    local max_seq=0
    for tag in $(docker images --format '{{.Tag}}' "$name" 2>/dev/null | grep -oP "(?<=${BUILD_DATE}-)\d+" 2>/dev/null); do
        if [[ $tag -gt $max_seq ]]; then
            max_seq=$tag
        fi
    done
    echo $((max_seq + 1))
}

# 解析参数
NO_CACHE=""
TARGET="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache) NO_CACHE="--no-cache"; shift ;;
        admin)      TARGET="admin"; shift ;;
        api)        TARGET="api"; shift ;;
        admin-ui)   TARGET="admin-ui"; shift ;;
        all)        TARGET="all"; shift ;;
        -v|--version)
            BASE_VERSION="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项] [目标]"
            echo ""
            echo "目标:"
            echo "  admin       仅构建 shop-admin 镜像"
            echo "  api         仅构建 shop-api 镜像"
            echo "  admin-ui    仅构建 shop-admin-ui 镜像"
            echo "  all         构建所有镜像（默认）"
            echo ""
            echo "选项:"
            echo "  --no-cache  不使用 Docker 缓存"
            echo "  -v VERSION  指定基础版本号（默认: 1.0.0，自动追加日期序号）"
            echo "  -h          显示帮助信息"
            echo ""
            echo "版本标签格式: 基础版本-日期-序号"
            echo "  示例: 1.0.0-20260518-1"
            echo "  同日多次构建序号自动递增: 1.0.0-20260518-1 → 1.0.0-20260518-2"
            exit 0
            ;;
        *)
            error "未知参数: $1，使用 -h 查看帮助"
            ;;
    esac
done

cd "$PROJECT_ROOT"

info "项目根目录: $PROJECT_ROOT"
info "基础版本: $BASE_VERSION"
info "构建日期: $BUILD_DATE"

# 构建镜像（多阶段构建，Maven 编译在容器内完成）

# 构建镜像（多阶段构建，Maven 编译在容器内完成）
build_image() {
    local name=$1
    local dockerfile=$2

    # 自动生成版本标签: 基础版本-日期-序号
    local seq=$(get_next_seq "$name")
    local VERSION="${BASE_VERSION}-${BUILD_DATE}-${seq}"

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
    admin-ui)
        build_image "shop-admin-ui" "docker/Dockerfile.admin-ui"
        ;;
    all)
        build_image "shop-admin" "docker/Dockerfile.admin"
        build_image "shop-api" "docker/Dockerfile.api"
        build_image "shop-admin-ui" "docker/Dockerfile.admin-ui"
        ;;
esac

info "==========================================="
info "构建完成！"
info "==========================================="

# 清理历史版本镜像（保留 latest 和 BASE_VERSION）
info "清理历史版本镜像..."
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep -E "shop-(admin|api|admin-ui):.*-${BUILD_DATE}-"); do
    if [[ "$image" != "shop-admin:${VERSION}" && "$image" != "shop-api:${VERSION}" && "$image" != "shop-admin-ui:${VERSION}" ]]; then
        info "删除: $image"
        docker rmi "$image" 2>/dev/null || true
    fi
done
info "✅ 历史版本镜像清理完成"

# 显示镜像信息
docker images --format "  {{.Repository}}:{{.Tag}}	{{.Size}}	{{.CreatedAt}}" | grep -E "shop-(admin|api|admin-ui)"
