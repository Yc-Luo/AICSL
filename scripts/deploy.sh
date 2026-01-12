#!/bin/bash
# =============================================================================
# AICSL 生产环境部署脚本
# =============================================================================
# 使用方法: ./scripts/deploy.sh [command]
# 命令:
#   setup     - 首次部署设置
#   deploy    - 部署/更新应用
#   restart   - 重启所有服务
#   status    - 查看服务状态
#   logs      - 查看服务日志
#   backup    - 执行数据备份
#   ssl       - 获取/更新 SSL 证书
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
SSL_DIR="./nginx/ssl"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    # 检查环境文件
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境配置文件 $ENV_FILE 不存在"
        log_info "请复制 .env.production.example 为 $ENV_FILE 并填写配置"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 验证配置
validate_config() {
    log_info "验证配置..."
    
    # 加载环境变量
    source "$ENV_FILE"
    
    # 检查必要的配置
    local required_vars=(
        "DOMAIN_NAME"
        "JWT_SECRET_KEY"
        "SECRET_KEY"
        "MONGO_ROOT_PASSWORD"
        "MONGO_APP_PASSWORD"
        "REDIS_PASSWORD"
        "MINIO_ROOT_PASSWORD"
    )
    
    local missing=false
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"CHANGE_ME"* ]]; then
            log_error "配置项 $var 未设置或使用了默认值"
            missing=true
        fi
    done
    
    if [ "$missing" = true ]; then
        log_error "请在 $ENV_FILE 中设置所有必要的配置项"
        exit 1
    fi
    
    # 检查密钥长度
    if [ ${#JWT_SECRET_KEY} -lt 32 ]; then
        log_error "JWT_SECRET_KEY 长度必须至少为 32 字符"
        exit 1
    fi
    
    if [ ${#SECRET_KEY} -lt 32 ]; then
        log_error "SECRET_KEY 长度必须至少为 32 字符"
        exit 1
    fi
    
    log_success "配置验证通过"
}

# 首次设置
setup() {
    log_info "执行首次部署设置..."
    
    check_environment
    
    # 创建必要的目录
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$SSL_DIR"
    mkdir -p "./nginx/logs"
    
    # 检查 SSL 证书
    if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
        log_warning "SSL 证书不存在，将使用自签名证书（仅用于测试）"
        
        # 生成自签名证书
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/privkey.pem" \
            -out "$SSL_DIR/fullchain.pem" \
            -subj "/CN=localhost" 2>/dev/null
        
        log_warning "自签名证书已生成，请在生产环境中使用正式证书"
        log_info "获取 Let's Encrypt 证书: ./scripts/deploy.sh ssl"
    fi
    
    log_success "首次设置完成"
}

# 部署应用
deploy() {
    log_info "开始部署应用..."
    
    check_environment
    validate_config
    
    # 拉取最新的基础镜像
    log_info "拉取基础镜像..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull mongodb redis minio nginx
    
    # 构建应用镜像
    log_info "构建应用镜像..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache backend frontend
    
    # 启动服务
    log_info "启动服务..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    status
    
    log_success "部署完成!"
}

# 仅更新代码 (快速部署)
update() {
    log_info "快速更新应用..."
    
    check_environment
    validate_config
    
    # 构建应用镜像
    log_info "构建应用镜像..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build backend frontend
    
    # 滚动更新
    log_info "滚动更新后端..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend
    
    log_info "滚动更新前端..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps frontend
    
    log_success "更新完成!"
}

# 重启服务
restart() {
    log_info "重启所有服务..."
    
    check_environment
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    
    log_success "重启完成"
}

# 服务状态
status() {
    log_info "服务状态:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    log_info "资源使用:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
        aicsl-nginx aicsl-frontend aicsl-backend aicsl-mongodb aicsl-redis aicsl-minio 2>/dev/null || true
}

# 查看日志
logs() {
    local service=${1:-}
    
    if [ -z "$service" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f --tail=100
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f --tail=100 "$service"
    fi
}

# 数据备份
backup() {
    log_info "开始数据备份..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$timestamp"
    
    mkdir -p "$backup_path"
    
    # 加载环境变量
    source "$ENV_FILE"
    
    # MongoDB 备份
    log_info "备份 MongoDB..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T mongodb \
        mongodump --username "$MONGO_ROOT_USERNAME" --password "$MONGO_ROOT_PASSWORD" \
        --authenticationDatabase admin --db aicsl --archive > "$backup_path/mongodb.archive"
    
    # Redis 备份
    log_info "备份 Redis..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis \
        redis-cli -a "$REDIS_PASSWORD" --rdb /data/dump.rdb BGSAVE 2>/dev/null
    sleep 2
    docker cp aicsl-redis:/data/dump.rdb "$backup_path/redis.rdb"
    
    # 压缩备份
    log_info "压缩备份文件..."
    tar -czf "$BACKUP_DIR/backup_$timestamp.tar.gz" -C "$BACKUP_DIR" "$timestamp"
    rm -rf "$backup_path"
    
    # 清理旧备份 (保留最近 7 个)
    log_info "清理旧备份..."
    ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +8 | xargs -r rm -f
    
    log_success "备份完成: $BACKUP_DIR/backup_$timestamp.tar.gz"
}

# SSL 证书
ssl() {
    log_info "获取 SSL 证书..."
    
    source "$ENV_FILE"
    
    if [ -z "$DOMAIN_NAME" ]; then
        log_error "请在 $ENV_FILE 中设置 DOMAIN_NAME"
        exit 1
    fi
    
    # 使用 certbot 获取证书
    docker run -it --rm \
        -v "$SSL_DIR:/etc/letsencrypt/live/$DOMAIN_NAME" \
        -v "./nginx/logs:/var/log/letsencrypt" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --agree-tos \
        --no-eff-email \
        --email "admin@$DOMAIN_NAME" \
        -d "$DOMAIN_NAME"
    
    log_success "SSL 证书获取成功"
    log_info "请重启 Nginx: docker-compose -f $COMPOSE_FILE restart nginx"
}

# 停止服务
stop() {
    log_info "停止所有服务..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "所有服务已停止"
}

# 健康检查
health() {
    log_info "执行健康检查..."
    
    source "$ENV_FILE"
    
    echo ""
    
    # Nginx
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} Nginx"
    else
        echo -e "${RED}[✗]${NC} Nginx"
    fi
    
    # Backend API
    if curl -sf http://localhost/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} Backend API"
    else
        echo -e "${RED}[✗]${NC} Backend API"
    fi
    
    # MongoDB
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T mongodb \
        mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} MongoDB"
    else
        echo -e "${RED}[✗]${NC} MongoDB"
    fi
    
    # Redis
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis \
        redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} Redis"
    else
        echo -e "${RED}[✗]${NC} Redis"
    fi
    
    # MinIO
    if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}[✓]${NC} MinIO"
    else
        echo -e "${RED}[✗]${NC} MinIO"
    fi
    
    echo ""
}

# 显示帮助
show_help() {
    echo "AICSL 生产环境部署脚本"
    echo ""
    echo "使用方法: $0 <command>"
    echo ""
    echo "命令:"
    echo "  setup     首次部署设置"
    echo "  deploy    完整部署 (构建 + 启动)"
    echo "  update    快速更新 (仅重建应用)"
    echo "  restart   重启所有服务"
    echo "  stop      停止所有服务"
    echo "  status    查看服务状态"
    echo "  health    健康检查"
    echo "  logs      查看日志 [service]"
    echo "  backup    执行数据备份"
    echo "  ssl       获取 SSL 证书"
    echo "  help      显示此帮助"
    echo ""
}

# 主入口
case "${1:-help}" in
    setup)
        setup
        ;;
    deploy)
        deploy
        ;;
    update)
        update
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    logs)
        logs "${2:-}"
        ;;
    backup)
        backup
        ;;
    ssl)
        ssl
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac
