#!/bin/bash
# ============================================================
# Shop 项目 Docker 部署脚本（支持多环境）
# 用法:
#   ./deploy.sh infra             # 启动基础设施（默认环境）
#   ./deploy.sh app               # 启动应用服务（默认环境）
#   ./deploy.sh -e prod all       # 生产环境启动所有服务
#   ./deploy.sh down              # 停止默认环境所有服务
#   ./deploy.sh status            # 查看默认环境服务状态
#   ./deploy.sh logs              # 查看默认环境应用日志
#
# 环境说明:
#   prod  - 生产环境（.env.prod，需先从模板创建）
#   默认  - 测试/开发环境（.env）
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOCKER_DIR"

# ==================== 解析环境参数 ====================
ENV="default"
COMMAND=""

while [ $# -gt 0 ]; do
    case "$1" in
        -e|--env)
            shift
            ENV="$1"
            ;;
        -h|--help|help)
            COMMAND="help"
            ;;
        *)
            COMMAND="$1"
            ;;
    esac
    shift
done

# 验证环境参数
case "$ENV" in
    default|prod)
        ;;
    *)
        error "不支持的环境: $ENV，仅支持 default / prod"
        ;;
esac

# 确定环境配置文件
if [ "$ENV" = "prod" ]; then
    ENV_FILE="$DOCKER_DIR/.env.prod"
    if [ ! -f "$ENV_FILE" ]; then
        error "生产环境配置不存在，请先创建: cp .env.prod.template .env.prod 并修改配置值"
    fi
else
    ENV_FILE="$DOCKER_DIR/.env"
    if [ ! -f "$ENV_FILE" ]; then
        error "环境配置文件不存在: $ENV_FILE"
    fi
fi

# 读取环境名称用于显示
ENV_NAME=$(grep "^APP_NAME=" "$ENV_FILE" | cut -d'=' -f2)

info "环境: $ENV ($ENV_NAME)"
info "Docker 目录: $DOCKER_DIR"

# Compose 公共参数
COMPOSE_OPTS="--env-file $ENV_FILE"

# 显示帮助
show_help() {
    echo "Shop 项目 Docker 部署脚本（多环境）"
    echo ""
    echo "用法: $0 -e <环境> <命令>"
    echo ""
    echo "环境:"
    echo "  default     测试/开发环境（默认，使用 .env）"
    echo "  prod        生产环境（使用 .env.prod）"
    echo ""
    echo "命令:"
    echo "  infra       仅启动基础设施（MySQL/Redis/Kafka/ELK）"
    echo "  app         仅启动应用服务（shop-admin/shop-api/admin-ui）"
    echo "  all         启动所有服务（基础设施 + 应用）"
    echo "  down        停止当前环境所有服务"
    echo "  restart     重启应用服务"
    echo "  status      查看服务状态"
    echo "  logs [svc]  查看日志（默认查看应用日志，支持 mysql/redis/kafka 等基础设施）"
    echo "  build       构建镜像后部署"
    echo ""
    echo "示例:"
    echo "  $0 infra                      # 默认环境启动基础设施"
    echo "  $0 app                        # 默认环境启动应用"
    echo "  $0 -e prod all                # 生产环境启动所有服务"
    echo "  $0 down                       # 停止默认环境"
    echo "  $0 logs shop-admin            # 查看默认环境 shop-admin 日志"
    echo "  $0 -e prod logs mysql         # 查看生产环境 MySQL 日志"
}

