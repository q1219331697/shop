#!/bin/bash
# ============================================================
# Shop 项目 Docker 部署脚本
# 用法:
#   ./deploy.sh infra     # 仅启动基础设施
#   ./deploy.sh app       # 仅启动应用服务
#   ./deploy.sh all       # 启动所有服务
#   ./deploy.sh down      # 停止所有服务
#   ./deploy.sh status    # 查看服务状态
#   ./deploy.sh logs      # 查看应用日志
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

info "Docker 目录: $DOCKER_DIR"

# 显示帮助
show_help() {
    echo "Shop 项目 Docker 部署脚本"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  infra       仅启动基础设施（MySQL/Redis/Kafka/ELK）"
    echo "  app         仅启动应用服务（shop-admin/shop-api）"
    echo "  all         启动所有服务（基础设施 + 应用）"
    echo "  down        停止所有服务"
    echo "  restart     重启应用服务"
    echo "  status      查看服务状态"
    echo "  logs [svc]  查看日志（默认查看应用日志，支持 mysql/redis/kafka 等基础设施）"
    echo "  build       构建镜像后部署"
    echo ""
    echo "示例:"
    echo "  $0 infra              # 开发时只启动基础设施，应用在 IDE 运行"
    echo "  $0 app                # 基础设施已启动，部署应用"
    echo "  $0 build              # 构建镜像 + 启动所有服务"
    echo "  $0 logs shop-admin    # 查看 shop-admin 日志"
}

case "${1:-help}" in
    infra)
        info "启动基础设施服务..."
        docker compose -f docker-compose.infra.yml up -d
        info "等待基础设施就绪..."
        sleep 10
        docker compose -f docker-compose.infra.yml ps
        info "✅ 基础设施启动完成"
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
        info "启动应用服务..."
        # 检查基础设施网络是否存在
        if ! docker network inspect shop_network > /dev/null 2>&1; then
            warn "基础设施网络不存在，请先运行: $0 infra"
            info "正在自动启动基础设施..."
            docker compose -f docker-compose.infra.yml up -d
            info "等待基础设施就绪..."
            # 健康检查：最多等待120秒
            wait_count=0
            while [ $wait_count -lt 24 ]; do
                if docker compose -f docker-compose.infra.yml ps | grep -q "healthy\|running"; then
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
        docker compose -f docker-compose.app.yml up -d
        info "等待应用服务就绪..."
        sleep 10
        docker compose -f docker-compose.app.yml ps
        info "✅ 应用服务启动完成"
        echo ""
        info "服务地址:"
        echo "  shop-admin API: http://localhost:8081"
        echo "  shop-admin Doc: http://localhost:8081/doc.html"
        echo "  shop-api API:   http://localhost:8080"
        echo "  shop-api Doc:   http://localhost:8080/doc.html"
        ;;

    all)
        info "启动所有服务..."
        docker compose up -d
        info "等待服务就绪..."
        sleep 15
        docker compose ps
        info "✅ 所有服务启动完成"
        ;;

    down)
        info "停止所有服务..."
        docker compose -f docker-compose.app.yml down 2>/dev/null || true
        docker compose -f docker-compose.infra.yml down 2>/dev/null || true
        docker compose down 2>/dev/null || true
        info "✅ 所有服务已停止"
        ;;

    restart)
        info "重启应用服务..."
        docker compose -f docker-compose.app.yml restart
        info "✅ 应用服务已重启"
        ;;

    status)
        echo -e "${BLUE}=== 基础设施 ===${NC}"
        docker compose -f docker-compose.infra.yml ps 2>/dev/null || echo "未启动"
        echo ""
        echo -e "${BLUE}=== 应用服务 ===${NC}"
        docker compose -f docker-compose.app.yml ps 2>/dev/null || echo "未启动"
        ;;

    logs)
        SERVICE="${2:-shop-admin}"
        # 判断是查看基础设施还是应用服务日志
        case "$SERVICE" in
            mysql|redis|kafka|rabbitmq|elasticsearch|kibana|zookeeper|infra)
                docker compose -f docker-compose.infra.yml logs -f --tail 100 "$SERVICE"
                ;;
            *)
                docker compose -f docker-compose.app.yml logs -f --tail 100 "$SERVICE"
                ;;
        esac
        ;;

    build)
        info "构建镜像..."
        "$SCRIPT_DIR/build.sh" all
        info "启动所有服务..."
        docker compose up -d
        sleep 15
        docker compose ps
        info "✅ 构建部署完成"
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        error "未知命令: $1，使用 -h 查看帮助"
        ;;
esac
