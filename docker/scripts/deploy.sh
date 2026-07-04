#!/bin/bash

# ============================================================
# 商项目Docker部署脚本 (Linux/macOS)
# 使用方法:
#   ./deploy.sh [命令] [选项]
# 
# 命令:
#   infra      仅启动基础设施服务
#   app        仅启动应用服务
#   all        启动所有服务
#   down       停止当前环境所有服务
#   restart    重启应用服务
#   status     查看服务状态
#   logs [svc] 查看日志
#   build      构建镜像后部署
#
# 选项:
#   -e <env>   指定环境 (dev/uat/prod)
#   -h         显示帮助信息
# ============================================================

# 设置默认值
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_DIR/docker"
ENV_FILE="$COMPOSE_DIR/.env"
ENV_NAME="dev"  # 默认环境
COMMAND=""

# 显示帮助信息
show_help() {
    echo "商项目Docker部署脚本"
    echo
    echo "用法: $0 [命令] [选项]"
    echo
    echo "命令:"
    echo "  infra      仅启动基础设施服务"
    echo "  app        仅启动应用服务"
    echo "  all        启动所有服务"
    echo "  down       停止当前环境所有服务"
    echo "  restart    重启应用服务"
    echo "  status     查看服务状态"
    echo "  logs [svc] 查看日志"
    echo "  build      构建镜像后部署"
    echo
    echo "选项:"
    echo "  -e <env>   指定环境 (dev/uat/prod)"
    echo "  -h         显示帮助信息"
    echo
    echo "示例:"
    echo "  $0 all                    # 默认环境启动所有服务"
    echo "  $0 -e prod all            # 生产环境启动所有服务"
    echo "  $0 -e uat status          # UAT环境查看服务状态"
    echo "  $0 logs shop-admin       # 查看shop-admin日志"
    exit 0
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                ;;
            -e)
                ENV_NAME="$2"
                shift 2
                ;;
            infra|app|all|down|restart|status|logs|build)
                COMMAND="$1"
                shift
                ;;
            *)
                # 如果第一个参数不是选项，则视为命令
                if [[ -z "$COMMAND" ]]; then
                    COMMAND="$1"
                    shift
                else
                    echo "错误: 未知参数 "$1""
                    exit 1
                fi
                ;;
        esac
    done
}

# 设置环境变量文件
set_env_file() {
    case $ENV_NAME in
        dev)
            ENV_FILE="$COMPOSE_DIR/.env"
            ;;
        uat)
            ENV_FILE="$COMPOSE_DIR/.env.uat"
            ;;
        prod)
            if [[ ! -f "$COMPOSE_DIR/.env.prod" ]]; then
                echo "警告: 生产环境配置文件不存在，从模板创建..."
                cp "$COMPOSE_DIR/.env.prod.template" "$COMPOSE_DIR/.env.prod"
                echo "请编辑 $COMPOSE_DIR/.env.prod 文件，修改敏感配置（如密码等）后再试。"
                exit 1
            fi
            ENV_FILE="$COMPOSE_DIR/.env.prod"
            ;;
        *)
            echo "错误: 未知环境 "$ENV_NAME"，支持的环境: dev, uat, prod"
            exit 1
            ;;
    esac
}

# 执行Docker命令
run_docker() {
    local cmd="$1"
    shift
    echo "执行: docker compose -f "$COMPOSE_DIR/docker-compose.yml" $cmd $*"
    (cd "$COMPOSE_DIR" && docker compose -f "docker-compose.yml" $cmd "$@")
}

# 执行Docker命令（使用指定环境文件）
run_docker_with_env() {
    local cmd="$1"
    shift
    echo "执行: docker compose --env-file "$ENV_FILE" -f "$COMPOSE_DIR/docker-compose.yml" $cmd $*"
    (cd "$COMPOSE_DIR" && docker compose --env-file "$ENV_FILE" -f "docker-compose.yml" $cmd "$@")
}

# 执行Docker命令（仅基础设施）
run_docker_infra() {
    local cmd="$1"
    shift
    echo "执行: docker compose --env-file "$ENV_FILE" -f "$COMPOSE_DIR/docker-compose.infra.yml" $cmd $*"
    (cd "$COMPOSE_DIR" && docker compose --env-file "$ENV_FILE" -f "docker-compose.infra.yml" $cmd "$@")
}

# 执行Docker命令（仅应用）
run_docker_app() {
    local cmd="$1"
    shift
    echo "执行: docker compose --env-file "$ENV_FILE" -f "$COMPOSE_DIR/docker-compose.app.yml" $cmd $*"
    (cd "$COMPOSE_DIR" && docker compose --env-file "$ENV_FILE" -f "docker-compose.app.yml" $cmd "$@")
}

# 构建镜像
build_images() {
    echo "构建Docker镜像..."
    (cd "$PROJECT_DIR" && "$SCRIPT_DIR/build.sh" all)
    if [[ $? -ne 0 ]]; then
        echo "错误: 镜像构建失败"
        exit 1
    fi
}

# 主程序
main() {
    parse_args "$@"

    # 如果没有指定命令，显示帮助
    if [[ -z "$COMMAND" ]]; then
        show_help
    fi

    # 设置环境变量文件
    set_env_file

    # 根据命令执行相应操作
    case "$COMMAND" in
        infra)
            echo "启动基础设施服务 (环境: $ENV_NAME)..."
            run_docker_infra up -d
            ;;
        app)
            echo "启动应用服务 (环境: $ENV_NAME)..."
            run_docker_app up -d
            ;;
        all)
            echo "启动所有服务 (环境: $ENV_NAME)..."
            run_docker_with_env up -d
            ;;
        down)
            echo "停止所有服务 (环境: $ENV_NAME)..."
            run_docker_with_env down
            ;;
        restart)
            echo "重启应用服务 (环境: $ENV_NAME)..."
            run_docker_app restart
            ;;
        status)
            echo "服务状态 (环境: $ENV_NAME):"
            run_docker_with_env ps
            ;;
        logs)
            local service="$1"
            if [[ -n "$service" ]]; then
                echo "查看服务 $service 日志 (环境: $ENV_NAME):"
                run_docker_with_env logs -f "$service"
            else
                echo "查看所有服务日志 (环境: $ENV_NAME):"
                run_docker_with_env logs -f
            fi
            ;;
        build)
            echo "构建镜像并部署 (环境: $ENV_NAME)..."
            build_images
            run_docker_with_env up -d
            ;;
        *)
            echo "错误: 未知命令 "$COMMAND""
            echo "使用 -h 或 --help 查看帮助信息"
            exit 1
            ;;
    esac
}

# 执行主程序
main "$@"
