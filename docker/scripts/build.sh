#!/bin/bash

# ============================================================
# 商项目Docker镜像构建脚本 (Linux/macOS)
# 使用方法:
#   ./build.sh           # 构建所有镜像
#   ./build.sh admin     # 仅构建 shop-admin-api
#   ./build.sh api       # 仅构建 shop-app-api
#   ./build.sh admin-ui  # 仅构建 shop-admin-ui
#   ./build.sh --no-cache # 不使用缓存构建
#   ./build.sh -v 2.1.0 --no-cache admin  # 使用版本2.1.0无缓存构建admin-api
# ============================================================

# 设置默认版本
BASE_VERSION="1.0.0"

# 切换到项目根目录
cd "$(dirname "$0")/../.."

# 设置默认值
BUILD_TARGET="all"
NO_CACHE=0
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 参数解析
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            admin)
                BUILD_TARGET="admin"
                shift
                ;;
            api)
                BUILD_TARGET="api"
                shift
                ;;
            admin-ui)
                BUILD_TARGET="admin-ui"
                shift
                ;;
            --no-cache)
                NO_CACHE=1
                shift
                ;;
            -v)
                BASE_VERSION="$2"
                shift 2
                ;;
            "")
                break
                ;;
            *)
                echo "错误: 未知参数 "$1""
                exit 1
                ;;
        esac
    done
}

# 开始构建
start_build() {
    echo "开始构建镜像, 版本: $BASE_VERSION"
    echo "构建目标: $BUILD_TARGET"
    echo "无缓存: $NO_CACHE"
    echo

    if [[ $NO_CACHE -eq 1 ]]; then
        CACHE_FLAG="--no-cache"
    else
        CACHE_FLAG=""
    fi

    echo "正在构建镜像..."

    # 构建镜像
    if [[ "$BUILD_TARGET" == "all" ]]; then
        echo "正在构建所有镜像..."

        echo
        echo "正在构建 shop-admin-api..."
        docker build -f docker/Dockerfile.admin-api -t shop-admin-api:$BASE_VERSION -t shop-admin-api:latest $CACHE_FLAG .

        echo
        echo "正在构建 shop-app-api..."
        docker build -f docker/Dockerfile.app-api -t shop-app-api:$BASE_VERSION -t shop-app-api:latest $CACHE_FLAG .

        echo
        echo "正在构建 shop-admin-ui..."
        docker build -f docker/Dockerfile.admin-ui -t shop-admin-ui:$BASE_VERSION -t shop-admin-ui:latest $CACHE_FLAG .
    elif [[ "$BUILD_TARGET" == "admin" ]]; then
        echo "正在构建 shop-admin-api..."
        docker build -f docker/Dockerfile.admin-api -t shop-admin-api:$BASE_VERSION -t shop-admin-api:latest $CACHE_FLAG .
    elif [[ "$BUILD_TARGET" == "api" ]]; then
        echo "正在构建 shop-app-api..."
        docker build -f docker/Dockerfile.app-api -t shop-app-api:$BASE_VERSION -t shop-app-api:latest $CACHE_FLAG .
    elif [[ "$BUILD_TARGET" == "admin-ui" ]]; then
        echo "正在构建 shop-admin-ui..."
        docker build -f docker/Dockerfile.admin-ui -t shop-admin-ui:$BASE_VERSION -t shop-admin-ui:latest $CACHE_FLAG .
    else
        echo "错误: 未知构建目标 "$BUILD_TARGET""
        exit 1
    fi

    echo
    echo "构建完成!"
}

# 主程序
parse_args "$@"
start_build
