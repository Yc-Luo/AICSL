# AICSL 协作学习系统

AI-Enhanced Collaborative Learning System - 基于 Web 的实时协作学习平台

## 📖 项目简介

AICSL 是一个集成 AI 辅助教学功能的实时协作学习平台，支持多人实时协作编辑文档、绘制白板、管理资源库，并通过多智能体 AI 导师提供个性化学习指导。

### ✨ 主要特性

- 🎨 **实时协作白板** - 基于 Excalidraw，支持多人同时绘图、标注
- 📝 **协作文档编辑** - 基于 TipTap，支持富文本编辑和实时同步
- 💬 **群组聊天** - 项目内实时消息、文件分享
- 🤖 **AI 智能助手** - 多智能体系统，提供个性化学习辅导
- 📚 **RAG 知识库** - 文档索引和语义检索，增强 AI 回答能力
- 🔬 **探究式学习** - 引导式学习流程，支持假设验证和反思
- 📊 **学习分析仪表盘** - 可视化学习进度和行为分析
- 👥 **角色权限管理** - 学生、教师、管理员三级权限

## 🛠 技术栈

### 前端
- **框架**: React 18.3+ / TypeScript 5.3+ / Vite 5.0+
- **样式**: Tailwind CSS 3.4+
- **状态管理**: Zustand
- **实时协作**: Y.js 13.6+ / Socket.IO
- **白板**: Excalidraw
- **文档编辑**: TipTap 3.x

### 后端
- **框架**: Python 3.12+ / FastAPI 0.109+
- **数据库**: MongoDB 7.0+ (Beanie ODM)
- **缓存**: Redis 7
- **实时通信**: Socket.IO / WebSocket
- **AI**: LangChain / OpenAI / DeepSeek
- **向量搜索**: sentence-transformers

### 基础设施
- **容器化**: Docker / Docker Compose
- **对象存储**: MinIO (S3 兼容)
- **反向代理**: Nginx
- **监控**: Prometheus / Grafana

## 📁 项目结构

```
.
├── frontend/                 # React 前端项目
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/            # 页面组件
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── services/         # API 服务
│   │   └── modules/          # 功能模块 (inquiry 等)
│   └── package.json
├── backend/                  # FastAPI 后端项目
│   ├── app/
│   │   ├── api/v1/           # API 路由
│   │   ├── services/         # 业务逻辑
│   │   ├── repositories/     # 数据模型
│   │   └── core/             # 核心配置
│   └── pyproject.toml
├── nginx/                    # Nginx 配置
├── scripts/                  # 部署脚本
├── docker-compose.yml        # 开发环境 Docker 配置
├── docker-compose.production.yml  # 生产环境配置
└── Docs/                     # 项目文档
```

## 🚀 快速开始

### 前置要求

- Node.js 20.x (LTS)
- Python 3.12+
- Docker & Docker Compose
- Git

### 开发环境启动

1. **克隆项目**
```bash
git clone <repository-url>
cd AICSL_main
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置 API 密钥等信息
```

3. **启动 Docker 服务**
```bash
docker-compose up -d
```

4. **访问应用**
- 前端: http://localhost:8888
- 后端 API: http://localhost:8888/api/v1
- API 文档: http://localhost:8888/api/v1/docs

### 本地开发 (非 Docker)

```bash
# 后端
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 🏭 生产部署

详细部署文档请参阅：[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)

```bash
# 快速部署
./scripts/deploy.sh deploy

# 获取 SSL 证书
./scripts/deploy.sh ssl your-domain.com
```

## 📚 功能模块

### 学生端
- **项目列表**: 查看和管理参与的项目
- **协作工作区**: 白板、文档、资源、浏览器、任务等标签页
- **AI 助手**: 浮动球式 AI 聊天，支持上下文对话
- **学习仪表盘**: 个人学习进度和分析

### 教师端
- **项目监控**: 实时查看学生协作活动
- **班级管理**: 学生分组和权限管理
- **课程资源**: 上传和管理教学资源
- **作业批阅**: 查看和评价学生作业
- **RAG 知识库**: 管理 AI 知识库文档
- **智能体配置**: 自定义 AI 角色和行为

### 管理员端
- **用户管理**: 批量创建和管理用户
- **系统配置**: LLM 模型、系统参数设置
- **行为日志**: 查看系统使用日志

## 🧪 测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm run test

# 前端 lint 检查
npm run lint
```

## 📖 文档

- [需求文档](Docs/requirements.md)
- [设计文档](Docs/designs.md)
- [任务文档](Docs/tasks.md)
- [生产部署文档](PRODUCTION_DEPLOYMENT.md)
- [优化建议](Docs/optimization_recommendations.md)

## 🔧 开发指南

### 代码规范

- **后端**: Black, isort, Pylint, MyPy
- **前端**: ESLint, Prettier, TypeScript strict mode

### 分支策略

- `main`: 生产就绪代码
- `develop`: 开发分支
- `feature/*`: 功能开发
- `hotfix/*`: 紧急修复

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试相关
chore: 构建/工具
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

*最后更新: 2026-01-12*
