#!/bin/bash
# =============================================================================
# AICSL 自动备份脚本
# =============================================================================
# 此脚本用于 cron 定时任务，自动执行数据备份
# 
# 安装方法 (每天凌晨 2 点执行):
#   crontab -e
#   0 2 * * * /path/to/AICSL_main/scripts/backup.sh >> /var/log/aicsl-backup.log 2>&1
# =============================================================================

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"
ENV_FILE="$PROJECT_DIR/.env.production"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$BACKUP_DIR/backup.log"

# 保留天数
RETENTION_DAYS=7

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查环境
if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: 环境配置文件不存在: $ENV_FILE"
    exit 1
fi

# 加载环境变量
source "$ENV_FILE"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 开始备份
log "========== 开始自动备份 =========="

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# MongoDB 备份
log "备份 MongoDB..."
cd "$PROJECT_DIR"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T mongodb \
    mongodump --username "$MONGO_ROOT_USERNAME" --password "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin --db aicsl --archive > "$BACKUP_PATH/mongodb.archive" 2>/dev/null

if [ $? -eq 0 ]; then
    log "MongoDB 备份成功"
else
    log "ERROR: MongoDB 备份失败"
fi

# Redis 备份
log "备份 Redis..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis \
    redis-cli -a "$REDIS_PASSWORD" BGSAVE 2>/dev/null
sleep 3
docker cp aicsl-redis:/data/dump.rdb "$BACKUP_PATH/redis.rdb" 2>/dev/null

if [ $? -eq 0 ]; then
    log "Redis 备份成功"
else
    log "WARNING: Redis 备份可能失败"
fi

# 压缩备份
log "压缩备份文件..."
cd "$BACKUP_DIR"
tar -czf "backup_$TIMESTAMP.tar.gz" "$TIMESTAMP"
rm -rf "$TIMESTAMP"

BACKUP_SIZE=$(du -h "backup_$TIMESTAMP.tar.gz" | cut -f1)
log "备份完成: backup_$TIMESTAMP.tar.gz ($BACKUP_SIZE)"

# 清理旧备份
log "清理超过 ${RETENTION_DAYS} 天的旧备份..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
log "当前保留 $REMAINING 个备份文件"

# 检查磁盘空间
DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}')
log "备份目录磁盘使用率: $DISK_USAGE"

log "========== 备份任务完成 =========="
