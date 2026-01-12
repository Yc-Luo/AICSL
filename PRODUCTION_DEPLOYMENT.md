# AICSL 生产环境部署完整指南

> **最后更新:** 2026-01-10

## 📋 目录

1. [前置条件](#前置条件)
2. [快速部署](#快速部署)
3. [详细配置说明](#详细配置说明)
4. [SSL/HTTPS 配置](#sslhttps-配置)
5. [监控与维护](#监控与维护)
6. [故障排除](#故障排除)
7. [安全加固清单](#安全加固清单)

---

## 前置条件

### 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核心 | 4+ 核心 |
| 内存 | 4 GB | 8+ GB |
| 磁盘 | 40 GB SSD | 100+ GB SSD |
| 系统 | Ubuntu 20.04+ / CentOS 8+ | Ubuntu 22.04 LTS |

### 软件依赖

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

---

## 快速部署

### 步骤 1: 获取代码

```bash
git clone <repository-url> /opt/aicsl
cd /opt/aicsl
```

### 步骤 2: 配置环境变量

```bash
# 复制配置模板
cp .env.production.example .env.production

# 生成安全密钥
JWT_KEY=$(openssl rand -hex 32)
SECRET_KEY=$(openssl rand -hex 32)
MONGO_PASS=$(openssl rand -base64 24)
REDIS_PASS=$(openssl rand -base64 24)
MINIO_PASS=$(openssl rand -base64 24)

# 输出密钥 (请妥善保存)
echo "JWT_SECRET_KEY=$JWT_KEY"
echo "SECRET_KEY=$SECRET_KEY"
echo "MONGO_ROOT_PASSWORD=$MONGO_PASS"
echo "REDIS_PASSWORD=$REDIS_PASS"
echo "MINIO_ROOT_PASSWORD=$MINIO_PASS"

# 编辑配置文件，填入上述密钥和域名
vim .env.production
```

### 步骤 3: 准备 SSL 证书

```bash
# 创建证书目录
mkdir -p nginx/ssl

# 方式 A: 使用 Let's Encrypt (推荐)
./scripts/deploy.sh ssl

# 方式 B: 使用自签名证书 (仅测试)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/CN=yourdomain.com"
```

### 步骤 4: 首次部署

```bash
# 给脚本执行权限
chmod +x scripts/*.sh

# 首次设置
./scripts/deploy.sh setup

# 部署应用
./scripts/deploy.sh deploy

# 查看状态
./scripts/deploy.sh status
```

### 步骤 5: 验证部署

```bash
# 健康检查
./scripts/deploy.sh health

# 访问应用
curl -I https://yourdomain.com
```

---

## 详细配置说明

### 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DOMAIN_NAME` | 您的域名 | `aicsl.example.com` |
| `JWT_SECRET_KEY` | JWT 签名密钥 (64字符) | `openssl rand -hex 32` |
| `SECRET_KEY` | 应用加密密钥 (64字符) | `openssl rand -hex 32` |
| `MONGO_ROOT_PASSWORD` | MongoDB 管理员密码 | 强密码 |
| `MONGO_APP_PASSWORD` | MongoDB 应用密码 | 强密码 |
| `REDIS_PASSWORD` | Redis 密码 | 强密码 |
| `MINIO_ROOT_PASSWORD` | MinIO 密码 (≥8字符) | 强密码 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-...` |
| `BACKEND_WORKERS` | 后端工作进程数 | `4` |

### 资源限制调整

根据服务器配置，编辑 `docker-compose.production.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 4G    # 高负载场景
        cpus: '4.0'
```

---

## SSL/HTTPS 配置

### 使用 Let's Encrypt

```bash
# 首次获取证书
./scripts/deploy.sh ssl

# 设置自动续期 (添加到 crontab)
0 0 1 * * /opt/aicsl/scripts/deploy.sh ssl >> /var/log/ssl-renew.log 2>&1
```

### 使用商业证书

将证书文件放置到:
- 证书链: `nginx/ssl/fullchain.pem`
- 私钥: `nginx/ssl/privkey.pem`

```bash
# 重启 Nginx 使证书生效
docker-compose -f docker-compose.production.yml restart nginx
```

---

## 监控与维护

### 日常命令

```bash
# 查看服务状态
./scripts/deploy.sh status

# 查看日志
./scripts/deploy.sh logs           # 所有服务
./scripts/deploy.sh logs backend   # 特定服务

# 重启服务
./scripts/deploy.sh restart

# 快速更新 (代码变更后)
./scripts/deploy.sh update
```

### 数据备份

```bash
# 手动备份
./scripts/deploy.sh backup

# 自动备份 (每天凌晨 2 点)
# 添加到 crontab:
0 2 * * * /opt/aicsl/scripts/backup.sh >> /var/log/aicsl-backup.log 2>&1
```

### 数据恢复

```bash
# 解压备份
tar -xzf backups/backup_20260110_020000.tar.gz -C /tmp

# 恢复 MongoDB
docker-compose -f docker-compose.production.yml exec -T mongodb \
    mongorestore --archive < /tmp/20260110_020000/mongodb.archive

# 恢复 Redis
docker cp /tmp/20260110_020000/redis.rdb aicsl-redis:/data/dump.rdb
docker-compose -f docker-compose.production.yml restart redis
```

---

## 故障排除

### 常见问题

#### 1. 服务启动失败

```bash
# 检查详细日志
docker-compose -f docker-compose.production.yml logs backend

# 检查容器状态
docker ps -a

# 重建特定服务
docker-compose -f docker-compose.production.yml up -d --build backend
```

#### 2. 数据库连接失败

```bash
# 进入 MongoDB 容器测试
docker-compose -f docker-compose.production.yml exec mongodb mongosh

# 检查认证
db.auth("aicsl_app", "your_password")
```

#### 3. HTTPS 不工作

```bash
# 检查证书
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# 检查 Nginx 配置
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

#### 4. 磁盘空间不足

```bash
# 清理 Docker 资源
docker system prune -a --volumes

# 清理旧备份
ls -la backups/
rm backups/backup_202601*.tar.gz
```

---

## 安全加固清单

### 必须完成 ✅

- [ ] 所有密钥已使用 `openssl rand -hex 32` 生成
- [ ] MongoDB 已启用认证
- [ ] Redis 已设置密码
- [ ] MinIO 已更改默认密码
- [ ] HTTPS 已启用
- [ ] 防火墙只开放 80/443 端口
- [ ] SSH 禁用密码登录

### 建议完成 🔧

- [ ] 配置日志轮转
- [ ] 设置监控告警
- [ ] 配置 CDN 加速
- [ ] 设置自动备份
- [ ] 配置 fail2ban

### 防火墙配置

```bash
# Ubuntu/Debian (ufw)
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 架构图

```
                    ┌─────────────────────────────────────────┐
                    │              Internet                    │
                    └─────────────────┬───────────────────────┘
                                      │
                              ┌───────▼───────┐
                              │   Nginx       │
                              │ (443/80 SSL)  │
                              └───────┬───────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
      ┌───────▼───────┐       ┌───────▼───────┐       ┌───────▼───────┐
      │   Frontend    │       │   Backend     │       │    MinIO      │
      │   (React)     │       │   (FastAPI)   │       │  (Storage)    │
      └───────────────┘       └───────┬───────┘       └───────────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
              ┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
              │   MongoDB     │ │   Redis   │ │    LLM API    │
              │  (Database)   │ │  (Cache)  │ │  (DeepSeek)   │
              └───────────────┘ └───────────┘ └───────────────┘
```

---

## 联系支持

如遇到无法解决的问题，请提供以下信息：

1. 服务状态: `./scripts/deploy.sh status`
2. 错误日志: `./scripts/deploy.sh logs > /tmp/logs.txt`
3. 系统信息: `uname -a && docker --version`

---

**祝您部署顺利! 🚀**
