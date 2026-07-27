# ============================================================
# PAT（生产）环境变量配置
# ============================================================

# 项目名称（控制容器名前缀，避免多项目冲突）
APP_NAME=shop-pat
# Docker Compose项目名称（重要：不要删除或修改，用于容器命名和网络隔离）
COMPOSE_PROJECT_NAME=shop-pat

# 应用版本（控制镜像标签）
APP_VERSION=1.0.0

# ==================== 端口配置 ====================
ADMIN_PORT=28081
API_PORT=28080
ADMIN_UI_PORT=25173

# ==================== 基础设施端口 ====================
MYSQL_PORT=23306
REDIS_PORT=26379
RABBITMQ_PORT=25673
RABBITMQ_MGMT_PORT=25674
KAFKA_PORT=29092
KAFKA_EXTERNAL_PORT=29094
ES_PORT=29200
LOGSTASH_PORT=25044
KIBANA_PORT=25601

# ==================== JVM 参数 ====================
ADMIN_JAVA_OPTS=-Xms1024m -Xmx2048m -XX:+UseG1GC
API_JAVA_OPTS=-Xms1024m -Xmx2048m -XX:+UseG1GC

# ==================== 数据库配置 ====================
MYSQL_USERNAME=root
MYSQL_PASSWORD=

# ==================== Redis 配置 ====================
REDIS_PASSWORD=

# ==================== JWT 配置 ====================
JWT_SECRET=shop-pat-secret-key-for-jwt-token-generation
JWT_EXPIRATION=604800000