case "${COMMAND:-help}" in
    infra)
        info "启动基础设施服务 [$ENV]..."
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml up -d
        info "等待基础设施就绪..."
        sleep 10
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml ps
        info "✅ 基础设施启动完成 [$ENV]"
        echo ""
        info "服务地址:"
        echo "  MySQL:          localhost:3306"
        echo "  Redis:          localhost:6379"
        echo "  Kafka:          localhost:9094"
        echo "  RabbitMQ:       http://localhost:15672 (shop/shop123)"
        echo "  Elasticsearch:  http://localhost:9200"
        echo "  Kibana:         http://localhost:5601"
        ;;

    app)
        info "启动应用服务 [$ENV]..."
        # 检查基础设施网络是否存在
        if ! docker network inspect "${ENV_NAME}_network" > /dev/null 2>&1; then
            warn "基础设施网络不存在，请先运行: $0 -e $ENV infra"
            if [ "$ENV" = "default" ]; then
                warn "提示: 也可以直接运行: $0 infra"
            fi
            info "正在自动启动基础设施..."
            docker compose $COMPOSE_OPTS -f docker-compose.infra.yml up -d
            info "等待基础设施就绪..."
            # 健康检查：最多等待120秒
            wait_count=0
            while [ $wait_count -lt 24 ]; do
                if docker compose $COMPOSE_OPTS -f docker-compose.infra.yml ps | grep -q "healthy\|running"; then
                    break
                fi
                sleep 5
                wait_count=$((wait_count + 1))
            done
            if [ $wait_count -ge 24 ]; then
                warn "基础设施健康检查超时，继续启动应用..."
            else
                info "✅ 基础设施就绪"
            fi
        fi
        docker compose $COMPOSE_OPTS -f docker-compose.app.yml up -d
        info "等待应用服务就绪..."
        sleep 10
        docker compose $COMPOSE_OPTS -f docker-compose.app.yml ps
        info "✅ 应用服务启动完成 [$ENV]"
        echo ""
        info "服务地址:"
        # 从环境文件读取端口
        ADMIN_PORT_VAL=$(grep "^ADMIN_PORT=" "$ENV_FILE" | cut -d'=' -f2)
        API_PORT_VAL=$(grep "^API_PORT=" "$ENV_FILE" | cut -d'=' -f2)
        ADMIN_UI_PORT_VAL=$(grep "^ADMIN_UI_PORT=" "$ENV_FILE" | cut -d'=' -f2)
        echo "  shop-admin API: http://localhost:${ADMIN_PORT_VAL}"
        echo "  shop-admin Doc: http://localhost:${ADMIN_PORT_VAL}/doc.html"
        echo "  shop-api API:   http://localhost:${API_PORT_VAL}"
        echo "  shop-api Doc:   http://localhost:${API_PORT_VAL}/doc.html"
        echo "  admin-ui:       http://localhost:${ADMIN_UI_PORT_VAL}"
        ;;

    all)
        info "启动所有服务 [$ENV]..."
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml -f docker-compose.app.yml up -d
        info "等待服务就绪..."
        sleep 15
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml -f docker-compose.app.yml ps
        info "✅ 所有服务启动完成 [$ENV]"
        ;;

    down)
        info "停止所有服务 [$ENV]..."
        docker compose $COMPOSE_OPTS -f docker-compose.app.yml down 2>/dev/null || true
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml down 2>/dev/null || true
        info "✅ 所有服务已停止 [$ENV]"
        ;;

    restart)
        info "重启应用服务 [$ENV]..."
        docker compose $COMPOSE_OPTS -f docker-compose.app.yml restart
        info "✅ 应用服务已重启 [$ENV]"
        ;;

    status)
        echo -e "${BLUE}=== 环境: $ENV ($ENV_NAME) ===${NC}"
        echo -e "${BLUE}=== 基础设施 ===${NC}"
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml ps 2>/dev/null || echo "未启动"
        echo ""
        echo -e "${BLUE}=== 应用服务 ===${NC}"
        docker compose $COMPOSE_OPTS -f docker-compose.app.yml ps 2>/dev/null || echo "未启动"
        ;;

    logs)
        SERVICE="${2:-shop-admin}"
        # 判断是查看基础设施还是应用服务日志
        case "$SERVICE" in
            mysql|redis|kafka|rabbitmq|elasticsearch|kibana|zookeeper|infra)
                docker compose $COMPOSE_OPTS -f docker-compose.infra.yml logs -f --tail 100 "$SERVICE"
                ;;
            *)
                docker compose $COMPOSE_OPTS -f docker-compose.app.yml logs -f --tail 100 "$SERVICE"
                ;;
        esac
        ;;

    build)
        info "构建镜像..."
        "$SCRIPT_DIR/build.sh" all
        info "启动所有服务 [$ENV]..."
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml -f docker-compose.app.yml up -d
        sleep 15
        docker compose $COMPOSE_OPTS -f docker-compose.infra.yml -f docker-compose.app.yml ps
        info "✅ 构建部署完成 [$ENV]"
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        error "未知命令: $COMMAND，使用 -h 查看帮助"
        ;;
esac
