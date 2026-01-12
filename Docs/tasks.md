# AICSL 协作学习系统 - 开发任务文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2025-12-24 |
| 文档状态 | 正式版 |
| 关联文档 | System.md、requirements.md、designs.md |

---

## 任务概览

### 阶段划分

| 阶段 | 名称 | 目标 | 任务数量 |
|------|------|------|----------|
| **P1** | 基础设施与骨架 | 跑通 Hello World，DB 连接，Auth，Layout | 24 |
| **P2** | 核心协作 MVP | 白板、文档、聊天的基础即时同步 | 32 |
| **P3** | 智能化与完善 | AI 导师、数据分析、浏览器批注 | 28 |

### 优先级说明

| 优先级 | 图标 | 说明 |
|--------|------|------|
| **P0** | 🔥 | Blocker: 基础设施、核心链路。不完成它，后面的都做不了 |
| **P1** | 🔴 | Core: MVP 核心功能。不完成它，产品无法演示 |
| **P2** | 🟡 | Feature: 完整性功能。没有它产品也能用，但体验缺损 |
| **P3** | 🟢 | Nice to have: 锦上添花 |

### 角色说明

| 角色 | 说明 |
|------|------|
| `[INFRA]` | 基础设施/DevOps (Docker, Nginx, CI/CD) |
| `[BE]` | 后端 (FastAPI, Python, MongoDB) |
| `[FE]` | 前端 (Next.js, React, Tailwind) |
| `[AI]` | 算法与模型 (LangChain, Prompt Engineering) |
| `[QA]` | 质量保证 (E2E测试, 系统测试) |

---

## Phase 1: 基础设施与骨架 (Infrastructure & Skeleton)

### 目标
跑通 Hello World，DB 连接，Auth，Layout。

### 任务列表

| **ID** | **阶段** | **角色** | **P级** | **任务名称** | **依赖** | **产出接口 / 验收标准** |
|--------|----------|----------|----------|--------------|----------|------------------------|
| **INFRA-001** | P1 | `[INFRA]` | 🔥 **P0** | **初始化 Monorepo 项目结构** | 无 | ✅ AC1: 创建 frontend/、backend/、shared/ 目录结构<br>✅ AC2: 配置 pnpm (前端) 和 Poetry (后端) 包管理器<br>✅ AC3: 配置 .gitignore 和 README.md |

#### 变量声明

**配置变量**
```
project_name: string = "aicsl-collaborative-learning" // 项目名称
frontend_dir: string = "frontend" // 前端目录名称
backend_dir: string = "backend" // 后端目录名称
shared_dir: string = "shared" // 共享代码目录名称
```

**输入变量**
```
init_command: string = "pnpm create next-app" // Next.js 初始化命令
poetry_init_command: string = "poetry init" // Poetry 初始化命令
```

**输出变量**
```
directory_structure: object // 项目目录结构
package_json_files: array // 所有 package.json 文件路径
pyproject_toml_file: string // pyproject.toml 文件路径
```

**状态变量**
```
repo_initialized: boolean = False // 仓库是否已初始化
package_managers_configured: boolean = False // 包管理器是否已配置
```
| **INFRA-002** | P1 | `[INFRA]` | 🔥 **P0** | **配置 Docker Compose 开发环境** | [INFRA-001] | ✅ AC1: docker-compose.yml 包含 MongoDB 7.0、Redis、MinIO 服务<br>✅ AC2: 配置网络和数据卷持久化<br>✅ AC3: 执行 `docker-compose up -d` 成功启动所有服务 |

#### 变量声明

**配置变量**
```
mongodb_version: string = "7.0" // MongoDB 版本
redis_version: string = "7-alpine" // Redis 版本
minio_version: string = "latest" // MinIO 版本
docker_network_name: string = "aicsl-network" // Docker 网络名称
```

**输入变量**
```
docker_compose_file: string = "docker-compose.yml" // Docker Compose 配置文件路径
```

**输出变量**
```
container_ids: object // 所有启动的容器 ID
network_id: string // Docker 网络 ID
volume_ids: object // 所有数据卷 ID
```

**状态变量**
```
docker_services_running: boolean = False // Docker 服务是否运行
containers_healthy: boolean = False // 容器健康状态
```
| **INFRA-003** | P1 | `[INFRA]` | 🔥 **P0** | **配置代码质量工具** | [INFRA-001] | ✅ AC1: 后端配置 Pylint、Black、isort<br>✅ AC2: 前端配置 ESLint、Prettier<br>✅ AC3: 配置 pre-commit hook 自动格式化 |

#### 变量声明

**配置变量**
```
pylint_config_file: string = ".pylintrc" // Pylint 配置文件
black_line_length: integer = 88 // Black 行长度限制
isort_profile: string = "black" // isort 配置文件
eslint_config_file: string = ".eslintrc.json" // ESLint 配置文件
prettier_config_file: string = ".prettierrc" // Prettier 配置文件
```

**输入变量**
```
backend_dir: string = "backend" // 后端目录路径
frontend_dir: string = "frontend" // 前端目录路径
```

**输出变量**
```
lint_config_files: array // 所有代码质量配置文件路径
pre_commit_hook_file: string = ".git/hooks/pre-commit" // pre-commit hook 文件路径
```

**状态变量**
```
lint_tools_installed: boolean = False // 代码质量工具是否已安装
pre_commit_configured: boolean = False // pre-commit hook 是否已配置
```
| **INFRA-004** | P1 | `[INFRA]` | 🔥 **P0** | **配置环境变量管理** | [INFRA-001] | ✅ AC1: 后端使用 pydantic-settings 读取 .env<br>✅ AC2: 前端使用 import.meta.env 读取环境变量<br>✅ AC3: 提供 .env.example 模板文件 |

#### 变量声明

**配置变量**
```
env_file: string = ".env" // 环境变量文件
env_example_file: string = ".env.example" // 环境变量示例文件
backend_settings_module: string = "app.core.config" // 后端配置模块
frontend_env_prefix: string = "VITE_" // 前端环境变量前缀
```

**输入变量**
```
env_variables: object // 环境变量键值对
```

**输出变量**
```
backend_config: object // 后端配置对象
frontend_env: object // 前端环境变量对象
```

**状态变量**
```
env_file_exists: boolean = False // .env 文件是否存在
env_configured: boolean = False // 环境变量是否已配置
```
| **BE-101** | P1 | `[BE]` | 🔥 **P0** | **实现 MongoDB 连接与 Beanie ODM** | [INFRA-002], [INFRA-004] | ✅ AC1: 使用 Motor 异步驱动连接 MongoDB<br>✅ AC2: 配置 Beanie ODM 和 lifespan 启动事件<br>✅ AC3: 包含数据库连接的 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
mongodb_uri: string = "mongodb://localhost:27017" // MongoDB 连接 URI
mongodb_db_name: string = "aicsl" // 数据库名称
mongodb_max_pool_size: integer = 10 // 连接池最大连接数
```

**输入变量**
```
connection_string: string // 数据库连接字符串
database_name: string // 数据库名称
```

**输出变量**
```
motor_client: AsyncIOMotorClient // Motor 异步客户端
beanie_documents: array // Beanie 文档模型列表
```

**状态变量**
```
db_connected: boolean = False // 数据库连接状态
connection_pool_size: integer = 0 // 当前连接池大小
```
| **BE-102** | P1 | `[BE]` | 🔥 **P0** | **实现用户认证模块 (JWT)** | [BE-101] | **`POST /api/v1/auth/login`**<br>· In: OAuth2PasswordRequestForm (email, password)<br>· Out: Token (access_token, refresh_token)<br>**`POST /api/v1/auth/refresh`**<br>· In: TokenRefreshRequest (refresh_token)<br>· Out: Token (access_token)<br>**`POST /api/v1/auth/logout`**<br>· In: HTTP Authorization Header<br>· Out: SuccessResponse<br>✅ AC1: 使用 Bcrypt 校验密码哈希<br>✅ AC2: JWT access_token 有效期 15 分钟，refresh_token 有效期 7 天<br>✅ AC3: 包含针对 login/refresh/logout 服务的 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
jwt_secret_key: string // JWT 密钥（从环境变量读取）
jwt_algorithm: string = "HS256" // JWT 签名算法
access_token_expire_minutes: integer = 15 // Access Token 有效期（分钟）
refresh_token_expire_days: integer = 7 // Refresh Token 有效期（天）
bcrypt_rounds: integer = 12 // Bcrypt 哈希轮数
```

**输入变量**
```
email: string // 用户邮箱
password: string // 用户密码
refresh_token: string // 刷新令牌
authorization_header: string // HTTP 授权头
```

**输出变量**
```
access_token: string // 访问令牌
refresh_token: string // 刷新令牌
token_type: string = "bearer" // 令牌类型
```

**状态变量**
```
user_authenticated: boolean = False // 用户认证状态
token_valid: boolean = False // 令牌有效性
```
| **BE-103** | P1 | `[BE]` | 🔥 **P0** | **实现用户管理 API** | [BE-102] | **`GET /api/v1/users/me`**<br>· Out: UserResponse (id, username, email, role, avatar_url)<br>**`PUT /api/v1/users/me`**<br>· In: UserUpdateRequest (username, avatar_url, settings)<br>· Out: UserResponse<br>**`POST /api/v1/users`**<br>· In: UserCreateRequest (username, email, password, role)<br>· Out: UserResponse<br>✅ AC1: 实现基于依赖注入的 get_current_user 中间件<br>✅ AC2: 支持批量创建用户（Excel 导入）<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
bcrypt_rounds: integer = 12 // Bcrypt 哈希轮数
max_avatar_size: integer = 5242880 // 头像文件最大大小（5MB）
excel_import_batch_size: integer = 100 // Excel 导入批量处理大小
```

**输入变量**
```
username: string // 用户名
email: string // 用户邮箱
password: string // 用户密码
role: string // 用户角色（student/teacher/admin）
avatar_url: string // 头像 URL
settings: object // 用户设置（主题、语言、通知开关）
excel_file: File // Excel 导入文件
```

**输出变量**
```
user_response: object // 用户响应对象（id, username, email, role, avatar_url）
created_users: array // 批量创建的用户列表
```

**状态变量**
```
current_user: object // 当前登录用户
users_count: integer = 0 // 用户总数
```
| **BE-104** | P1 | `[BE]` | 🔥 **P0** | **实现项目管理 API** | [BE-103] | **`GET /api/v1/projects`**<br>· Out: ProjectListResponse (projects[])<br>**`POST /api/v1/projects`**<br>· In: ProjectCreateRequest (name, description)<br>· Out: ProjectResponse<br>**`GET /api/v1/projects/{project_id}`**<br>· Out: ProjectDetailResponse (members, progress)<br>**`POST /api/v1/projects/{project_id}/members`**<br>· In: ProjectMemberAddRequest (user_id, role)<br>· Out: SuccessResponse<br>✅ AC1: 实现项目级权限检查（RBAC）<br>✅ AC2: 支持最多 5 人成员限制<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
max_project_members: integer = 5 // 项目最大成员数
project_name_min_length: integer = 3 // 项目名称最小长度
project_name_max_length: integer = 50 // 项目名称最大长度
description_max_length: integer = 500 // 描述最大长度
```

**输入变量**
```
project_id: string // 项目 ID
name: string // 项目名称
description: string // 项目描述
user_id: string // 用户 ID
role: string // 成员角色（owner/editor/viewer）
```

**输出变量**
```
project_list: array // 项目列表
project_response: object // 项目响应对象（id, name, description, owner_id, members, progress）
success_response: object // 成功响应对象
```

**状态变量**
```
current_project: object // 当前项目
project_members_count: integer = 0 // 项目成员数量
project_progress: float = 0.0 // 项目进度（0.0 - 1.0）
```
| **BE-105** | P1 | `[BE]` | 🔥 **P0** | **实现班级管理 API** | [BE-103] | **`GET /api/v1/courses`**<br>· Out: CourseListResponse (courses[])<br>**`POST /api/v1/courses`**<br>· In: CourseCreateRequest (name, semester)<br>· Out: CourseResponse (invite_code)<br>**`POST /api/v1/courses/join`**<br>· In: CourseJoinRequest (invite_code)<br>· Out: SuccessResponse<br>✅ AC1: 自动生成 6 位随机邀请码<br>✅ AC2: 支持邀请码唯一性校验<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
invite_code_length: integer = 6 // 邀请码长度
course_name_min_length: integer = 3 // 班级名称最小长度
course_name_max_length: integer = 50 // 班级名称最大长度
semester_format: string = "YYYY-Spring/Summer/Fall" // 学期格式
```

**输入变量**
```
course_id: string // 班级 ID
name: string // 班级名称
semester: string // 学期
teacher_id: string // 教师 ID
invite_code: string // 邀请码
student_id: string // 学生 ID
```

**输出变量**
```
course_list: array // 班级列表
course_response: object // 班级响应对象（id, name, teacher_id, semester, invite_code, students）
success_response: object // 成功响应对象
```

**状态变量**
```
current_course: object // 当前班级
course_students_count: integer = 0 // 班级学生数量
invite_code_valid: boolean = False // 邀请码有效性
```
| **BE-106** | P1 | `[BE]` | 🔥 **P0** | **实现 Socket.IO 服务器** | [BE-102] | ✅ AC1: 集成 python-socketio 到 FastAPI<br>✅ AC2: 实现 join_room、send_message 事件<br>✅ AC3: 实现成员在线状态同步（user_joined, user_left） |

#### 变量声明

**配置变量**
```
socketio_cors_origins: array = ["*"] // CORS 允许的源
socketio_ping_timeout: integer = 60000 // Ping 超时时间（毫秒）
socketio_ping_interval: integer = 25000 // Ping 间隔时间（毫秒）
room_prefix: string = "project:" // 房间前缀
```

**输入变量**
```
sid: string // Socket.IO 会话 ID
room_id: string // 房间 ID
event_name: string // 事件名称
event_data: object // 事件数据
message_content: string // 消息内容
user_id: string // 用户 ID
```

**输出变量**
```
socketio_server: AsyncServer // Socket.IO 服务器实例
connected_clients: array // 已连接的客户端列表
room_clients: object // 房间客户端映射
```

**状态变量**
```
socket_connected: boolean = False // Socket 连接状态
online_users: array = [] // 在线用户列表
room_joined: boolean = False // 房间加入状态
```
| **BE-107** | P1 | `[BE]` | 🔥 **P0** | **实现 Y-Websocket 服务器** | [BE-101] | ✅ AC1: 使用 ypy-websocket 作为 ASGI 应用<br>✅ AC2: 通过 app.mount("/ysocket", yjs_app) 挂载到 FastAPI<br>✅ AC3: 实现房间概念（room_id: wb:{project_id}, doc:{project_id}） |

#### 变量声明

**配置变量**
```
ywebsocket_mount_path: string = "/ysocket" // Y-Websocket 挂载路径
whiteboard_room_prefix: string = "wb:" // 白板房间前缀
document_room_prefix: string = "doc:" // 文档房间前缀
yjs_update_buffer_size: integer = 1024 // Y.js 更新缓冲区大小
```

**输入变量**
```
room_id: string // 房间 ID
project_id: string // 项目 ID
document_type: string // 文档类型（whiteboard/document）
update_vector: bytes // Y.js 更新向量
client_id: string // 客户端 ID
```

**输出变量**
```
yjs_app: ASGIApp // Y-Websocket ASGI 应用
room_map: object // 房间映射
connected_yjs_clients: array // 已连接的 Y.js 客户端列表
```

**状态变量**
```
yjs_server_running: boolean = False // Y-Websocket 服务器运行状态
room_active: boolean = False // 房间活跃状态
client_synced: boolean = False // 客户端同步状态
```
| **BE-107-1** | P1 | `[BE]` | 🔴 **P1** | **实现双通道房间映射策略** | [BE-106], [BE-107] | **房间映射规则**<br>• Socket.IO 房间: `project:{project_id}`（项目级大房间）<br>• Y.js 白板房间: `wb:{project_id}`（资源级小房间）<br>• Y.js 文档房间: `doc:{document_id}`（资源级小房间）<br>**接口**<br>• `get_room_mapping(project_id)` - 获取项目的房间映射<br>• `validate_room_access(room_id, user_id)` - 验证房间访问权限<br>✅ AC1: 实现项目级 Socket.IO 房间管理<br>✅ AC2: 实现资源级 Y.js 房间管理<br>✅ AC3: 实现房间访问权限验证<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
socketio_room_prefix: string = "project:" // Socket.IO 房间前缀
yjs_whiteboard_prefix: string = "wb:" // Y.js 白板房间前缀
yjs_document_prefix: string = "doc:" // Y.js 文档房间前缀
room_cache_ttl: integer = 3600 // 房间缓存 TTL（秒）
```

**输入变量**
```
project_id: string // 项目 ID
document_id: string // 文档 ID
user_id: string // 用户 ID
room_id: string // 房间 ID
```

**输出变量**
```
room_mapping: object // 房间映射 {socketio_room, yjs_rooms[]}
room_access_granted: boolean // 房间访问权限
```

**状态变量**
```
active_rooms: object = {} // 活跃房间映射
room_members: object = {} // 房间成员映射
```
| **BE-108** | P1 | `[BE]` | 🔥 **P0** | **实现文件上传 API（前端直传 Presigned URL）** | [BE-101], [INFRA-002] | **`POST /api/v1/storage/presigned-url`**<br>· In: PresignedURLRequest (filename, file_type, size, md5, project_id)<br>· Out: PresignedURLResponse (upload_url, file_key, expires_in)<br>**`POST /api/v1/resources`**<br>· In: ResourceCreateRequest (file_key, filename, size, project_id)<br>· Out: ResourceResponse (id, url, file_key, filename, size, uploaded_by, uploaded_at)<br>**`GET /api/v1/resources/{project_id}`**<br>· Out: ResourceListResponse (resources[])<br>**`DELETE /api/v1/resources/{resource_id}`**<br>· Out: SuccessResponse<br>✅ AC1: 使用 MinIO/S3 SDK 生成 Presigned PUT URL（有效期5分钟）<br>✅ AC2: 文件大小限制 50MB，项目存储配额 5GB<br>✅ AC3: 校验用户是否为项目成员<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
minio_endpoint: string = "localhost:9000" // MinIO 端点
minio_access_key: string // MinIO 访问密钥
minio_secret_key: string // MinIO 密钥
minio_bucket_name: string = "aicsl-resources" // MinIO 存储桶名称
presigned_url_expires: integer = 300 // Presigned URL 有效期（秒）
max_file_size: integer = 52428800 // 文件最大大小（50MB）
project_storage_quota: integer = 5368709120 // 项目存储配额（5GB）
allowed_file_types: array = ["pdf", "docx", "xlsx", "pptx", "jpg", "png", "mp4", "zip"] // 允许的文件类型
```

**输入变量**
```
filename: string // 文件名
file_type: string // 文件类型（MIME类型）
size: integer // 文件大小（字节）
md5: string // 文件 MD5 哈希
project_id: string // 项目 ID
resource_id: string // 资源 ID
file_key: string // 文件在对象存储中的键
```

**输出变量**
```
presigned_url_response: object // Presigned URL 响应（upload_url, file_key, expires_in）
resource_response: object // 资源响应对象（id, url, file_key, filename, size, uploaded_by, uploaded_at）
resource_list: array // 资源列表
success_response: object // 成功响应对象
```

**状态变量**
```
presigned_url_generated: boolean = False // Presigned URL 生成状态
file_uploaded: boolean = False // 文件上传状态
project_storage_used: integer = 0 // 项目已使用存储
```
| **BE-137** | P1 | `[BE]` | 🔴 **P1** | **实现文件访问控制（预签名读取链接）** | [BE-108] | **`GET /api/v1/resources/{project_id}`**<br>· Out: ResourceListResponse (resources[] with presigned_urls)<br>**`GET /api/v1/resources/{resource_id}/download-url`**<br>· Out: DownloadURLResponse (download_url, expires_in)<br>✅ AC1: 为每个文件生成 Presigned GET URL（有效期1小时）<br>✅ AC2: 存储桶设置为 Private（禁止 Public Read）<br>✅ AC3: 即使链接泄露，1小时后自动失效<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
presigned_get_url_expires: integer = 3600 // Presigned GET URL 有效期（秒）
bucket_policy: string = "private" // 存储桶策略（私有）
```

**输入变量**
```
project_id: string // 项目 ID
resource_id: string // 资源 ID
```

**输出变量**
```
resource_list: array // 资源列表（每个资源包含 presigned_url）
download_url_response: object // 下载 URL 响应（download_url, expires_in）
```

**状态变量**
```
presigned_url_generated: boolean = False // Presigned URL 生成状态
```
| **BE-138** | P1 | `[BE]` | 🔴 **P1** | **实现文件删除（软删除 + 异步硬删除）** | [BE-108] | **`DELETE /api/v1/resources/{resource_id}`**<br>· Out: SuccessResponse<br>**`POST /api/v1/resources/{resource_id}/restore`**<br>· Out: SuccessResponse（可选，用于回收站功能）<br>**后台任务**<br>• `storage_service.delete_file(file_key)` - 异步删除物理文件<br>• `cleanup_orphan_files()` - 清理孤儿文件（Cron Job）<br>✅ AC1: 用户删除时立即标记数据库记录 `is_deleted = True`（软删除）<br>✅ AC2: 使用 FastAPI.BackgroundTasks 触发异步硬删除<br>✅ AC3: 硬删除失败时记录 Error Log<br>✅ AC4: 每日 Cron Job 清理孤儿文件<br>✅ AC5: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
soft_delete_enabled: boolean = True // 是否启用软删除
cleanup_orphan_files_interval: string = "0 2 * * *" // 清理孤儿文件 Cron 表达式（每天凌晨2点）
```

**输入变量**
```
resource_id: string // 资源 ID
file_key: string // 文件在对象存储中的键
```

**输出变量**
```
success_response: object // 成功响应对象
```

**状态变量**
```
soft_deleted: boolean = False // 软删除状态
hard_deleted: boolean = False // 硬删除状态
orphan_files_count: integer = 0 // 孤儿文件数量
```
| **BE-139** | P2 | `[BE]` | 🟢 **P3** | **实现 CDN 加速（P2 阶段）** | [BE-137] | **CDN 配置**<br>• AWS: 配置 CloudFront -> S3，使用 CloudFront Signed URL<br>• 阿里云: 配置 CDN -> OSS，使用 CDN URL 鉴权<br>**接口**<br>• `StorageService.generate_url(file_key, expires_in)` - 生成 CDN 签名 URL<br>✅ AC1: 抽象 StorageService.generate_url() 方法<br>✅ AC2: 支持在不同环境切换签名逻辑（S3/CloudFront/OSS）<br>✅ AC3: 静态资源通过 CDN 分发<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
cdn_enabled: boolean = False // CDN 功能开关
cdn_provider: string = "none" // CDN 提供商（aws/cloudflare/aliyun/none）
cdn_endpoint: string = "" // CDN 端点
cloudfront_private_key: string = "" // CloudFront 私钥（用于签名）
cloudfront_key_pair_id: string = "" // CloudFront Key Pair ID
```

**输入变量**
```
file_key: string // 文件在对象存储中的键
expires_in: integer // URL 有效期（秒）
```

**输出变量**
```
cdn_url: string // CDN 签名 URL
```

**状态变量**
```
cdn_configured: boolean = False // CDN 配置状态
```
| **BE-140** | P3 | `[BE]` | 🟢 **P3** | **实现分片上传（V2 优化）** | [BE-108] | **分片上传流程**<br>• Initiate Multipart: 初始化分片上传<br>• Upload Parts: 并行上传分片（使用 Uppy）<br>• Complete Multipart: 完成分片上传<br>**接口**<br>• `POST /api/v1/storage/multipart/init` - 初始化分片上传<br>• `POST /api/v1/storage/multipart/part-url` - 获取分片上传 URL<br>• `POST /api/v1/storage/multipart/complete` - 完成分片上传<br>✅ AC1: 支持文件 > 100MB 时自动启用分片上传<br>✅ AC2: 支持断点续传<br>✅ AC3: 支持并行上传分片<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
multipart_upload_threshold: integer = 104857600 // 分片上传阈值（100MB）
part_size: integer = 5242880 // 分片大小（5MB）
max_concurrent_parts: integer = 5 // 最大并发分片数
```

**输入变量**
```
filename: string // 文件名
file_type: string // 文件类型
size: integer // 文件大小
project_id: string // 项目 ID
upload_id: string // 分片上传 ID
part_number: integer // 分片编号
```

**输出变量**
```
multipart_init_response: object // 分片上传初始化响应（upload_id, file_key）
part_upload_url_response: object // 分片上传 URL 响应（part_upload_url）
multipart_complete_response: object // 分片上传完成响应（file_key, location）
```

**状态变量**
```
multipart_upload_in_progress: boolean = False // 分片上传进行中
uploaded_parts_count: integer = 0 // 已上传分片数
total_parts_count: integer = 0 // 总分片数
```
| **FE-201** | P1 | `[FE]` | 🔥 **P0** | **初始化 Next.js 前端项目** | [INFRA-001] | ✅ AC1: 使用 pnpm create next-app 创建项目<br>✅ AC2: 配置 TypeScript、Tailwind CSS、ShadcnUI<br>✅ AC3: 配置 ESLint 和 Prettier |

#### 变量声明

**配置变量**
```
next_version: string = "latest" // Next.js 版本
typescript_version: string = "latest" // TypeScript 版本
tailwind_version: string = "latest" // Tailwind CSS 版本
shadcn_ui_version: string = "latest" // ShadcnUI 版本
eslint_config_file: string = ".eslintrc.json" // ESLint 配置文件
prettier_config_file: string = ".prettierrc" // Prettier 配置文件
```

**输入变量**
```
project_name: string = "aicsl-frontend" // 前端项目名称
typescript_flag: string = "--typescript" // TypeScript 标志
tailwind_flag: string = "--tailwind" // Tailwind CSS 标志
app_router_flag: string = "--app" // App Router 标志
```

**输出变量**
```
package_json: object // package.json 文件内容
tsconfig_json: object // tsconfig.json 文件内容
tailwind_config: object // tailwind.config.js 文件内容
```

**状态变量**
```
nextjs_initialized: boolean = False // Next.js 初始化状态
typescript_configured: boolean = False // TypeScript 配置状态
tailwind_configured: boolean = False // Tailwind CSS 配置状态
shadcn_installed: boolean = False // ShadcnUI 安装状态
```
| **FE-202** | P1 | `[FE]` | 🔥 **P0** | **实现全局状态管理 (Zustand)** | [FE-201] | ✅ AC1: 创建 AuthStore (user, token, login, logout)<br>✅ AC2: 创建 ProjectStore (current_project, members)<br>✅ AC3: 创建 WebSocketStore (connection_status) |

#### 变量声明

**配置变量**
```
zustand_version: string = "latest" // Zustand 版本
persist_storage_key: string = "aicsl-storage" // 持久化存储键名
```

**输入变量**
```
user: object // 用户对象（id, username, email, role, avatar_url）
token: string // 访问令牌
project: object // 项目对象（id, name, description, members）
connection_status: string // 连接状态（connected/disconnected/connecting）
```

**输出变量**
```
auth_store: object // AuthStore 实例
project_store: object // ProjectStore 实例
websocket_store: object // WebSocketStore 实例
```

**状态变量**
```
is_authenticated: boolean = False // 认证状态
current_user: object = null // 当前用户
access_token: string = "" // 访问令牌
current_project: object = null // 当前项目
socket_connected: boolean = False // Socket 连接状态
```
| **FE-203** | P1 | `[FE]` | 🔥 **P0** | **实现 App Shell 布局** | [FE-201] | ✅ AC1: 使用 Grid 布局实现三栏结构（左侧边栏、主内容区、右侧边栏）<br>✅ AC2: 实现左侧边栏展开/隐藏功能<br>✅ AC3: 实现右侧边栏展开/隐藏功能 |

#### 变量声明

**配置变量**
```
layout_grid_template: string = "250px 1fr 300px" // 布局网格模板
sidebar_width: string = "250px" // 边栏宽度
main_content_width: string = "1fr" // 主内容区宽度
transition_duration: string = "0.3s" // 过渡动画持续时间
```

**输入变量**
```
left_sidebar_visible: boolean // 左侧边栏可见性
right_sidebar_visible: boolean // 右侧边栏可见性
```

**输出变量**
```
app_shell_component: ReactComponent // App Shell 组件
left_sidebar_component: ReactComponent // 左侧边栏组件
main_content_component: ReactComponent // 主内容区组件
right_sidebar_component: ReactComponent // 右侧边栏组件
```

**状态变量**
```
left_sidebar_open: boolean = True // 左侧边栏展开状态
right_sidebar_open: boolean = True // 右侧边栏展开状态
is_mobile: boolean = False // 移动端状态
```
| **FE-204** | P1 | `[FE]` | 🔥 **P0** | **实现登录页面 UI** | [FE-201] | **依赖接口:** [BE-102] `POST /api/v1/auth/login`<br>✅ AC1: 使用 ShadcnUI 表单组件实现登录界面<br>✅ AC2: 登录成功后存储 Token 到 Local Storage<br>✅ AC3: 登录失败显示 Toast 错误提示 |

#### 变量声明

**配置变量**
```
login_api_endpoint: string = "/api/v1/auth/login" // 登录 API 端点
token_storage_key: string = "aicsl_token" // Token 存储键名
toast_duration: integer = 3000 // Toast 显示持续时间（毫秒）
```

**输入变量**
```
email: string // 用户邮箱
password: string // 用户密码
```

**输出变量**
```
login_page_component: ReactComponent // 登录页面组件
login_form_component: ReactComponent // 登录表单组件
toast_component: ReactComponent // Toast 组件
```

**状态变量**
```
email_value: string = "" // 邮箱输入值
password_value: string = "" // 密码输入值
is_loading: boolean = False // 加载状态
login_error: string = "" // 登录错误信息
```
| **FE-205** | P1 | `[FE]` | 🔥 **P0** | **实现主页面路由与导航** | [FE-203], [FE-204] | **依赖接口:** [BE-104] `GET /api/v1/projects`<br>✅ AC1: 实现路由守卫（未登录跳转到登录页）<br>✅ AC2: 根据用户角色跳转到不同页面（Student→主页，Teacher→教师页，Admin→后台）<br>✅ AC3: 实现项目列表展示 |

#### 变量声明

**配置变量**
```
projects_api_endpoint: string = "/api/v1/projects" // 项目列表 API 端点
student_home_path: string = "/home" // 学生主页路径
teacher_dashboard_path: string = "/teacher" // 教师仪表盘路径
admin_panel_path: string = "/admin" // 管理后台路径
login_path: string = "/login" // 登录页路径
```

**输入变量**
```
user_role: string // 用户角色（student/teacher/admin）
project_id: string // 项目 ID
```

**输出变量**
```
route_guard_component: ReactComponent // 路由守卫组件
project_list_component: ReactComponent // 项目列表组件
```

**状态变量**
```
is_authenticated: boolean = False // 认证状态
current_user_role: string = "" // 当前用户角色
projects_list: array = [] // 项目列表
is_loading: boolean = False // 加载状态
```
| **FE-206** | P1 | `[FE]` | 🔴 **P1** | **实现左侧边栏 - 项目信息卡片** | [FE-205] | **依赖接口:** [BE-104] `GET /api/v1/projects/{project_id}`<br>✅ AC1: 显示项目名称、描述、进度条<br>✅ AC2: 显示项目成员头像列表<br>✅ AC3: Owner 可点击进入项目设置 |

#### 变量声明

**配置变量**
```
project_api_endpoint: string = "/api/v1/projects/{project_id}" // 项目详情 API 端点
project_settings_path: string = "/projects/{project_id}/settings" // 项目设置路径
avatar_size: string = "32px" // 头像大小
progress_bar_height: string = "8px" // 进度条高度
```

**输入变量**
```
project_id: string // 项目 ID
```

**输出变量**
```
project_info_card_component: ReactComponent // 项目信息卡片组件
member_avatar_list_component: ReactComponent // 成员头像列表组件
progress_bar_component: ReactComponent // 进度条组件
```

**状态变量**
```
project_name: string = "" // 项目名称
project_description: string = "" // 项目描述
project_progress: float = 0.0 // 项目进度（0.0 - 1.0）
project_members: array = [] // 项目成员列表
is_owner: boolean = False // 是否为 Owner
```
| **FE-207** | P1 | `[FE]` | 🔴 **P1** | **实现左侧边栏 - 日历视图** | [FE-205] | **依赖接口:** [BE-104] `GET /api/v1/projects/{project_id}/calendar`<br>✅ AC1: 使用 ShadcnUI Calendar 组件显示当前月份<br>✅ AC2: 高亮有事件的日期<br>✅ AC3: 点击日期显示当日日程列表 |

#### 变量声明

**配置变量**
```
calendar_api_endpoint: string = "/api/v1/projects/{project_id}/calendar" // 日历 API 端点
event_highlight_color: string = "blue" // 事件高亮颜色
```

**输入变量**
```
project_id: string // 项目 ID
selected_date: Date // 选中的日期
```

**输出变量**
```
calendar_view_component: ReactComponent // 日历视图组件
event_list_component: ReactComponent // 事件列表组件
```

**状态变量**
```
current_month: Date = new Date() // 当前月份
selected_date: Date = new Date() // 选中的日期
calendar_events: array = [] // 日历事件列表
event_dates: array = [] // 有事件的日期列表
```
| **FE-208** | P1 | `[FE]` | 🔴 **P1** | **实现左侧边栏 - 任务看板 (Mini Kanban)** | [FE-205] | **依赖接口:** [BE-104] `GET /api/v1/projects/{project_id}/tasks`<br>✅ AC1: 三列布局（待办、进行中、已完成）<br>✅ AC2: 支持任务拖拽排序<br>✅ AC3: 显示任务优先级和截止日期 |

#### 变量声明

**配置变量**
```
tasks_api_endpoint: string = "/api/v1/projects/{project_id}/tasks" // 任务 API 端点
kanban_columns: array = ["todo", "doing", "done"] // 看板列
priority_colors: object = { "low": "green", "medium": "yellow", "high": "red" } // 优先级颜色
```

**输入变量**
```
project_id: string // 项目 ID
task_id: string // 任务 ID
column: string // 任务列（todo/doing/done）
```

**输出变量**
```
kanban_board_component: ReactComponent // 看板组件
task_card_component: ReactComponent // 任务卡片组件
```

**状态变量**
```
tasks_by_column: object = { "todo": [], "doing": [], "done": [] } // 按列分组的任务
dragged_task: object = null // 拖拽中的任务
is_dragging: boolean = False // 拖拽状态
```
| **FE-209** | P1 | `[FE]` | 🔴 **P1** | **实现右侧边栏 - 成员列表** | [FE-205] | **依赖接口:** [BE-106] Socket.IO 事件<br>✅ AC1: 显示项目成员头像和用户名<br>✅ AC2: 显示在线状态（绿点/灰点）<br>✅ AC3: 监听 user_joined、user_left 事件 |

#### 变量声明

**配置变量**
```
socket_namespace: string = "/chat" // Socket.IO 命名空间
online_status_color: object = { "online": "green", "offline": "gray" } // 在线状态颜色
avatar_size: string = "40px" // 头像大小
```

**输入变量**
```
project_id: string // 项目 ID
member_id: string // 成员 ID
```

**输出变量**
```
member_list_component: ReactComponent // 成员列表组件
member_item_component: ReactComponent // 成员项组件
```

**状态变量**
```
project_members: array = [] // 项目成员列表
online_members: set = new Set() // 在线成员 ID 集合
socket_connected: boolean = False // Socket 连接状态
```
| **FE-210** | P1 | `[FE]` | 🔴 **P1** | **实现右侧边栏 - 群组聊天** | [FE-205] | **依赖接口:** [BE-106] Socket.IO 事件<br>✅ AC1: 显示聊天消息列表（气泡样式）<br>✅ AC2: 支持 @提及功能（输入框上方显示谁 @某人）<br>✅ AC3: 消息永久保存到 MongoDB |

#### 变量声明

**配置变量**
```
socket_namespace: string = "/chat" // Socket.IO 命名空间
message_limit: integer = 50 // 消息加载限制
message_page_size: integer = 20 // 消息分页大小
```

**输入变量**
```
project_id: string // 项目 ID
message_content: string // 消息内容
mentioned_user_id: string // 提及的用户 ID
```

**输出变量**
```
chat_component: ReactComponent // 聊天组件
message_list_component: ReactComponent // 消息列表组件
message_input_component: ReactComponent // 消息输入组件
```

**状态变量**
```
chat_messages: array = [] // 聊天消息列表
current_user_id: string = "" // 当前用户 ID
is_loading: boolean = False // 加载状态
has_more_messages: boolean = True // 是否有更多消息
```
| **FE-211** | P1 | `[FE]` | 🔴 **P1** | **实现主内容区 - Tab 导航** | [FE-205] | ✅ AC1: 6 个 Tab（白板、文档、资源库、浏览器、AI 导师、仪表盘）<br>✅ AC2: Tab 切换时保持组件状态（不重新加载）<br>✅ AC3: 使用 CSS display: none 或 Offscreen API 控制显隐 |

#### 变量声明

**配置变量**
```
tabs: array = ["whiteboard", "document", "resources", "browser", "ai", "dashboard"] // Tab 列表
default_tab: string = "whiteboard" // 默认 Tab
tab_transition_duration: string = "0.2s" // Tab 切换过渡时间
```

**输入变量**
```
tab_id: string // Tab ID
```

**输出变量**
```
tab_navigation_component: ReactComponent // Tab 导航组件
tab_content_component: ReactComponent // Tab 内容组件
```

**状态变量**
```
active_tab: string = "whiteboard" // 当前激活的 Tab
tab_states: object = {} // Tab 状态缓存
```
| **FE-211-1** | P1 | `[FE]` | 🔴 **P1** | **实现 useCollaboration Hook（双通道连接管理）** | [FE-211], [BE-106], [BE-107] | **Props**<br>• `project_id: string` - 项目 ID<br>• `user_id: string` - 用户 ID<br>• `token: string` - JWT Token<br>**Returns**<br>• `yjs_state: object` - Y.js 连接状态 {connected, status, error}<br>• `socketio_state: object` - Socket.IO 连接状态 {connected, status, error}<br>• `aggregated_state: string` - 聚合状态 {full, degraded, offline}<br>• `connect()` - 连接两个通道<br>• `disconnect()` - 断开两个通道<br>• `reconnect()` - 重连两个通道<br>✅ AC1: 管理双通道并行连接（Y-Websocket + Socket.IO）<br>✅ AC2: 实现连接状态机（full/degraded/offline）<br>✅ AC3: 实现 Token 过期自动刷新机制<br>✅ AC4: 实现 Y.js 断开时进入只读模式<br>✅ AC5: 实现 Socket.IO 断开时显示降级提示<br>✅ AC6: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
yjs_websocket_url: string = "ws://localhost:8000/ysocket" // Y.js WebSocket 地址
socketio_url: string = "http://localhost:8000" // Socket.IO 地址
socketio_namespace: string = "/chat" // Socket.IO 命名空间
reconnect_delay: integer = 3000 // 重连延迟（毫秒）
max_reconnect_attempts: integer = 5 // 最大重连次数
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
token: string // JWT Token
resource_id: string // 资源 ID（用于 Y.js 房间）
```

**输出变量**
```
yjs_provider: WebsocketProvider // Y.js WebSocket Provider
socket: Socket // Socket.IO 实例
connection_state: object // 聚合连接状态 {yjs, socketio, aggregated}
```

**状态变量**
```
yjs_connected: boolean = False // Y.js 连接状态
socketio_connected: boolean = False // Socket.IO 连接状态
reconnecting: boolean = False // 重连状态
reconnect_attempts: integer = 0 // 重连尝试次数
last_error: string = "" // 最后错误信息
```
| **FE-211-2** | P1 | `[FE]` | 🟡 **P2** | **实现连接异常处理和降级策略** | [FE-211-1] | **异常场景处理**<br>• 场景一：Socket.IO 断开，Y.js 正常 → 聊天框变灰，显示"聊天服务重连中..."，用户可继续编辑<br>• 场景二：Y.js 断开，Socket.IO 正常 → 编辑器/白板顶部弹出黄色警告条："同步服务断开，进入只读模式"<br>• 场景三：Token 过期（同时断开）→ 触发 refreshToken 流程，刷新成功自动重连，失败跳转登录页<br>**组件**<br>• `ConnectionStatusBanner` - 连接状态横幅<br>• `ReadOnlyModeOverlay` - 只读模式遮罩<br>• `ReconnectingIndicator` - 重连指示器<br>✅ AC1: 实现连接状态横幅组件<br>✅ AC2: 实现 Y.js 断开时的只读模式<br>✅ AC3: 实现 Token 过期自动刷新<br>✅ AC4: 实现重连失败后的降级提示<br>✅ AC5: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
banner_auto_hide_delay: integer = 5000 // 横幅自动隐藏延迟（毫秒）
readonly_warning_message: string = "同步服务断开，进入只读模式" // 只读模式警告消息
chat_reconnect_message: string = "聊天服务重连中..." // 聊天重连消息
token_refresh_endpoint: string = "/api/v1/auth/refresh" // Token 刷新端点
```

**输入变量**
```
connection_state: object // 连接状态 {yjs, socketio, aggregated}
error_message: string // 错误消息
```

**输出变量**
```
banner_visible: boolean // 横幅可见状态
banner_message: string // 横幅消息
banner_type: string // 横幅类型（warning/error/info）
readonly_mode: boolean // 只读模式状态
reconnecting: boolean // 重连状态
```

**状态变量**
```
current_banner: object = null // 当前横幅 {message, type, visible}
readonly_active: boolean = False // 只读模式激活状态
auto_refresh_triggered: boolean = False // 自动刷新触发状态
```
| **INFRA-005** | P1 | `[INFRA]` | 🔴 **P1** | **配置 GitHub Actions CI/CD** | [INFRA-003] | ✅ AC1: Push to main 自动运行 Pytest 和 Vitest<br>✅ AC2: 自动构建 Docker 镜像<br>✅ AC3: 推送镜像到 Registry |

#### 变量声明

**配置变量**
```
docker_registry_url: string = "ghcr.io" // Docker Registry URL
docker_image_name: string = "aicsl-app" // Docker 镜像名称
python_test_command: string = "pytest backend/tests" // Python 测试命令
node_test_command: string = "vitest" // Node 测试命令
docker_build_context: string = "." // Docker 构建上下文
```

**输入变量**
```
branch_name: string // 分支名称
commit_sha: string // 提交 SHA
```

**输出变量**
```
workflow_file: string // GitHub Actions 工作流文件
docker_image_tag: string // Docker 镜像标签
```

**状态变量**
```
test_passed: boolean = False // 测试通过状态
build_success: boolean = False // 构建成功状态
push_success: boolean = False // 推送成功状态
```
| **INFRA-006** | P1 | `[INFRA]` | 🔴 **P1** | **配置 Nginx 反向代理** | [INFRA-002] | ✅ AC1: 配置 SSL 终结（HTTPS）<br>✅ AC2: 路由分发：/api → FastAPI, /ysocket → Y-Websocket, / → React<br>✅ AC3: 配置静态资源缓存策略 |

#### 变量声明

**配置变量**
```
nginx_config_file: string = "/etc/nginx/nginx.conf" // Nginx 配置文件
ssl_cert_path: string = "/etc/nginx/ssl/cert.pem" // SSL 证书路径
ssl_key_path: string = "/etc/nginx/ssl/key.pem" // SSL 密钥路径
fastapi_upstream: string = "http://backend:8000" // FastAPI 上游地址
react_upstream: string = "http://frontend:3000" // React 上游地址
ywebsocket_upstream: string = "http://backend:8000/ysocket" // Y-Websocket 上游地址
static_cache_max_age: string = "1y" // 静态资源缓存时间
```

**输入变量**
```
domain_name: string // 域名名称
ssl_enabled: boolean // 是否启用 SSL
```

**输出变量**
```
nginx_config: string // Nginx 配置内容
```

**状态变量**
```
nginx_running: boolean = False // Nginx 运行状态
ssl_configured: boolean = False // SSL 配置状态
```
| **QA-001** | P1 | `[QA]` | 🔴 **P1** | **执行 P1 阶段 E2E 测试** | [INFRA-006] | ✅ AC1: 使用 Playwright 执行登录流程测试<br>✅ AC2: 测试项目创建和成员邀请流程<br>✅ AC3: 生成测试报告 |

#### 变量声明

**配置变量**
```
playwright_config_file: string = "playwright.config.ts" // Playwright 配置文件
test_report_dir: string = "playwright-report" // 测试报告目录
base_url: string = "http://localhost:3000" // 测试基础 URL
test_timeout: integer = 30000 // 测试超时时间（毫秒）
```

**输入变量**
```
test_user_email: string // 测试用户邮箱
test_user_password: string // 测试用户密码
```

**输出变量**
```
test_report: object // 测试报告对象
test_screenshots: array // 测试截图列表
```

**状态变量**
```
tests_passed: integer = 0 // 通过的测试数量
tests_failed: integer = 0 // 失败的测试数量
tests_skipped: integer = 0 // 跳过的测试数量
```

---

## Phase 2: 核心协作 MVP (Core Collaboration MVP)

### 目标
白板、文档、聊天的基础即时同步。

### 任务列表

| **ID** | **阶段** | **角色** | **P级** | **任务名称** | **依赖** | **产出接口 / 验收标准** |
|--------|----------|----------|----------|--------------|----------|------------------------|
| **BE-109** | P2 | `[BE]` | 🔴 **P1** | **实现文档管理 API** | [BE-104] | **`GET /api/v1/projects/{project_id}/documents`**<br>· Out: DocumentListResponse (documents[])<br>**`POST /api/v1/projects/{project_id}/documents`**<br>· In: DocumentCreateRequest (title)<br>· Out: DocumentResponse<br>**`GET /api/v1/documents/{doc_id}`**<br>· Out: DocumentDetailResponse (content_state)<br>**`PUT /api/v1/documents/{doc_id}`**<br>· In: DocumentUpdateRequest (title)<br>· Out: DocumentResponse<br>✅ AC1: 文档内容使用 Y.js ProseMirror 状态存储<br>✅ AC2: 支持文档历史版本<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
documents_collection: string = "documents" // 文档集合名称
document_versions_collection: string = "document_versions" // 文档版本集合名称
yjs_state_format: string = "prosemirror" // Y.js 状态格式
version_retention_days: integer = 30 // 版本保留天数
```

**输入变量**
```
project_id: string // 项目 ID
document_id: string // 文档 ID
title: string // 文档标题
content_state: object // 文档内容状态（Y.js ProseMirror 格式）
```

**输出变量**
```
document_list_response: object // 文档列表响应
document_response: object // 文档响应
document_detail_response: object // 文档详情响应
```

**状态变量**
```
document_count: integer = 0 // 文档数量
version_count: integer = 0 // 版本数量
is_archived: boolean = False // 是否归档
```
| **BE-110** | P2 | `[BE]` | 🔴 **P1** | **实现文档评论 API** | [BE-109] | **`GET /api/v1/documents/{doc_id}/comments`**<br>· Out: CommentListResponse (comments[])<br>**`POST /api/v1/documents/{doc_id}/comments`**<br>· In: CommentCreateRequest (anchor_context, content)<br>· Out: CommentResponse<br>**`PUT /api/v1/comments/{comment_id}/status`**<br>· In: CommentStatusUpdateRequest (status)<br>· Out: CommentResponse<br>✅ AC1: 支持批注功能（@某人采用批注形式）<br>✅ AC2: 评论状态管理（open/resolved）<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
comments_collection: string = "comments" // 评论集合名称
comment_status_enum: array = ["open", "resolved"] // 评论状态枚举
anchor_context_format: string = "prosemirror_selection" // 批注上下文格式
```

**输入变量**
```
document_id: string // 文档 ID
comment_id: string // 评论 ID
anchor_context: object // 批注上下文（选中文本位置）
content: string // 评论内容
status: string // 评论状态
mentioned_user_id: string // 提及的用户 ID
```

**输出变量**
```
comment_list_response: object // 评论列表响应
comment_response: object // 评论响应
```

**状态变量**
```
comment_count: integer = 0 // 评论数量
open_comment_count: integer = 0 // 未解决评论数量
resolved_comment_count: integer = 0 // 已解决评论数量
```
| **BE-111** | P2 | `[BE]` | 🔴 **P1** | **实现白板快照存储** | [BE-107] | ✅ AC1: 实现白板快照定期保存（每 10 秒）<br>✅ AC2: 使用动态防抖策略（5 秒无操作或 60 秒强制保存）<br>✅ AC3: 快照数据使用 Y.js update vector 格式存储 |

#### 变量声明

**配置变量**
```
whiteboard_snapshots_collection: string = "whiteboard_snapshots" // 白板快照集合名称
snapshot_interval_seconds: integer = 10 // 快照保存间隔（秒）
debounce_interval_seconds: integer = 5 // 防抖间隔（秒）
force_save_interval_seconds: integer = 60 // 强制保存间隔（秒）
yjs_update_vector_format: string = "binary" // Y.js update vector 格式
```

**输入变量**
```
whiteboard_id: string // 白板 ID
project_id: string // 项目 ID
snapshot_data: object // 快照数据（Y.js update vector 格式）
last_activity_time: timestamp // 最后活动时间
```

**输出变量**
```
snapshot_id: string // 快照 ID
snapshot_response: object // 快照响应
```

**状态变量**
```
last_snapshot_time: timestamp = null // 最后快照时间
snapshot_count: integer = 0 // 快照数量
is_debouncing: boolean = False // 是否正在防抖
```
| **BE-112** | P2 | `[BE]` | 🔴 **P1** | **实现任务管理 API** | [BE-104] | **`GET /api/v1/projects/{project_id}/tasks`**<br>· Out: TaskListResponse (tasks[])<br>**`POST /api/v1/projects/{project_id}/tasks`**<br>· In: TaskCreateRequest (title, column, priority, assignees, due_date)<br>· Out: TaskResponse<br>**`PUT /api/v1/tasks/{task_id}`**<br>· In: TaskUpdateRequest (title, priority, assignees, due_date)<br>· Out: TaskResponse<br>**`PUT /api/v1/tasks/{task_id}/column`**<br>· In: TaskColumnUpdateRequest (column)<br>· Out: TaskResponse<br>**`PUT /api/v1/tasks/{task_id}/order`**<br>· In: TaskOrderUpdateRequest (order)<br>· Out: TaskResponse<br>**`DELETE /api/v1/tasks/{task_id}`**<br>· Out: SuccessResponse<br>✅ AC1: 使用 Lexorank 算法实现拖拽排序<br>✅ AC2: 支持任务优先级（low/medium/high）<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
tasks_collection: string = "tasks" // 任务集合名称
lexorank_base: integer = 65536 // Lexorank 基数
lexorank_precision: integer = 8 // Lexorank 精度
priority_enum: array = ["low", "medium", "high"] // 优先级枚举
column_enum: array = ["todo", "doing", "done"] // 列枚举
```

**输入变量**
```
project_id: string // 项目 ID
task_id: string // 任务 ID
title: string // 任务标题
column: string // 任务列
priority: string // 任务优先级
assignees: array // 指派用户列表
due_date: timestamp // 截止日期
order: string // 排序值（Lexorank）
```

**输出变量**
```
task_list_response: object // 任务列表响应
task_response: object // 任务响应
success_response: object // 成功响应
```

**状态变量**
```
task_count: integer = 0 // 任务数量
todo_count: integer = 0 // 待办任务数量
doing_count: integer = 0 // 进行中任务数量
done_count: integer = 0 // 已完成任务数量
```
| **BE-113** | P2 | `[BE]` | 🔴 **P1** | **实现日程管理 API** | [BE-104] | **`GET /api/v1/projects/{project_id}/calendar`**<br>· Out: CalendarEventListResponse (events[])<br>**`POST /api/v1/projects/{project_id}/calendar`**<br>· In: CalendarEventCreateRequest (title, start_time, end_time, type)<br>· Out: CalendarEventResponse<br>**`PUT /api/v1/calendar/{event_id}`**<br>· In: CalendarEventUpdateRequest (title, start_time, end_time)<br>· Out: CalendarEventResponse<br>**`DELETE /api/v1/calendar/{event_id}`**<br>· Out: SuccessResponse<br>✅ AC1: 支持事件类型（meeting/deadline/personal）<br>✅ AC2: 支持私密标记（Teacher 可查看学生私密日程）<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
calendar_events_collection: string = "calendar_events" // 日程事件集合名称
event_type_enum: array = ["meeting", "deadline", "personal"] // 事件类型枚举
event_visibility_enum: array = ["public", "private"] // 事件可见性枚举
```

**输入变量**
```
project_id: string // 项目 ID
event_id: string // 事件 ID
title: string // 事件标题
start_time: timestamp // 开始时间
end_time: timestamp // 结束时间
type: string // 事件类型
is_private: boolean // 是否私密
```

**输出变量**
```
calendar_event_list_response: object // 日程事件列表响应
calendar_event_response: object // 日程事件响应
success_response: object // 成功响应
```

**状态变量**
```
event_count: integer = 0 // 事件数量
meeting_count: integer = 0 // 会议数量
deadline_count: integer = 0 // 截止日期数量
personal_count: integer = 0 // 个人事件数量
```
| **BE-114** | P2 | `[BE]` | 🔴 **P1** | **实现聊天记录存储** | [BE-106] | ✅ AC1: 聊天消息永久保存到 MongoDB<br>✅ AC2: 支持消息类型（text/system/ai）<br>✅ AC3: 实现消息分页查询 |

#### 变量声明

**配置变量**
```
chat_messages_collection: string = "chat_messages" // 聊天消息集合名称
message_type_enum: array = ["text", "system", "ai"] // 消息类型枚举
message_page_size: integer = 50 // 消息分页大小
message_retention_days: integer = 365 // 消息保留天数
```

**输入变量**
```
project_id: string // 项目 ID
message_id: string // 消息 ID
sender_id: string // 发送者 ID
content: string // 消息内容
message_type: string // 消息类型
mentioned_user_ids: array // 提及的用户 ID 列表
page: integer // 页码
page_size: integer // 每页大小
```

**输出变量**
```
message_list_response: object // 消息列表响应
message_response: object // 消息响应
```

**状态变量**
```
message_count: integer = 0 // 消息数量
text_message_count: integer = 0 // 文本消息数量
system_message_count: integer = 0 // 系统消息数量
ai_message_count: integer = 0 // AI 消息数量
```
| **BE-115** | P2 | `[BE]` | 🔴 **P1** | **实现活动日志记录** | [BE-101] | ✅ AC1: 记录用户行为（module: whiteboard/document/chat, action: edit/view/upload/comment）<br>✅ AC2: 记录操作时长（duration）<br>✅ AC3: 使用 TTL 索引，365 天后自动删除 |

#### 变量声明

**配置变量**
```
activity_logs_collection: string = "activity_logs" // 活动日志集合名称
module_enum: array = ["whiteboard", "document", "chat", "resource", "task", "calendar"] // 模块枚举
action_enum: array = ["edit", "view", "upload", "comment", "create", "delete", "update"] // 操作枚举
log_retention_days: integer = 365 // 日志保留天数
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
module: string // 模块名称
action: string // 操作类型
duration: integer // 操作时长（秒）
metadata: object // 元数据（可选）
```

**输出变量**
```
activity_log_response: object // 活动日志响应
```

**状态变量**
```
log_count: integer = 0 // 日志数量
total_duration: integer = 0 // 总操作时长
```
| **BE-139** | P2 | `[BE]` | 🔴 **P1** | **实现行为数据接收 API** | [BE-115] | **`POST /api/v1/analytics/behavior`**<br>· In: BehaviorDataRequest (project_id, user_id, module, action, resource_id, metadata, timestamp)<br>· Out: SuccessResponse<br>**功能**<br>• 接收前端通过 sendBeacon 或批量发送的行为数据<br>• 使用消息队列（Redis/Celery）异步处理高并发写入<br>• 支持批量接收（batch_size ≤ 100）<br>• 数据验证：project_id 和 user_id 必须有效<br>✅ AC1: 实现批量接收接口（POST /api/v1/analytics/behavior/batch）<br>✅ AC2: 使用消息队列异步写入 MongoDB<br>✅ AC3: 实现数据验证和错误处理<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
behavior_api_endpoint: string = "/api/v1/analytics/behavior" // 行为数据 API 端点
batch_api_endpoint: string = "/api/v1/analytics/behavior/batch" // 批量 API 端点
max_batch_size: integer = 100 // 最大批量大小
queue_name: string = "behavior_processing_queue" // 消息队列名称
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
module: string // 模块名称
action: string // 操作类型
resource_id: string // 资源 ID（可选）
metadata: object // 元数据（可选）
timestamp: timestamp // 时间戳
batch_data: array = [] // 批量数据
```

**输出变量**
```
success_response: object // 成功响应
error_response: object // 错误响应
```

**状态变量**
```
received_count: integer = 0 // 已接收数量
batch_count: integer = 0 // 批量数量
queue_size: integer = 0 // 队列大小
```
| **BE-140** | P2 | `[BE]` | 🔴 **P1** | **实现心跳数据接收 API** | [BE-115] | **`POST /api/v1/analytics/heartbeat`**<br>· In: HeartbeatRequest (project_id, user_id, module, resource_id, timestamp)<br>· Out: SuccessResponse<br>**功能**<br>• 接收前端定期发送的心跳数据（每 30 秒一次）<br>• 使用消息队列（Redis/Celery）异步处理高并发写入<br>• 心跳数据用于计算"活跃时长"（排除挂机时间）<br>• 数据验证：project_id 和 user_id 必须有效<br>✅ AC1: 实现心跳接收接口<br>✅ AC2: 使用消息队列异步写入 MongoDB<br>✅ AC3: 实现数据验证和错误处理<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
heartbeat_api_endpoint: string = "/api/v1/analytics/heartbeat" // 心跳 API 端点
heartbeat_interval: integer = 30 // 心跳间隔（秒）
queue_name: string = "heartbeat_processing_queue" // 消息队列名称
heartbeat_timeout: integer = 60 // 心跳超时（秒）
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
module: string // 模块名称
resource_id: string // 资源 ID（可选）
timestamp: timestamp // 时间戳
```

**输出变量**
```
success_response: object // 成功响应
error_response: object // 错误响应
```

**状态变量**
```
heartbeat_count: integer = 0 // 心跳数量
active_users: integer = 0 // 活跃用户数
queue_size: integer = 0 // 队列大小
```
| **BE-141** | P2 | `[BE]` | 🔴 **P1** | **实现 MongoDB Time Series Collection** | [BE-115] | **功能**<br>• 创建 MongoDB Time Series Collection 用于存储行为流数据<br>• 时间字段：timestamp（主时间戳）<br>• 元数据字段：project_id, user_id, module, action<br>• 使用时间序列索引优化时间范围查询<br>• 设置 TTL 策略（365 天后自动删除）<br>✅ AC1: 创建 behavior_stream Time Series Collection<br>✅ AC2: 创建 heartbeat_stream Time Series Collection<br>✅ AC3: 配置时间序列索引和 TTL<br>✅ AC4: 编写迁移脚本（migration）<br>✅ AC5: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
behavior_stream_collection: string = "behavior_stream" // 行为流集合名称
heartbeat_stream_collection: string = "heartbeat_stream" // 心跳流集合名称
time_field: string = "timestamp" // 时间字段
meta_fields: array = ["project_id", "user_id", "module", "action"] // 元数据字段
granularity: string = "seconds" // 时间粒度
ttl_days: integer = 365 // TTL 天数
```

**输入变量**
```
collection_name: string // 集合名称
time_field: string // 时间字段
meta_fields: array // 元数据字段
granularity: string // 时间粒度
```

**输出变量**
```
collection_info: object // 集合信息
migration_result: object // 迁移结果
```

**状态变量**
```
collection_created: boolean = False // 集列是否已创建
index_count: integer = 0 // 索引数量
ttl_enabled: boolean = False // TTL 是否启用
```
| **BE-142** | P2 | `[BE]` | 🔴 **P1** | **实现定时聚合任务（Cron Job）** | [BE-141] | **功能**<br>• 使用 APScheduler/Celery Beat 实现定时任务<br>• 每日 00:00 聚合前一天的活跃时长和活跃度<br>• 聚合结果写入 analytics_daily_stats 集合<br>• 支持手动触发聚合（用于测试和补录）<br>• 记录聚合任务的执行日志<br>✅ AC1: 实现每日聚合任务（Cron: 0 0 * * *）<br>✅ AC2: 实现活跃时长计算（基于心跳数据）<br>✅ AC3: 实现活跃度聚合（基于行为数据）<br>✅ AC4: 支持手动触发聚合<br>✅ AC5: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
daily_stats_collection: string = "analytics_daily_stats" // 每日统计集合名称
cron_schedule: string = "0 0 * * *" // Cron 表达式
aggregation_window: string = "1 day" // 聚合时间窗口
manual_trigger_endpoint: string = "/api/v1/analytics/aggregate" // 手动触发端点
```

**输入变量**
```
project_id: string // 项目 ID
start_date: date // 开始日期
end_date: date // 结束日期
```

**输出变量**
```
aggregation_result: object // 聚合结果
daily_stats: object // 每日统计数据
```

**状态变量**
```
last_aggregation_time: timestamp = null // 最后聚合时间
aggregation_count: integer = 0 // 聚合次数
failed_count: integer = 0 // 失败次数
```
| **BE-143** | P2 | `[BE]` | 🔴 **P1** | **实现 4C 核心能力模型计算** | [BE-142] | **功能**<br>• 实现 4C 核心能力模型（Communication, Collaboration, Critical Thinking, Creativity）<br>• Communication: 基于聊天消息数量、评论数量、文档编辑次数<br>• Collaboration: 基于白板协作次数、资源共享次数、任务协作次数<br>• Critical Thinking: 基于评论质量（字数、深度）、文档修订次数<br>• Creativity: 基于白板创建的图形数量、文档创建数量<br>• 使用加权公式计算每个维度的得分（0-100 分）<br>✅ AC1: 实现 Communication 维度计算<br>✅ AC2: 实现 Collaboration 维度计算<br>✅ AC3: 实现 Critical Thinking 维度计算<br>✅ AC4: 实现 Creativity 维度计算<br>✅ AC5: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
ability_model_collection: string = "analytics_ability_model" // 能力模型集合名称
communication_weights: object = { "chat_messages": 0.3, "comments": 0.4, "document_edits": 0.3 } // Communication 权重
collaboration_weights: object = { "whiteboard_collaborations": 0.4, "resource_shares": 0.3, "task_collaborations": 0.3 } // Collaboration 权重
critical_thinking_weights: object = { "comment_quality": 0.5, "document_revisions": 0.5 } // Critical Thinking 权重
creativity_weights: object = { "whiteboard_shapes": 0.5, "document_creations": 0.5 } // Creativity 权重
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
start_date: date // 开始日期
end_date: date // 结束日期
```

**输出变量**
```
ability_model_result: object // 能力模型结果
communication_score: float = 0.0 // Communication 得分
collaboration_score: float = 0.0 // Collaboration 得分
critical_thinking_score: float = 0.0 // Critical Thinking 得分
creativity_score: float = 0.0 // Creativity 得分
```

**状态变量**
```
calculation_count: integer = 0 // 计算次数
last_calculation_time: timestamp = null // 最后计算时间
```
| **BE-144** | P2 | `[BE]` | 🔴 **P1** | **实现加权活跃度聚合管道** | [BE-142] | **功能**<br>• 实现加权活跃度计算模型（Weighted Activity Score）<br>• 权重配置：edit: 1.0, comment: 1.5, upload: 2.0, view: 0.5<br>• 使用 MongoDB Aggregation Pipeline 实现高效聚合<br>• 聚合结果按用户、项目、日期分组<br>• 支持动态权重配置（通过环境变量或数据库）<br>✅ AC1: 实现 MongoDB Aggregation Pipeline<br>✅ AC2: 实现加权活跃度计算逻辑<br>✅ AC3: 支持按用户、项目、日期分组<br>✅ AC4: 支持动态权重配置<br>✅ AC5: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
activity_weights: object = { "edit": 1.0, "comment": 1.5, "upload": 2.0, "view": 0.5 } // 活动权重
aggregation_pipeline: array = [] // 聚合管道
daily_stats_collection: string = "analytics_daily_stats" // 每日统计集合名称
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
start_date: date // 开始日期
end_date: date // 结束日期
weights: object // 自定义权重（可选）
```

**输出变量**
```
aggregation_result: object // 聚合结果
activity_score: float = 0.0 // 活跃度得分
activity_breakdown: object = {} // 活跃度明细
```

**状态变量**
```
pipeline_executed: boolean = False // 管道是否已执行
aggregation_count: integer = 0 // 聚合次数
last_aggregation_time: timestamp = null // 最后聚合时间
```
| **BE-116** | P2 | `[BE]` | 🟡 **P2** | **实现项目归档功能** | [BE-104] | **`POST /api/v1/projects/{project_id}/archive`**<br>· Out: SuccessResponse<br>**`POST /api/v1/projects/{project_id}/restore`**<br>· Out: SuccessResponse<br>✅ AC1: 归档后项目只读，不能编辑<br>✅ AC2: 归档项目不显示在活跃项目列表中<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
projects_collection: string = "projects" // 项目集合名称
archive_status_enum: array = ["active", "archived"] // 归档状态枚举
```

**输入变量**
```
project_id: string // 项目 ID
archived_by: string // 归档人 ID
archived_at: timestamp // 归档时间
restored_by: string // 恢复人 ID
restored_at: timestamp // 恢复时间
```

**输出变量**
```
success_response: object // 成功响应
```

**状态变量**
```
is_archived: boolean = False // 是否归档
archive_count: integer = 0 // 归档项目数量
```
| **BE-117** | P2 | `[BE]` | 🟡 **P2** | **实现成员角色管理** | [BE-104] | **`PUT /api/v1/projects/{project_id}/members/{member_id}/role`**<br>· In: MemberRoleUpdateRequest (role)<br>· Out: SuccessResponse<br>✅ AC1: 支持角色转换（viewer/editor/owner）<br>✅ AC2: Owner 转让需要特殊处理<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
project_members_collection: string = "project_members" // 项目成员集合名称
role_enum: array = ["viewer", "editor", "owner"] // 角色枚举
role_permissions: object = { "viewer": ["view"], "editor": ["view", "edit"], "owner": ["view", "edit", "manage"] } // 角色权限映射
```

**输入变量**
```
project_id: string // 项目 ID
member_id: string // 成员 ID
role: string // 角色
updated_by: string // 更新人 ID
```

**输出变量**
```
success_response: object // 成功响应
member_response: object // 成员响应
```

**状态变量**
```
owner_count: integer = 0 // Owner 数量
editor_count: integer = 0 // Editor 数量
viewer_count: integer = 0 // Viewer 数量
```
| **BE-118** | P2 | `[BE]` | 🟡 **P2** | **实现密码重置功能** | [BE-102] | **`POST /api/v1/auth/password/reset-request`**<br>· In: PasswordResetRequest (email)<br>· Out: SuccessResponse<br>**`POST /api/v1/auth/password/reset`**<br>· In: PasswordResetConfirm (token, new_password)<br>· Out: SuccessResponse<br>✅ AC1: 发送重置链接到邮箱（有效期 1 小时）<br>✅ AC2: 支持联系 Admin/Teacher 手动重置<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
password_reset_tokens_collection: string = "password_reset_tokens" // 密码重置令牌集合名称
token_expiry_hours: integer = 1 // 令牌有效期（小时）
email_template_path: string = "templates/password_reset_email.html" // 邮件模板路径
```

**输入变量**
```
email: string // 邮箱地址
token: string // 重置令牌
new_password: string // 新密码
confirm_password: string // 确认密码
```

**输出变量**
```
success_response: object // 成功响应
error_response: object // 错误响应
```

**状态变量**
```
token_created: boolean = False // 令牌是否已创建
token_expires_at: timestamp = null // 令牌过期时间
password_reset: boolean = False // 密码是否已重置
```
| **BE-119** | P2 | `[BE]` | 🟡 **P2** | **实现 Redis 缓存层** | [BE-101], [INFRA-002] | ✅ AC1: 实现缓存装饰器（@cache_result）<br>✅ AC2: 热点数据缓存（用户信息、项目列表）<br>✅ AC3: 实现布隆过滤器防护缓存穿透 |

#### 变量声明

**配置变量**
```
redis_host: string = "localhost" // Redis 主机
redis_port: integer = 6379 // Redis 端口
redis_db: integer = 0 // Redis 数据库
cache_ttl_seconds: integer = 3600 // 缓存过期时间（秒）
bloom_filter_size: integer = 1000000 // 布隆过滤器大小
bloom_filter_hash_count: integer = 3 // 布隆过滤器哈希次数
```

**输入变量**
```
cache_key: string // 缓存键
cache_value: object // 缓存值
ttl: integer // 过期时间（秒）
```

**输出变量**
```
cached_value: object // 缓存值
cache_hit: boolean // 是否命中缓存
```

**状态变量**
```
cache_hit_count: integer = 0 // 缓存命中次数
cache_miss_count: integer = 0 // 缓存未命中次数
bloom_filter_initialized: boolean = False // 布隆过滤器是否已初始化
```
| **BE-120** | P2 | `[BE]` | 🟡 **P2** | **优化数据库索引** | [BE-101] | ✅ AC1: 所有查询字段建立索引<br>✅ AC2: 使用 explain() 分析慢查询<br>✅ AC3: 定期优化索引策略 |

#### 变量声明

**配置变量**
```
slow_query_threshold_ms: integer = 100 // 慢查询阈值（毫秒）
index_optimization_interval_days: integer = 7 // 索引优化间隔（天）
```

**输入变量**
```
collection_name: string // 集合名称
index_fields: array // 索引字段列表
index_name: string // 索引名称
query: object // 查询对象
```

**输出变量**
```
index_info: object // 索引信息
explain_result: object // 查询分析结果
optimization_report: object // 优化报告
```

**状态变量**
```
index_count: integer = 0 // 索引数量
slow_query_count: integer = 0 // 慢查询数量
last_optimization_time: timestamp = null // 最后优化时间
```
| **FE-212** | P2 | `[FE]` | 🔴 **P1** | **实现 Tab 2 - 协作文档 (TipTap)** | [FE-211], [BE-107] | **依赖接口:** [BE-109] `GET /api/v1/projects/{project_id}/documents`<br>✅ AC1: 集成 TipTap 编辑器（基于 ProseMirror）<br>✅ AC2: 集成 Y-ProseMirror 实现实时同步<br>✅ AC3: 支持 Markdown 语法（```python）<br>✅ AC4: 多人实时编辑，显示其他用户的光标位置 |

#### 变量声明

**配置变量**
```
tiptap_extensions: array = ["StarterKit", "CodeBlock", "Highlight", "Yjs"] // TipTap 扩展列表
yjs_websocket_url: string = "ws://localhost:8000/ysocket" // Y.js WebSocket 地址
cursor_color_map: object = {} // 光标颜色映射
markdown_syntax_enabled: boolean = True // 是否启用 Markdown 语法
```

**输入变量**
```
project_id: string // 项目 ID
document_id: string // 文档 ID
user_id: string // 用户 ID
```

**输出变量**
```
document_editor_component: ReactComponent // 文档编辑器组件
yjs_provider_component: ReactComponent // Y.js 提供者组件
```

**状态变量**
```
editor_content: object = null // 编辑器内容
is_connected: boolean = False // Y.js 连接状态
remote_cursors: object = {} // 远程光标位置
is_saving: boolean = False // 保存状态
```
| **FE-213** | P2 | `[FE]` | 🔴 **P1** | **实现 Tab 2 - 文档评论功能** | [FE-212], [BE-110] | **依赖接口:** [BE-110] `GET /api/v1/documents/{doc_id}/comments`<br>✅ AC1: 支持选中文本添加批注<br>✅ AC2: 显示评论列表（open/resolved）<br>✅ AC3: 点击批注跳转到对应位置 |

#### 变量声明

**配置变量**
```
comments_api_endpoint: string = "/api/v1/documents/{doc_id}/comments" // 评论 API 端点
annotation_highlight_color: string = "yellow" // 批注高亮颜色
comment_status_colors: object = { "open": "red", "resolved": "green" } // 评论状态颜色
```

**输入变量**
```
document_id: string // 文档 ID
comment_id: string // 评论 ID
selected_text: string // 选中文本
comment_content: string // 评论内容
```

**输出变量**
```
comment_panel_component: ReactComponent // 评论面板组件
comment_item_component: ReactComponent // 评论项组件
annotation_component: ReactComponent // 批注组件
```

**状态变量**
```
comments: array = [] // 评论列表
selected_comment_id: string = "" // 选中的评论 ID
annotation_positions: array = [] // 批注位置列表
```
| **FE-212-1** | P2 | `[FE]` | 🟡 **P2** | **实现文档编辑器的撤销/重做功能** | [FE-212] | **核心机制**<br>• 使用 `y-prosemirror` 提供的 `UndoManager`<br>• 配置 `trackedOrigins: new Set([localClientID])` 仅跟踪本地操作<br>**功能**<br>• Ctrl/Cmd + Z 撤销<br>• Ctrl/Cmd + Shift + Z 重做<br>• 只撤销/重做自己的操作，不影响队友的操作<br>✅ AC1: 集成 Y.UndoManager 到 TipTap 编辑器<br>✅ AC2: 配置 trackedOrigins 仅跟踪本地 ClientID<br>✅ AC3: 实现键盘快捷键（Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z）<br>✅ AC4: 撤销/重做操作不影响其他用户的编辑<br>✅ AC5: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
undo_manager_scope: string = "local" // 撤销管理器作用域
max_undo_stack_size: integer = 100 // 最大撤销栈大小
```

**输入变量**
```
editor_instance: object // TipTap 编辑器实例
yjs_document: object // Y.js 文档实例
```

**输出变量**
```
undo_manager_instance: object // UndoManager 实例
```

**状态变量**
```
can_undo: boolean = False // 是否可以撤销
can_redo: boolean = False // 是否可以重做
```
| **FE-212-2** | P2 | `[FE]` | 🟡 **P2** | **实现文档编辑器的远程光标增强** | [FE-212] | **功能**<br>• 显示其他用户的光标位置<br>• 显示用户名和头像<br>• 为每个用户分配不同的光标颜色<br>• 光标跟随用户实时移动<br>✅ AC1: 使用 y-prosemirror 的 remote cursor 功能<br>✅ AC2: 为每个用户分配唯一的光标颜色<br>✅ AC3: 在光标旁边显示用户名和头像<br>✅ AC4: 光标实时同步（延迟 < 100ms）<br>✅ AC5: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
cursor_colors: array = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A8"] // 光标颜色列表
cursor_label_enabled: boolean = True // 是否显示光标标签
```

**输入变量**
```
remote_user_id: string // 远程用户 ID
remote_user_name: string // 远程用户名
remote_user_avatar: string // 远程用户头像
```

**输出变量**
```
remote_cursor_component: ReactComponent // 远程光标组件
```

**状态变量**
```
remote_cursors: object = {} // 远程光标位置映射 {user_id: {position, color, name, avatar}}
```
| **FE-214** | P2 | `[FE]` | 🔴 **P1** | **实现 Tab 1 - 协作白板 (Tldraw)** | [FE-211], [BE-107] | **依赖接口:** [BE-111] 白板快照存储<br>✅ AC1: 集成 Tldraw 白板组件<br>✅ AC2: 集成 Y.js 实现实时同步<br>✅ AC3: 无限画布，支持缩放和平移<br>✅ AC4: 支持绘制流程图、思维导图<br>✅ AC5: 多人实时协作，显示其他用户的光标位置 |

#### 变量声明

**配置变量**
```
tldraw_version: string = "2.0" // Tldraw 版本
yjs_websocket_url: string = "ws://localhost:8000/ysocket" // Y.js WebSocket 地址
canvas_tools: array = ["select", "draw", "shape", "text", "eraser"] // 画布工具列表
default_zoom: float = 1.0 // 默认缩放比例
```

**输入变量**
```
project_id: string // 项目 ID
whiteboard_id: string // 白板 ID
user_id: string // 用户 ID
```

**输出变量**
```
whiteboard_component: ReactComponent // 白板组件
toolbar_component: ReactComponent // 工具栏组件
```

**状态变量**
```
canvas_shapes: array = [] // 画布形状列表
current_tool: string = "select" // 当前工具
zoom_level: float = 1.0 // 缩放级别
remote_cursors: object = {} // 远程光标位置
```
| **FE-214-1** | P2 | `[FE]` | 🟡 **P2** | **实现白板的撤销/重做功能** | [FE-214] | **核心机制**<br>• 使用 Tldraw 内置的 `HistoryManager`（基于 Y.js）<br>• 配置 `trackedOrigins: new Set([localClientID])` 仅跟踪本地操作<br>**功能**<br>• Ctrl/Cmd + Z 撤销<br>• Ctrl/Cmd + Shift + Z 重做<br>• 只撤销/重做自己的操作，不影响队友的操作<br>✅ AC1: 集成 Tldraw 的 HistoryManager<br>✅ AC2: 配置 trackedOrigins 仅跟踪本地 ClientID<br>✅ AC3: 实现键盘快捷键（Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z）<br>✅ AC4: 撤销/重做操作不影响其他用户的编辑<br>✅ AC5: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
history_manager_scope: string = "local" // 历史管理器作用域
max_history_stack_size: integer = 100 // 最大历史栈大小
```

**输入变量**
```
whiteboard_instance: object // Tldraw 实例
yjs_document: object // Y.js 文档实例
```

**输出变量**
```
history_manager_instance: object // HistoryManager 实例
```

**状态变量**
```
can_undo: boolean = False // 是否可以撤销
can_redo: boolean = False // 是否可以重做
```
| **FE-214-2** | P2 | `[FE]` | 🟡 **P2** | **实现白板的远程光标和选中框功能** | [FE-214] | **功能**<br>• 显示其他用户的光标位置<br>• 显示用户名和头像<br>• 为每个用户分配不同的光标颜色<br>• 当 A 选中图形时，B 看到该图形被 A 的颜色框住（Selection Lock）<br>✅ AC1: 使用 Tldraw 的 remote cursor 功能<br>✅ AC2: 为每个用户分配唯一的光标颜色<br>✅ AC3: 在光标旁边显示用户名和头像<br>✅ AC4: 实现选中框（Selection Lock）功能，显示谁选中了哪个图形<br>✅ AC5: 光标和选中框实时同步（延迟 < 100ms）<br>✅ AC6: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
cursor_colors: array = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A8"] // 光标颜色列表
selection_border_width: integer = 2 // 选中框边框宽度
selection_border_style: string = "dashed" // 选中框边框样式
```

**输入变量**
```
remote_user_id: string // 远程用户 ID
remote_user_name: string // 远程用户名
remote_user_avatar: string // 远程用户头像
remote_selection: object // 远程选中状态 {shape_ids, user_id, color}
```

**输出变量**
```
remote_cursor_component: ReactComponent // 远程光标组件
remote_selection_component: ReactComponent // 远程选中框组件
```

**状态变量**
```
remote_cursors: object = {} // 远程光标位置映射 {user_id: {position, color, name, avatar}}
remote_selections: object = {} // 远程选中状态映射 {user_id: {shape_ids, color, name}}
```
| **FE-215** | P2 | `[FE]` | 🔴 **P1** | **实现 Tab 3 - 协作资源库** | [FE-211], [BE-108] | **依赖接口:** [BE-108] `GET /api/v1/resources/{project_id}`<br>✅ AC1: 使用 React-Dropzone 实现文件拖拽上传<br>✅ AC2: 显示文件列表（名称、大小、上传者、上传时间）<br>✅ AC3: 支持文件预览（PDF、图片、视频）<br>✅ AC4: 支持文件删除（Editor/Owner 权限） |

#### 变量声明

**配置变量**
```
resources_api_endpoint: string = "/api/v1/resources/{project_id}" // 资源 API 端点
upload_endpoint: string = "/api/v1/resources/upload" // 上传端点
max_file_size_mb: integer = 50 // 最大文件大小（MB）
allowed_file_types: array = ["pdf", "doc", "docx", "jpg", "png", "mp4"] // 允许的文件类型
```

**输入变量**
```
project_id: string // 项目 ID
file: File // 上传的文件
resource_id: string // 资源 ID
```

**输出变量**
```
resource_library_component: ReactComponent // 资源库组件
file_upload_component: ReactComponent // 文件上传组件
file_list_component: ReactComponent // 文件列表组件
file_preview_component: ReactComponent // 文件预览组件
```

**状态变量**
```
resources: array = [] // 资源列表
is_uploading: boolean = False // 上传状态
upload_progress: float = 0.0 // 上传进度
preview_resource_id: string = "" // 预览的资源 ID
```
| **FE-216** | P2 | `[FE]` | 🔴 **P1** | **实现 Tab 6 - 学习仪表盘** | [FE-211], [BE-143], [BE-144] | **依赖接口:** [BE-143] 4C 核心能力模型计算, [BE-144] 加权活跃度聚合管道<br>✅ AC1: 使用 Recharts 绘制雷达图（能力模型）<br>✅ AC2: 使用 Recharts 绘制折线图（活跃度）<br>✅ AC3: 显示团队贡献、学习时长、任务完成度<br>✅ AC4: 仅显示当前项目的数据 |

#### 变量声明

**配置变量**
```
analytics_api_endpoint: string = "/api/v1/analytics/{project_id}/dashboard" // 分析 API 端点
chart_colors: array = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"] // 图表颜色
radar_chart_axes: array = ["协作", "创新", "执行", "沟通", "学习"] // 雷达图坐标轴
```

**输入变量**
```
project_id: string // 项目 ID
date_range: object // 日期范围
```

**输出变量**
```
dashboard_component: ReactComponent // 仪表盘组件
radar_chart_component: ReactComponent // 雷达图组件
line_chart_component: ReactComponent // 折线图组件
```

**状态变量**
```
dashboard_data: object = null // 仪表盘数据
team_contribution: array = [] // 团队贡献数据
study_hours: array = [] // 学习时长数据
task_completion: float = 0.0 // 任务完成度
ability_model: array = [] // 能力模型数据
```
| **FE-216-1** | P2 | `[FE]` | 🟡 **P2** | **实现前端行为采集（行为流管道）** | [FE-211], [BE-139] | **核心机制**<br>• 使用 `navigator.sendBeacon` API 发送行为数据<br>• 批处理策略：积攒 10-20 条日志或每隔 30 秒发送<br>• Fire-and-Forget：不阻塞页面卸载<br>**采集内容**<br>• 页面停留时间<br>• Tab 切换记录<br>• 鼠标轨迹热力图<br>• 滚动深度<br>✅ AC1: 实现行为数据采集 Hook（useBehaviorTracking）<br>✅ AC2: 使用 sendBeacon API 发送数据<br>✅ AC3: 实现批处理逻辑（10-20 条或 30 秒）<br>✅ AC4: 采集页面停留、Tab 切换、鼠标轨迹、滚动深度<br>✅ AC5: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
behavior_api_endpoint: string = "/api/v1/analytics/behavior" // 行为数据 API 端点
batch_size: integer = 15 // 批处理大小
batch_interval_ms: integer = 30000 // 批处理间隔（毫秒）
send_beacon_enabled: boolean = True // 是否启用 sendBeacon
```

**输入变量**
```
event_type: string // 事件类型（page_view/tab_switch/mouse_move/scroll）
event_data: object // 事件数据
timestamp: timestamp // 时间戳
```

**输出变量**
```
behavior_tracking_hook: object // 行为采集 Hook
```

**状态变量**
```
event_buffer: array = [] // 事件缓冲区
last_batch_time: timestamp = null // 上次批处理时间
is_tracking: boolean = False // 是否正在采集
```
| **FE-216-2** | P2 | `[FE]` | 🟡 **P2** | **实现学习时长计算（有效活跃时间）** | [FE-211], [BE-140] | **核心机制**<br>• 基于心跳的"有效活跃时间"<br>• 前端监听 `mousemove`, `keydown`, `click`, `scroll` 事件<br>• 每 1 分钟检查一次并发送"有效心跳"<br>**算法逻辑**<br>1. 前端监听用户活动事件，更新 `lastActivityTime`<br>2. 每 1 分钟检查：如果 `Now - lastActivityTime < 1 min`，发送有效心跳<br>3. 后端计算：`Total Minutes = Count(Heartbeats)`<br>✅ AC1: 实现活动监听 Hook（useActivityTracking）<br>✅ AC2: 监听 mousemove, keydown, click, scroll 事件<br>✅ AC3: 每 1 分钟检查并发送有效心跳<br>✅ AC4: 自动排除挂机时间<br>✅ AC5: 精度为分钟级<br>✅ AC6: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
heartbeat_api_endpoint: string = "/api/v1/analytics/heartbeat" // 心跳 API 端点
heartbeat_interval_ms: integer = 60000 // 心跳间隔（毫秒）
activity_timeout_ms: integer = 60000 // 活动超时（毫秒）
```

**输入变量**
```
project_id: string // 项目 ID
user_id: string // 用户 ID
```

**输出变量**
```
activity_tracking_hook: object // 活动追踪 Hook
```

**状态变量**
```
last_activity_time: timestamp = null // 上次活动时间
heartbeat_count: integer = 0 // 心跳计数
is_active: boolean = False // 是否活跃
```
| **FE-217** | P2 | `[FE]` | 🟡 **P2** | **实现任务拖拽排序** | [FE-208], [BE-112] | **依赖接口:** [BE-112] `PUT /api/v1/tasks/{task_id}/order`<br>✅ AC1: 使用 dnd-kit 或 react-beautiful-dnd 实现拖拽<br>✅ AC2: 拖拽后调用 API 更新排序<br>✅ AC3: 支持跨列拖拽（todo → doing → done） |

#### 变量声明

**配置变量**
```
tasks_order_api_endpoint: string = "/api/v1/tasks/{task_id}/order" // 任务排序 API 端点
tasks_column_api_endpoint: string = "/api/v1/tasks/{task_id}/column" // 任务列 API 端点
drag_library: string = "dnd-kit" // 拖拽库
```

**输入变量**
```
task_id: string // 任务 ID
source_column: string // 源列
target_column: string // 目标列
new_order: string // 新排序值
```

**输出变量**
```
draggable_task_card_component: ReactComponent // 可拖拽任务卡片组件
```

**状态变量**
```
is_dragging: boolean = False // 拖拽状态
dragged_task_id: string = "" // 拖拽中的任务 ID
drop_target_column: string = "" // 放置目标列
```
| **FE-218** | P2 | `[FE]` | 🟡 **P2** | **实现日历事件创建** | [FE-207], [BE-113] | **依赖接口:** [BE-113] `POST /api/v1/projects/{project_id}/calendar`<br>✅ AC1: 点击日期弹出事件创建对话框<br>✅ AC2: 支持选择事件类型（meeting/deadline/personal）<br>✅ AC3: 支持私密标记 |

#### 变量声明

**配置变量**
```
calendar_events_api_endpoint: string = "/api/v1/projects/{project_id}/calendar" // 日程事件 API 端点
event_types: array = ["meeting", "deadline", "personal"] // 事件类型列表
event_type_colors: object = { "meeting": "blue", "deadline": "red", "personal": "green" } // 事件类型颜色
```

**输入变量**
```
project_id: string // 项目 ID
event_id: string // 事件 ID
title: string // 事件标题
start_time: Date // 开始时间
end_time: Date // 结束时间
event_type: string // 事件类型
is_private: boolean // 是否私密
```

**输出变量**
```
event_dialog_component: ReactComponent // 事件对话框组件
event_form_component: ReactComponent // 事件表单组件
```

**状态变量**
```
is_dialog_open: boolean = False // 对话框打开状态
selected_date: Date = new Date() // 选中的日期
event_data: object = null // 事件数据
```
| **FE-219** | P2 | `[FE]` | 🟡 **P2** | **实现聊天 @提及功能** | [FE-210], [BE-106] | **依赖接口:** [BE-106] Socket.IO 事件<br>✅ AC1: 输入 @ 时显示成员列表<br>✅ AC2: 选择成员后插入 @username<br>✅ AC3: 在聊天输入框上方显示谁 @某人，点击后跳转到具体位置 |

#### 变量声明

**配置变量**
```
socket_namespace: string = "/chat" // Socket.IO 命名空间
mention_trigger_char: string = "@" // 提及触发字符
mention_list_max_items: integer = 5 // 提及列表最大显示项数
```

**输入变量**
```
project_id: string // 项目 ID
mentioned_user_id: string // 提及的用户 ID
message_content: string // 消息内容
```

**输出变量**
```
mention_suggestion_component: ReactComponent // 提及建议组件
mention_highlight_component: ReactComponent // 提及高亮组件
```

**状态变量**
```
show_mention_list: boolean = False // 是否显示提及列表
mention_filter: string = "" // 提及过滤文本
filtered_members: array = [] // 过滤后的成员列表
mentioned_users: array = [] // 提及的用户列表
```
| **FE-220** | P2 | `[FE]` | 🟡 **P2** | **实现项目设置页面** | [FE-206], [BE-104] | **依赖接口:** [BE-104] `PUT /api/v1/projects/{project_id}`<br>✅ AC1: 支持修改项目名称、描述<br>✅ AC2: 支持归档/恢复项目<br>✅ AC3: 支持转让 Owner 权限 |

#### 变量声明

**配置变量**
```
project_api_endpoint: string = "/api/v1/projects/{project_id}" // 项目 API 端点
archive_api_endpoint: string = "/api/v1/projects/{project_id}/archive" // 归档 API 端点
restore_api_endpoint: string = "/api/v1/projects/{project_id}/restore" // 恢复 API 端点
transfer_ownership_api_endpoint: string = "/api/v1/projects/{project_id}/transfer" // 转让所有权 API 端点
```

**输入变量**
```
project_id: string // 项目 ID
project_name: string // 项目名称
project_description: string // 项目描述
new_owner_id: string // 新 Owner ID
```

**输出变量**
```
project_settings_page_component: ReactComponent // 项目设置页面组件
project_form_component: ReactComponent // 项目表单组件
ownership_transfer_dialog_component: ReactComponent // 所有权转让对话框组件
```

**状态变量**
```
project_settings: object = null // 项目设置
is_archived: boolean = False // 是否归档
is_transfer_dialog_open: boolean = False // 转让对话框是否打开
```
| **FE-221** | P2 | `[FE]` | 🟡 **P2** | **实现文件预览组件** | [FE-215] | ✅ AC1: PDF 预览使用 PDF.js<br>✅ AC2: 图片预览使用原生 img 标签<br>✅ AC3: 视频预览使用 HTML5 video 标签 |

#### 变量声明

**配置变量**
```
pdf_js_version: string = "3.0" // PDF.js 版本
supported_image_types: array = ["jpg", "jpeg", "png", "gif", "webp"] // 支持的图片类型
supported_video_types: array = ["mp4", "webm", "ogg"] // 支持的视频类型
```

**输入变量**
```
file_url: string // 文件 URL
file_type: string // 文件类型
file_name: string // 文件名称
```

**输出变量**
```
file_preview_component: ReactComponent // 文件预览组件
pdf_viewer_component: ReactComponent // PDF 查看器组件
image_viewer_component: ReactComponent // 图片查看器组件
video_player_component: ReactComponent // 视频播放器组件
```

**状态变量**
```
is_loading: boolean = False // 加载状态
preview_error: string = "" // 预览错误信息
```
| **FE-222** | P2 | `[FE]` | 🟡 **P2** | **实现用户个人中心** | [FE-205], [BE-103] | **依赖接口:** [BE-103] `GET /api/v1/users/me`<br>✅ AC1: 显示用户基本信息（姓名、账号、角色）<br>✅ AC2: 支持修改头像、用户名<br>✅ AC3: 支持修改用户设置（主题、语言、通知开关） |

#### 变量声明

**配置变量**
```
user_api_endpoint: string = "/api/v1/users/me" // 用户 API 端点
avatar_upload_endpoint: string = "/api/v1/users/me/avatar" // 头像上传端点
settings_api_endpoint: string = "/api/v1/users/me/settings" // 设置 API 端点
```

**输入变量**
```
user_id: string // 用户 ID
username: string // 用户名
avatar_file: File // 头像文件
theme: string // 主题
language: string // 语言
notification_enabled: boolean // 是否启用通知
```

**输出变量**
```
user_profile_page_component: ReactComponent // 用户个人中心页面组件
user_info_component: ReactComponent // 用户信息组件
user_settings_component: ReactComponent // 用户设置组件
```

**状态变量**
```
user_profile: object = null // 用户资料
is_editing: boolean = False // 编辑状态
is_saving: boolean = False // 保存状态
```
| **FE-223** | P2 | `[FE]` | 🟡 **P2** | **实现教师管理页面** | [FE-205], [BE-105] | **依赖接口:** [BE-105] `GET /api/v1/courses`<br>✅ AC1: 两列布局（左侧导航 30%，右侧内容 70%）<br>✅ AC2: 左侧导航：班级管理、学生列表、课程/模板管理、学生项目监控、学生仪表盘<br>✅ AC3: 班级管理：创建、编辑、删除班级<br>✅ AC4: 学生列表：查看所有学生、添加到班级、从班级移除<br>✅ AC5: 学生项目监控：查看所有学生项目、进入项目旁观/指导 |

#### 变量声明

**配置变量**
```
courses_api_endpoint: string = "/api/v1/courses" // 课程 API 端点
students_api_endpoint: string = "/api/v1/students" // 学生 API 端点
classes_api_endpoint: string = "/api/v1/classes" // 班级 API 端点
student_projects_api_endpoint: string = "/api/v1/students/{student_id}/projects" // 学生项目 API 端点
```

**输入变量**
```
course_id: string // 课程 ID
class_id: string // 班级 ID
student_id: string // 学生 ID
project_id: string // 项目 ID
```

**输出变量**
```
teacher_dashboard_page_component: ReactComponent // 教师管理页面组件
sidebar_navigation_component: ReactComponent // 侧边栏导航组件
class_management_component: ReactComponent // 班级管理组件
student_list_component: ReactComponent // 学生列表组件
student_projects_component: ReactComponent // 学生项目组件
```

**状态变量**
```
active_tab: string = "classes" // 当前激活的标签页
classes: array = [] // 班级列表
students: array = [] // 学生列表
student_projects: array = [] // 学生项目列表
```
| **FE-224** | P2 | `[FE]` | 🟡 **P2** | **实现 Admin 管理后台** | [FE-205], [BE-103] | **依赖接口:** [BE-103] `GET /api/v1/users`<br>✅ AC1: 两列布局（左侧导航 30%，右侧内容 70%）<br>✅ AC2: 左侧导航：用户管理、系统配置、系统日志<br>✅ AC3: 用户管理：查看所有用户、创建用户、重置密码、封禁/解封<br>✅ AC4: 系统配置：配置 LLM Key、存储配额、项目成员上限<br>✅ AC5: 系统日志：查看性能日志、操作日志、错误日志 |

#### 变量声明

**配置变量**
```
users_api_endpoint: string = "/api/v1/users" // 用户 API 端点
system_config_api_endpoint: string = "/api/v1/admin/config" // 系统配置 API 端点
system_logs_api_endpoint: string = "/api/v1/admin/logs" // 系统日志 API 端点
```

**输入变量**
```
user_id: string // 用户 ID
config_key: string // 配置键
config_value: string // 配置值
log_type: string // 日志类型
```

**输出变量**
```
admin_dashboard_page_component: ReactComponent // Admin 管理后台页面组件
user_management_component: ReactComponent // 用户管理组件
system_config_component: ReactComponent // 系统配置组件
system_logs_component: ReactComponent // 系统日志组件
```

**状态变量**
```
active_tab: string = "users" // 当前激活的标签页
users: array = [] // 用户列表
system_config: object = null // 系统配置
system_logs: array = [] // 系统日志
```
| **FE-225** | P2 | `[FE]` | 🟡 **P2** | **实现忘记密码页面** | [FE-204], [BE-118] | **依赖接口:** [BE-118] `POST /api/v1/auth/password/reset-request`<br>✅ AC1: 输入邮箱发送重置链接<br>✅ AC2: 显示重置链接已发送提示<br>✅ AC3: 支持联系 Admin/Teacher 手动重置 |

#### 变量声明

**配置变量**
```
password_reset_request_endpoint: string = "/api/v1/auth/password/reset-request" // 密码重置请求端点
email_validation_regex: string = "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$" // 邮箱验证正则
```

**输入变量**
```
email: string // 邮箱地址
```

**输出变量**
```
forgot_password_page_component: ReactComponent // 忘记密码页面组件
email_form_component: ReactComponent // 邮箱表单组件
success_message_component: ReactComponent // 成功消息组件
```

**状态变量**
```
email: string = "" // 邮箱地址
is_sending: boolean = False // 发送状态
is_success: boolean = False // 是否成功
error_message: string = "" // 错误消息
```
| **FE-226** | P2 | `[FE]` | 🟡 **P2** | **实现密码重置页面** | [FE-225], [BE-118] | **依赖接口:** [BE-118] `POST /api/v1/auth/password/reset`<br>✅ AC1: 输入新密码和确认密码<br>✅ AC2: 验证密码强度<br>✅ AC3: 重置成功后跳转到登录页 |

#### 变量声明

**配置变量**
```
password_reset_confirm_endpoint: string = "/api/v1/auth/password/reset" // 密码重置确认端点
password_min_length: integer = 8 // 密码最小长度
password_require_uppercase: boolean = True // 是否需要大写字母
password_require_lowercase: boolean = True // 是否需要小写字母
password_require_number: boolean = True // 是否需要数字
password_require_special: boolean = True // 是否需要特殊字符
```

**输入变量**
```
token: string // 重置令牌
new_password: string // 新密码
confirm_password: string // 确认密码
```

**输出变量**
```
reset_password_page_component: ReactComponent // 密码重置页面组件
password_form_component: ReactComponent // 密码表单组件
password_strength_indicator_component: ReactComponent // 密码强度指示器组件
```

**状态变量**
```
token: string = "" // 重置令牌
new_password: string = "" // 新密码
confirm_password: string = "" // 确认密码
password_strength: string = "weak" // 密码强度
is_resetting: boolean = False // 重置状态
is_success: boolean = False // 是否成功
error_message: string = "" // 错误消息
```
| **FE-227** | P2 | `[FE]` | 🟢 **P3** | **实现暗黑模式切换** | [FE-222] | ✅ AC1: 使用 Tailwind CSS dark: 前缀实现暗黑模式<br>✅ AC2: 在用户设置中添加主题切换开关<br>✅ AC3: 主题设置持久化到 Local Storage |

#### 变量声明

**配置变量**
```
theme_storage_key: string = "aicsl_theme" // 主题存储键
default_theme: string = "light" // 默认主题
```

**输入变量**
```
theme: string // 主题
```

**输出变量**
```
theme_toggle_component: ReactComponent // 主题切换组件
```

**状态变量**
```
current_theme: string = "light" // 当前主题
is_dark_mode: boolean = False // 是否暗黑模式
```
| **FE-228** | P2 | `[FE]` | 🟢 **P3** | **实现多语言支持（预留）** | [FE-201] | ✅ AC1: 创建 `frontend/src/config/locales.ts` 字典文件<br>✅ AC2: V1 版本仅支持中文<br>✅ AC3: 架构上预留多语言支持 |

#### 变量声明

**配置变量**
```
locales_file_path: string = "frontend/src/config/locales.ts" // 语言文件路径
default_locale: string = "zh-CN" // 默认语言
supported_locales: array = ["zh-CN"] // 支持的语言列表
```

**输入变量**
```
locale: string // 语言
translation_key: string // 翻译键
```

**输出变量**
```
i18n_provider_component: ReactComponent // 国际化提供者组件
```

**状态变量**
```
current_locale: string = "zh-CN" // 当前语言
translations: object = {} // 翻译字典
```
| **FE-229** | P2 | `[FE]` | 🟢 **P3** | **实现加载动画和骨架屏** | [FE-201] | ✅ AC1: 使用 ShadcnUI Skeleton 组件<br>✅ AC2: 数据加载时显示骨架屏<br>✅ AC3: 页面切换时显示加载动画 |

#### 变量声明

**配置变量**
```
skeleton_animation: string = "pulse" // 骨架屏动画
loading_spinner_size: string = "md" // 加载动画大小
page_transition_duration: string = "0.3s" // 页面切换过渡时间
```

**输入变量**
```
is_loading: boolean // 是否加载中
```

**输出变量**
```
skeleton_component: ReactComponent // 骨架屏组件
loading_spinner_component: ReactComponent // 加载动画组件
```

**状态变量**
```
global_loading: boolean = False // 全局加载状态
page_loading: boolean = False // 页面加载状态
```
| **FE-230** | P2 | `[FE]` | 🟢 **P3** | **实现 Toast 通知组件** | [FE-201] | ✅ AC1: 使用 ShadcnUI Toast 组件<br>✅ AC2: 支持成功、错误、警告、信息四种类型<br>✅ AC3: 自动消失（3 秒）或手动关闭 |

#### 变量声明

**配置变量**
```
toast_types: array = ["success", "error", "warning", "info"] // Toast 类型
toast_duration: integer = 3000 // Toast 显示时长（毫秒）
toast_position: string = "top-right" // Toast 位置
```

**输入变量**
```
message: string // 消息内容
type: string // 类型
duration: integer // 显示时长
```

**输出变量**
```
toast_provider_component: ReactComponent // Toast 提供者组件
toast_component: ReactComponent // Toast 组件
```

**状态变量**
```
toasts: array = [] // Toast 列表
```
| **FE-231** | P2 | `[FE]` | 🟢 **P3** | **实现错误边界组件** | [FE-201] | ✅ AC1: 创建 ErrorBoundary 组件捕获 React 错误<br>✅ AC2: 错误发生时显示友好的错误页面<br>✅ AC3: 提供刷新页面和返回首页按钮 |

#### 变量声明

**配置变量**
```
error_page_path: string = "/error" // 错误页面路径
home_page_path: string = "/" // 首页路径
```

**输入变量**
```
error: Error // 错误对象
error_info: object // 错误信息
```

**输出变量**
```
error_boundary_component: ReactComponent // 错误边界组件
error_page_component: ReactComponent // 错误页面组件
```

**状态变量**
```
has_error: boolean = False // 是否有错误
error_message: string = "" // 错误消息
error_stack: string = "" // 错误堆栈
```
| **FE-232** | P2 | `[FE]` | 🟢 **P3** | **实现虚拟滚动（长列表优化）** | [FE-210], [FE-215] | ✅ AC1: 使用 react-window 或 react-virtualized<br>✅ AC2: 聊天记录、文件列表使用虚拟滚动<br>✅ AC3: 只渲染可见区域元素，提升性能 |

#### 变量声明

**配置变量**
```
virtual_library: string = "react-window" // 虚拟滚动库
item_height: integer = 50 // 列表项高度
overscan_count: integer = 5 // 预渲染项数
```

**输入变量**
```
items: array // 列表项数据
item_count: integer // 列表项数量
```

**输出变量**
```
virtual_list_component: ReactComponent // 虚拟列表组件
virtual_chat_list_component: ReactComponent // 虚拟聊天列表组件
virtual_file_list_component: ReactComponent // 虚拟文件列表组件
```

**状态变量**
```
scroll_position: integer = 0 // 滚动位置
visible_range: object = { start: 0, end: 10 } // 可见范围
```
| **QA-002** | P2 | `[QA]` | 🔴 **P1** | **执行 P2 阶段 E2E 测试** | [FE-232] | ✅ AC1: 使用 Playwright 测试文档实时协作（两个浏览器窗口同时编辑）<br>✅ AC2: 测试白板实时协作（两个浏览器窗口同时绘图）<br>✅ AC3: 测试聊天和 @提及功能<br>✅ AC4: 测试文件上传和预览<br>✅ AC5: 生成测试报告 |

#### 变量声明

**配置变量**
```
playwright_config_file: string = "playwright.config.ts" // Playwright 配置文件
test_report_dir: string = "playwright-report" // 测试报告目录
base_url: string = "http://localhost:3000" // 测试基础 URL
test_timeout: integer = 60000 // 测试超时时间（毫秒）
browser_count: integer = 2 // 浏览器数量
```

**输入变量**
```
test_user1_email: string // 测试用户 1 邮箱
test_user1_password: string // 测试用户 1 密码
test_user2_email: string // 测试用户 2 邮箱
test_user2_password: string // 测试用户 2 密码
```

**输出变量**
```
test_report: object // 测试报告对象
test_screenshots: array // 测试截图列表
test_videos: array // 测试视频列表
```

**状态变量**
```
tests_passed: integer = 0 // 通过的测试数量
tests_failed: integer = 0 // 失败的测试数量
tests_skipped: integer = 0 // 跳过的测试数量
collaboration_latency: integer = 0 // 协作延迟（毫秒）
```


## Phase 3: 智能化与完善 (Intelligence & Polish)

### 目标
AI 导师、数据分析、浏览器批注。

### 任务列表

| **ID** | **阶段** | **角色** | **P级** | **任务名称** | **依赖** | **产出接口 / 验收标准** |
|--------|----------|----------|----------|--------------|----------|------------------------|
| **AI-301** | P3 | `[AI]` | 🔴 **P1** | **实现 AI 对话服务 (LangChain)** | [BE-101], [INFRA-004] | ✅ AC1: 集成 LangChain 和 OpenAI API<br>✅ AC2: 支持开发态切换到 Ollama (Llama 3)<br>✅ AC3: 实现流式响应（SSE）<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
openai_api_key: string // OpenAI API 密钥（从环境变量读取）
openai_model: string = "gpt-4o" // OpenAI 模型名称
ollama_base_url: string = "http://localhost:11434" // Ollama 基础 URL
ollama_model: string = "llama3" // Ollama 模型名称
langchain_version: string = "1.2.0" // LangChain 版本
use_ollama: boolean = False // 是否使用 Ollama（开发态切换）
stream_response: boolean = True // 是否启用流式响应
sse_timeout: integer = 30000 // SSE 超时时间（毫秒）
```

**输入变量**
```
messages: array // 对话消息列表 [{role, content}]
context_config: object // 上下文配置（project_id, document_id, whiteboard_id）
system_prompt: string // 系统 Prompt
temperature: float = 0.7 // 温度参数（0.0 - 1.0）
max_tokens: integer = 2000 // 最大生成 Token 数
```

**输出变量**
```
ai_response: string // AI 回复内容
citations: array // 引用来源列表
stream_event: object // SSE 流事件 {event, data}
```

**状态变量**
```
ai_service_initialized: boolean = False // AI 服务初始化状态
stream_active: boolean = False // 流式响应激活状态
conversation_active: boolean = False // 对话激活状态
```
| **AI-302** | P3 | `[AI]` | 🔴 **P1** | **实现 RAG 检索增强生成** | [AI-301], [BE-108] | ✅ AC1: 对资源库 PDF/Doc 进行向量化<br>✅ AC2: 实现向量检索（使用 MongoDB Atlas Search 或 ChromaDB）<br>✅ AC3: 检索结果作为上下文传递给 AI<br>✅ AC4: 展示引用来源 |

#### 变量声明

**配置变量**
```
vector_db_type: string = "mongodb_atlas" // 向量数据库类型（mongodb_atlas/chromadb）
embedding_model: string = "text-embedding-3-small" // 嵌入模型
chunk_size: integer = 1000 // 文档分块大小（字符数）
chunk_overlap: integer = 200 // 分块重叠大小
top_k: integer = 5 // 检索返回的 Top-K 结果数
chromadb_host: string = "localhost" // ChromaDB 主机
chromadb_port: integer = 8000 // ChromaDB 端口
```

**输入变量**
```
query: string // 查询文本
resource_id: string // 资源 ID
project_id: string // 项目 ID
document_content: string // 文档内容
```

**输出变量**
```
retrieved_docs: array // 检索到的文档列表 [{content, metadata, score}]
context: string // 组合后的上下文文本
citations: array // 引用来源列表
```

**状态变量**
```
vectorization_progress: float = 0.0 // 向量化进度（0.0 - 1.0）
docs_indexed: integer = 0 // 已索引文档数量
retrieval_active: boolean = False // 检索激活状态
```
| **AI-303** | P3 | `[AI]` | 🔴 **P1** | **实现 AI 角色管理** | [AI-301] | ✅ AC1: 预设多个 AI 角色（苏格拉底、导师、助手）<br>✅ AC2: 每个角色有独立的 system_prompt 和 temperature<br>✅ AC3: 支持切换 AI 角色 |

#### 变量声明

**配置变量**
```
ai_roles_collection: string = "ai_roles" // AI 角色集合名称
default_role_id: string = "assistant" // 默认角色 ID
```

**输入变量**
```
role_id: string // 角色 ID
role_name: string // 角色名称
system_prompt: string // 系统 Prompt
temperature: float // 温度参数
```

**输出变量**
```
ai_role: object // AI 角色对象（id, name, system_prompt, temperature）
available_roles: array // 可用角色列表
```

**状态变量**
```
current_role_id: string = "assistant" // 当前角色 ID
role_switched: boolean = False // 角色切换状态
```
| **AI-304** | P3 | `[AI]` | 🔴 **P1** | **实现 AI 自动干预规则** | [AI-301], [BE-106] | ✅ AC1: 实现沉默检测（15 分钟无操作自动触发）<br>✅ AC2: 实现情绪检测（连续出现负面词汇触发）<br>✅ AC3: 实现关键词触发（@help, #求助）<br>✅ AC4: 实现规则优先级处理（关键词 > 情绪 > 沉默） |

#### 变量声明

**配置变量**
```
silence_threshold_minutes: integer = 15 // 沉默检测阈值（分钟）
negative_keywords: array = ["不会", "不懂", "太难", "放弃"] // 负面情绪关键词
trigger_keywords: array = ["@help", "#求助", "救命"] // 触发关键词
rule_priority: object = {"keyword": 3, "emotion": 2, "silence": 1} // 规则优先级
```

**输入变量**
```
user_id: string // 用户 ID
project_id: string // 项目 ID
last_activity_time: datetime // 最后活动时间
chat_message: string // 聊天消息内容
```

**输出变量**
```
intervention_triggered: boolean // 是否触发干预
intervention_type: string // 干预类型（keyword/emotion/silence）
intervention_message: string // 干预消息内容
```

**状态变量**
```
last_intervention_time: datetime = null // 最后干预时间
intervention_count: integer = 0 // 干预次数
user_silence_detected: boolean = False // 用户沉默检测状态
negative_emotion_detected: boolean = False // 负面情绪检测状态
```
| **AI-305** | P3 | `[AI]` | 🟡 **P2** | **实现 AI 对话历史管理** | [AI-301] | ✅ AC1: 保存 AI 对话记录到 MongoDB<br>✅ AC2: 支持查看历史对话<br>✅ AC3: 支持对话上下文管理 |

#### 变量声明

**配置变量**
```
conversations_collection: string = "ai_conversations" // 对话集合名称
messages_collection: string = "ai_messages" // 消息集合名称
max_conversation_history: integer = 100 // 最大对话历史条数
```

**输入变量**
```
conversation_id: string // 对话 ID
project_id: string // 项目 ID
user_id: string // 用户 ID
role: string // 消息角色（user/assistant）
content: string // 消息内容
```

**输出变量**
```
conversation: object // 对话对象（id, project_id, user_id, created_at）
conversation_list: array // 对话列表
message_list: array // 消息列表
```

**状态变量**
```
current_conversation_id: string = null // 当前对话 ID
messages_count: integer = 0 // 消息数量
```
| **AI-306** | P3 | `[AI]` | 🟡 **P2** | **实现 AI 用户反馈收集** | [AI-301] | ✅ AC1: 支持用户对 AI 回复进行评分（1-5 星）<br>✅ AC2: 支持用户添加评论<br>✅ AC3: 反馈数据用于 RLHF 优化 |

#### 变量声明

**配置变量**
```
feedback_collection: string = "ai_feedback" // 反馈集合名称
rating_min: integer = 1 // 最小评分
rating_max: integer = 5 // 最大评分
comment_max_length: integer = 500 // 评论最大长度
```

**输入变量**
```
message_id: string // 消息 ID
rating: integer // 评分（1-5 星）
comment: string // 评论内容
user_id: string // 用户 ID
```

**输出变量**
```
feedback: object // 反馈对象（id, message_id, user_id, rating, comment, created_at）
feedback_summary: object // 反馈摘要（average_rating, total_count）
```

**状态变量**
```
feedback_submitted: boolean = False // 反馈提交状态
average_rating: float = 0.0 // 平均评分
```
| **AI-307** | P3 | `[AI]` | 🟡 **P2** | **实现 AI 快捷指令** | [AI-301] | ✅ AC1: 支持 /wake 呼出 AI<br>✅ AC2: 支持快捷指令（/explain, /summarize）<br>✅ AC3: 支持划词询问 |

#### 变量声明

**配置变量**
```
wake_command: string = "/wake" // 呼出 AI 命令
quick_commands: object = {"/explain": "解释", "/summarize": "总结"} // 快捷指令映射
```

**输入变量**
```
command: string // 快捷指令
selected_text: string // 选中的文本
context: object // 上下文信息
```

**输出变量**
```
ai_response: string // AI 回复内容
command_executed: boolean // 命令执行状态
```

**状态变量**
```
ai_wake_active: boolean = False // AI 唤醒状态
command_active: boolean = False // 命令激活状态
```
| **AI-308** | P3 | `[AI]` | 🟢 **P3** | **实现 AI 上下文感知** | [AI-301], [BE-111] | ✅ AC1: AI 能够读取白板内容<br>✅ AC2: AI 能够读取文档内容<br>✅ AC3: AI 能够基于当前上下文回答问题 |

#### 变量声明

**配置变量**
```
context_window_size: integer = 5000 // 上下文窗口大小（字符数）
whiteboard_context_limit: integer = 2000 // 白板上下文限制
document_context_limit: integer = 3000 // 文档上下文限制
```

**输入变量**
```
project_id: string // 项目 ID
whiteboard_id: string // 白板 ID
document_id: string // 文档 ID
query: string // 查询文本
```

**输出变量**
```
context: object // 上下文对象（whiteboard_content, document_content, chat_history）
ai_response: string // AI 回复内容
context_sources: array // 上下文来源列表
```

**状态变量**
```
context_loaded: boolean = False // 上下文加载状态
context_size: integer = 0 // 上下文大小
```
| **AI-309** | P3 | `[AI]` | 🔴 **P1** | **实现混合检索策略（向量 + 滑动窗口 + 实时注入）** | [AI-302], [BE-135] | **检索策略**<br>• 向量检索：基于语义相似度从向量数据库检索相关文档片段（权重 40%）<br>• 滑动窗口：从当前文档中提取用户光标附近的文本片段（权重 30%）<br>• 实时注入：将白板当前状态和文档最新快照实时注入上下文（权重 30%）<br>**接口**<br>• `hybrid_retrieve(project_id, query, context_window)` - 混合检索<br>• `vector_search(query, top_k)` - 向量搜索<br>• `sliding_window_search(document_id, cursor_position, window_size)` - 滑动窗口搜索<br>• `realtime_context_inject(project_id)` - 实时上下文注入<br>✅ AC1: 实现三种检索策略的加权融合<br>✅ AC2: 支持动态调整各策略权重<br>✅ AC3: 实现检索结果去重和排序<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
vector_search_weight: float = 0.4 // 向量检索权重
sliding_window_weight: float = 0.3 // 滑动窗口权重
realtime_injection_weight: float = 0.3 // 实时注入权重
vector_search_top_k: integer = 5 // 向量检索返回数量
sliding_window_size: integer = 2000 // 滑动窗口大小（字符）
max_context_tokens: integer = 4000 // 最大上下文 Token 数
```

**输入变量**
```
project_id: string // 项目 ID
query: string // 查询文本
document_id: string // 文档 ID
cursor_position: integer // 光标位置
context_window: integer // 上下文窗口大小
```

**输出变量**
```
retrieved_context: array // 检索到的上下文片段 [{content, source, score, type}]
vector_results: array // 向量检索结果
sliding_window_results: array // 滑动窗口结果
realtime_context: object // 实时上下文（白板内容 + 文档快照）
```

**状态变量**
```
retrieval_in_progress: boolean = False // 检索进行中
context_tokens_used: integer = 0 // 已使用上下文 Token 数
```
| **AI-310** | P3 | `[AI]` | 🔴 **P1** | **实现多模态文本化处理（白板内容转文本）** | [AI-309], [BE-111] | **文本化策略**<br>• 文本框：直接提取文本内容<br>• 形状：提取形状类型和标签（如"矩形: 标题"、"圆形: 核心概念"）<br>• 连线：提取连接关系（如"连接: 节点A -> 节点B"）<br>• 图片：使用 OCR 提取图片中的文字（可选）<br>**接口**<br>• `whiteboard_to_text(whiteboard_id)` - 白板内容转文本<br>• `element_to_text(element)` - 单个元素转文本<br>• `extract_connections(elements)` - 提取连接关系<br>✅ AC1: 实现白板元素的文本化转换<br>✅ AC2: 支持提取元素间的连接关系<br>✅ AC3: 可选集成 OCR 处理图片元素<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
ocr_enabled: boolean = False // OCR 功能开关
ocr_language: string = "chi_sim+eng" // OCR 语言（中文+英文）
max_text_length: integer = 1000 // 单个元素最大文本长度
connection_format: string = "连接: {from} -> {to}" // 连接关系格式
```

**输入变量**
```
whiteboard_id: string // 白板 ID
elements: array // 白板元素列表 [{type, content, x, y, connections}]
```

**输出变量**
```
text_representation: string // 文本化表示
element_texts: array // 各元素的文本表示 [{element_id, text}]
connections: array // 连接关系列表 [{from, to, label}]
```

**状态变量**
```
text_conversion_in_progress: boolean = False // 文本转换进行中
ocr_processing: boolean = False // OCR 处理中
```
| **AI-311** | P3 | `[AI]` | 🟡 **P2** | **实现 Token 预算管理系统** | [AI-309] | **预算分配策略**<br>• 系统提示词：固定 500 tokens<br>• 检索上下文：动态分配，最多 2000 tokens（根据混合检索结果）<br>• 对话历史：动态分配，最多 1000 tokens（保留最近 N 条消息）<br>• 用户查询：固定 500 tokens<br>• AI 回复：预留 2000 tokens<br>**接口**<br>• `allocate_token_budget(query, context, history)` - 分配 Token 预算<br>• `truncate_context(context, max_tokens)` - 截断上下文<br>• `truncate_history(history, max_tokens)` - 截断历史<br>• `estimate_tokens(text)` - 估算文本 Token 数<br>✅ AC1: 实现基于 Token 预算的上下文截断<br>✅ AC2: 支持动态调整各部分预算分配<br>✅ AC3: 实现 Token 估算功能（使用 tiktoken）<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
max_total_tokens: integer = 6000 // 最大总 Token 数（GPT-4 限制）
system_prompt_tokens: integer = 500 // 系统提示词 Token 数
retrieved_context_max_tokens: integer = 2000 // 检索上下文最大 Token 数
chat_history_max_tokens: integer = 1000 // 对话历史最大 Token 数
user_query_tokens: integer = 500 // 用户查询 Token 数
ai_response_tokens: integer = 2000 // AI 回复预留 Token 数
```

**输入变量**
```
query: string // 用户查询
retrieved_context: array // 检索到的上下文
chat_history: array // 对话历史
system_prompt: string // 系统提示词
```

**输出变量**
```
token_allocation: object // Token 分配 {system, context, history, query, response}
truncated_context: array // 截断后的上下文
truncated_history: array // 截断后的历史
estimated_tokens: object // 各部分估算的 Token 数
```

**状态变量**
```
budget_allocated: boolean = False // 预算已分配
total_tokens_used: integer = 0 // 总使用 Token 数
```
| **BE-135** | P3 | `[BE]` | 🔴 **P1** | **实现异步任务队列（文档向量化）** | [BE-108], [INFRA-004] | **任务类型**<br>• 文档上传：解析 PDF/Doc 文件，提取文本内容<br>• 文本分块：将长文本切分成小块（chunk_size=500, overlap=50）<br>• 向量化：调用 Embedding API 将文本块转换为向量<br>• 向量存储：将向量存储到 MongoDB Atlas Search 或 ChromaDB<br>**接口**<br>• `submit_vectorization_task(document_id)` - 提交向量化任务<br>• `get_task_status(task_id)` - 获取任务状态<br>• `cancel_task(task_id)` - 取消任务<br>**任务状态**<br>• pending: 等待处理<br>• processing: 处理中（显示进度百分比）<br>• completed: 完成<br>• failed: 失败（记录错误信息）<br>✅ AC1: 使用 Celery + Redis 实现异步任务队列<br>✅ AC2: 实现任务进度追踪和状态更新<br>✅ AC3: 支持任务失败重试（最多 3 次）<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
celery_broker_url: string = "redis://localhost:6379/0" // Celery Broker URL
celery_result_backend: string = "redis://localhost:6379/1" // Celery 结果存储
task_max_retries: integer = 3 // 任务最大重试次数
task_retry_delay: integer = 60 // 重试延迟（秒）
chunk_size: integer = 500 // 文本块大小（字符）
chunk_overlap: integer = 50 // 文本块重叠（字符）
```

**输入变量**
```
document_id: string // 文档 ID
task_id: string // 任务 ID
file_path: string // 文件路径
```

**输出变量**
```
task_status: object // 任务状态 {task_id, status, progress, error, created_at}
task_result: object // 任务结果 {document_id, chunks_count, vectors_count}
```

**状态变量**
```
task_queue_length: integer = 0 // 任务队列长度
active_tasks_count: integer = 0 // 活跃任务数
```
| **BE-136** | P3 | `[BE]` | 🟡 **P2** | **实现 Embedding 缓存机制** | [BE-135] | **缓存策略**<br>• 缓存键：使用文本内容的 SHA256 哈希值作为键<br>• 缓存值：存储 Embedding 向量和元数据<br>• 过期策略：TTL 30 天，LRU 淘汰<br>• 缓存命中：直接返回缓存的向量，避免重复调用 Embedding API<br>**接口**<br>• `get_cached_embedding(text_hash)` - 获取缓存的 Embedding<br>• `set_cached_embedding(text_hash, vector, metadata)` - 设置缓存<br>• `invalidate_cache(document_id)` - 使文档相关缓存失效<br>✅ AC1: 使用 Redis 实现 Embedding 缓存<br>✅ AC2: 实现 TTL 和 LRU 淘汰策略<br>✅ AC3: 实现缓存命中率统计<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
embedding_cache_ttl: integer = 2592000 // 缓存 TTL（30 天，秒）
embedding_cache_max_size: integer = 100000 // 缓存最大条目数
embedding_cache_prefix: string = "emb:" // 缓存键前缀
```

**输入变量**
```
text_hash: string // 文本内容的 SHA256 哈希
vector: array // Embedding 向量
metadata: object // 元数据（document_id, chunk_index, created_at）
document_id: string // 文档 ID
```

**输出变量**
```
cached_embedding: object // 缓存的 Embedding {vector, metadata, created_at}
cache_hit: boolean // 是否命中缓存
cache_stats: object // 缓存统计 {hits, misses, hit_rate}
```

**状态变量**
```
cache_size: integer = 0 // 缓存当前大小
cache_hits: integer = 0 // 缓存命中次数
cache_misses: integer = 0 // 缓存未命中次数
```
| **BE-121** | P3 | `[BE]` | 🔴 **P1** | **实现 AI 对话 API** | [AI-301] | **`POST /api/v1/ai/chat`**<br>· In: AIChatRequest (messages, context_config)<br>· Out: AIChatResponse (content, citations)<br>**`POST /api/v1/ai/chat/stream`**<br>· In: AIChatRequest (messages, context_config)<br>· Out: SSE Stream (event: delta, event: error)<br>**`GET /api/v1/ai/conversations/{project_id}`**<br>· Out: ConversationListResponse (conversations[])<br>**`GET /api/v1/ai/conversations/{conversation_id}`**<br>· Out: ConversationDetailResponse (messages[])<br>**`POST /api/v1/ai/feedback`**<br>· In: AIFeedbackRequest (message_id, rating, comment)<br>· Out: SuccessResponse<br>✅ AC1: 实现流式响应（SSE）<br>✅ AC2: 支持错误处理和超时<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
ai_chat_timeout: integer = 60 // AI 对话超时时间（秒）
sse_keepalive_interval: integer = 15 // SSE 保活间隔（秒）
max_conversation_messages: integer = 200 // 最大对话消息数
```

**输入变量**
```
messages: array // 对话消息列表 [{role, content}]
context_config: object // 上下文配置（project_id, role_id）
conversation_id: string // 对话 ID
project_id: string // 项目 ID
message_id: string // 消息 ID
rating: integer // 评分（1-5 星）
comment: string // 评论内容
```

**输出变量**
```
ai_chat_response: object // AI 对话响应（content, citations, message_id）
conversation_list: array // 对话列表
conversation_detail: object // 对话详情（messages）
success_response: object // 成功响应
sse_stream: object // SSE 流事件
```

**状态变量**
```
stream_active: boolean = False // 流式响应激活状态
conversation_count: integer = 0 // 对话数量
message_count: integer = 0 // 消息数量
```
| **BE-122** | P3 | `[BE]` | 🔴 **P1** | **实现浏览器批注 API** | [BE-101] | **`POST /api/v1/web-annotations`**<br>· In: WebAnnotationCreateRequest (project_id, target_url, selector, type, color, content)<br>· Out: WebAnnotationResponse<br>**`GET /api/v1/web-annotations/{project_id}`**<br>· Out: WebAnnotationListResponse (annotations[])<br>**`DELETE /api/v1/web-annotations/{annotation_id}`**<br>· Out: SuccessResponse<br>**`POST /api/v1/web-proxy/fetch`**<br>· In: WebProxyFetchRequest (url)<br>· Out: WebProxyFetchResponse (content, status)<br>✅ AC1: 使用 Playwright 抓取网页内容<br>✅ AC2: 使用 Readability 算法提取正文<br>✅ AC3: 使用 DOM Purify 清洗脚本<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
web_annotations_collection: string = "web_annotations" // 网页批注集合名称
playwright_timeout: integer = 30000 // Playwright 超时时间（毫秒）
whitelist_domains: array = ["youtube.com", "vimeo.com"] // 白名单域名
```

**输入变量**
```
project_id: string // 项目 ID
annotation_id: string // 批注 ID
target_url: string // 目标 URL
selector: string // CSS 选择器
type: string // 批注类型（highlight/underline/note）
color: string // 批注颜色
content: string // 批注内容
url: string // 代理抓取 URL
```

**输出变量**
```
web_annotation_response: object // 网页批注响应（id, project_id, target_url, selector, type, color, content, created_by）
annotation_list: array // 批注列表
success_response: object // 成功响应
web_proxy_response: object // 代理响应（content, status, title）
```

**状态变量**
```
annotation_count: integer = 0 // 批注数量
proxy_fetch_active: boolean = False // 代理抓取激活状态
```
| **BE-123** | P3 | `[BE]` | 🔴 **P1** | **实现数据分析 API** | [BE-143], [BE-144] | **`GET /api/v1/analytics/{project_id}/dashboard`**<br>· Out: DashboardResponse (team_contribution, study_hours, task_completion, ability_model, activity_chart)<br>**`GET /api/v1/analytics/{project_id}/behavior`**<br>· Out: BehaviorListResponse (logs[])<br>**`GET /api/v1/analytics/{project_id}/export`**<br>· In: AnalyticsExportRequest (format, start_date, end_date)<br>· Out: FileResponse (download_url)<br>✅ AC1: 实现每日统计缓存（analytics_daily_stats）<br>✅ AC2: 支持导出 CSV、JSON、Excel 格式<br>✅ AC3: 使用 Pandas + OpenPyXL 生成 Excel<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
analytics_daily_stats_collection: string = "analytics_daily_stats" // 每日统计集合名称
behavior_logs_collection: string = "behavior_logs" // 行为日志集合名称
export_formats: array = ["csv", "json", "excel"] // 支持的导出格式
cache_ttl_hours: integer = 24 // 缓存 TTL（小时）
```

**输入变量**
```
project_id: string // 项目 ID
start_date: date // 开始日期
end_date: date // 结束日期
format: string // 导出格式
```

**输出变量**
```
dashboard_response: object // 仪表盘响应（team_contribution, study_hours, task_completion, ability_model, activity_chart）
behavior_list: array // 行为日志列表
file_response: object // 文件响应（download_url, filename）
```

**状态变量**
```
dashboard_cached: boolean = False // 仪表盘缓存状态
export_in_progress: boolean = False // 导出进行中状态
```
| **BE-124** | P3 | `[BE]` | 🟡 **P2** | **实现 AI 干预规则 API** | [AI-304] | **`GET /api/v1/ai/intervention-rules`**<br>· Out: InterventionRuleListResponse (rules[])<br>**`POST /api/v1/ai/intervention-rules`**<br>· In: InterventionRuleCreateRequest (name, type, conditions, action, priority)<br>· Out: InterventionRuleResponse<br>**`PUT /api/v1/ai/intervention-rules/{rule_id}`**<br>· In: InterventionRuleUpdateRequest (enabled, conditions, action)<br>· Out: InterventionRuleResponse<br>**`DELETE /api/v1/ai/intervention-rules/{rule_id}`**<br>· Out: SuccessResponse<br>✅ AC1: 支持通过 Swagger API 直接管理规则<br>✅ AC2: 支持规则启用/禁用<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
intervention_rules_collection: string = "intervention_rules" // 干预规则集合名称
```

**输入变量**
```
rule_id: string // 规则 ID
name: string // 规则名称
type: string // 规则类型（keyword/emotion/silence）
conditions: object // 规则条件
action: object // 规则动作
priority: integer // 规则优先级
enabled: boolean // 是否启用
```

**输出变量**
```
intervention_rule: object // 干预规则对象（id, name, type, conditions, action, priority, enabled）
rule_list: array // 规则列表
success_response: object // 成功响应
```

**状态变量**
```
rule_count: integer = 0 // 规则数量
rule_enabled: boolean = False // 规则启用状态
```
| **BE-125** | P3 | `[BE]` | 🟡 **P2** | **实现系统日志 API** | [BE-115] | **`GET /api/v1/admin/logs`**<br>· Out: LogListResponse (logs[])<br>**`GET /api/v1/admin/logs/export`**<br>· In: LogExportRequest (type, start_date, end_date, format)<br>· Out: FileResponse (download_url)<br>✅ AC1: 支持按日志类型过滤（性能/操作/错误）<br>✅ AC2: 支持按时间范围导出<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
system_logs_collection: string = "system_logs" // 系统日志集合名称
log_types: array = ["performance", "operation", "error"] // 日志类型
log_retention_days: integer = 90 // 日志保留天数
```

**输入变量**
```
log_type: string // 日志类型
start_date: date // 开始日期
end_date: date // 结束日期
format: string // 导出格式
```

**输出变量**
```
log_list: array // 日志列表
file_response: object // 文件响应（download_url, filename）
```

**状态变量**
```
log_count: integer = 0 // 日志数量
export_in_progress: boolean = False // 导出进行中状态
```
| **BE-126** | P3 | `[BE]` | 🟡 **P2** | **实现系统配置 API** | [BE-103] | **`GET /api/v1/admin/config`**<br>· Out: ConfigResponse (llm_api_key, llm_model, storage_quota, file_size_limit, member_limit, data_retention_days)<br>**`PUT /api/v1/admin/config`**<br>· In: ConfigUpdateRequest (llm_api_key, llm_model, storage_quota, file_size_limit, member_limit, data_retention_days)<br>· Out: ConfigResponse<br>✅ AC1: 支持配置 LLM API Key 和模型选择<br>✅ AC2: 支持配置存储配额和文件大小限制<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
system_config_collection: string = "system_config" // 系统配置集合名称
config_key: string = "default" // 配置键
```

**输入变量**
```
llm_api_key: string // LLM API 密钥
llm_model: string // LLM 模型名称
storage_quota: integer // 存储配额（字节）
file_size_limit: integer // 文件大小限制（字节）
member_limit: integer // 成员数量限制
data_retention_days: integer // 数据保留天数
```

**输出变量**
```
config_response: object // 配置响应（llm_api_key, llm_model, storage_quota, file_size_limit, member_limit, data_retention_days）
```

**状态变量**
```
config_updated: boolean = False // 配置更新状态
```
| **BE-127** | P3 | `[BE]` | 🟡 **P2** | **实现用户封禁/解封 API** | [BE-103] | **`POST /api/v1/admin/users/{user_id}/ban`**<br>· In: UserBanRequest (reason)<br>· Out: SuccessResponse<br>**`POST /api/v1/admin/users/{user_id}/unban`**<br>· Out: SuccessResponse<br>✅ AC1: 封禁后用户无法登录<br>✅ AC2: 封禁原因记录到日志<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
users_collection: string = "users" // 用户集合名称
ban_logs_collection: string = "ban_logs" // 封禁日志集合名称
```

**输入变量**
```
user_id: string // 用户 ID
reason: string // 封禁原因
```

**输出变量**
```
success_response: object // 成功响应
user_response: object // 用户响应（id, username, is_banned, banned_at, banned_reason）
```

**状态变量**
```
user_banned: boolean = False // 用户封禁状态
```
| **BE-132** | P3 | `[BE]` | 🟡 **P2** | **实现课程模板管理 API** | [BE-105] | **`GET /api/v1/templates`**<br>· Out: TemplateListResponse (templates[])<br>**`POST /api/v1/templates`**<br>· In: TemplateCreateRequest (name, description, project_template_id)<br>· Out: TemplateResponse<br>**`GET /api/v1/templates/{template_id}`**<br>· Out: TemplateDetailResponse (template)<br>**`PUT /api/v1/templates/{template_id}`**<br>· In: TemplateUpdateRequest (name, description, project_template_id)<br>· Out: TemplateResponse<br>**`DELETE /api/v1/templates/{template_id}`**<br>· Out: SuccessResponse<br>**`POST /api/v1/courses/{course_id}/assign-template`**<br>· In: AssignTemplateRequest (template_id)<br>· Out: SuccessResponse<br>✅ AC1: 支持创建课程模板（包含项目模板、任务模板）<br>✅ AC2: 支持将模板分配给班级<br>✅ AC3: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
templates_collection: string = "templates" // 模板集合名称
project_templates_collection: string = "project_templates" // 项目模板集合名称
task_templates_collection: string = "task_templates" // 任务模板集合名称
```

**输入变量**
```
template_id: string // 模板 ID
name: string // 模板名称
description: string // 模板描述
project_template_id: string // 项目模板 ID
course_id: string // 班级 ID
```

**输出变量**
```
template_list: array // 模板列表
template_response: object // 模板响应对象（id, name, description, project_template_id, created_at）
success_response: object // 成功响应对象
```

**状态变量**
```
template_assigned: boolean = False // 模板分配状态
template_count: integer = 0 // 模板数量
```
| **BE-128** | P3 | `[BE]` | 🟡 **P2** | **实现 Prometheus 监控集成** | [BE-101] | ✅ AC1: 集成 prometheus-fastapi-instrumentator<br>✅ AC2: 暴露 /metrics 端点<br>✅ AC3: 自定义指标（API 请求数、响应时间） |

#### 变量声明

**配置变量**
```
prometheus_endpoint: string = "/metrics" // Prometheus 端点
instrumentator_version: string = "latest" // Prometheus FastAPI Instrumentator 版本
```

**输入变量**
```
metric_name: string // 指标名称
metric_value: float // 指标值
metric_labels: object // 指标标签
```

**输出变量**
```
metrics_data: string // Prometheus 指标数据
```

**状态变量**
```
prometheus_enabled: boolean = False // Prometheus 启用状态
metrics_collected: boolean = False // 指标收集状态
```
| **BE-133** | P3 | `[BE]` | 🟡 **P2** | **实现系统通知 API** | [BE-106] | **`GET /api/v1/notifications`**<br>· Out: NotificationListResponse (notifications[])<br>**`GET /api/v1/notifications/{notification_id}`**<br>· Out: NotificationDetailResponse (notification)<br>**`PUT /api/v1/notifications/{notification_id}/read`**<br>· Out: SuccessResponse<br>**`PUT /api/v1/notifications/read-all`**<br>· Out: SuccessResponse<br>**`DELETE /api/v1/notifications/{notification_id}`**<br>· Out: SuccessResponse<br>✅ AC1: 支持多种通知类型（@提及、任务分配、系统公告、AI干预）<br>✅ AC2: 通过 Socket.IO 实时推送通知<br>✅ AC3: 支持标记已读/未读<br>✅ AC4: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
notifications_collection: string = "notifications" // 通知集合名称
notification_types: array = ["mention", "task_assigned", "system_announcement", "ai_intervention"] // 通知类型
notification_ttl_days: integer = 30 // 通知保留天数
```

**输入变量**
```
notification_id: string // 通知 ID
user_id: string // 用户 ID
notification_type: string // 通知类型
title: string // 通知标题
content: string // 通知内容
related_id: string // 关联 ID（项目 ID、任务 ID 等）
```

**输出变量**
```
notification_list: array // 通知列表
notification_response: object // 通知响应对象（id, type, title, content, is_read, created_at）
success_response: object // 成功响应对象
unread_count: integer // 未读通知数量
```

**状态变量**
```
notification_pushed: boolean = False // 通知推送状态
notification_read: boolean = False // 通知已读状态
```
| **BE-129** | P3 | `[BE]` | 🟢 **P3** | **实现性能优化 - 数据库查询优化** | [BE-120] | ✅ AC1: 避免 N+1 查询，使用聚合管道<br>✅ AC2: 大数据量查询使用分页和投影<br>✅ AC3: 定期分析慢查询并优化 |

#### 变量声明

**配置变量**
```
query_timeout_ms: integer = 5000 // 查询超时时间（毫秒）
slow_query_threshold_ms: integer = 1000 // 慢查询阈值（毫秒）
pagination_default_size: integer = 20 // 默认分页大小
pagination_max_size: integer = 100 // 最大分页大小
```

**输入变量**
```
query_pipeline: array // 聚合管道
page: integer // 页码
page_size: integer // 每页大小
projection: object // 投影字段
```

**输出变量**
```
query_result: array // 查询结果
query_stats: object // 查询统计（execution_time_ms, documents_scanned）
```

**状态变量**
```
query_optimized: boolean = False // 查询优化状态
slow_query_detected: boolean = False // 慢查询检测状态
```
| **BE-130** | P3 | `[BE]` | 🟢 **P3** | **实现性能优化 - WebSocket 压缩** | [BE-106], [BE-107] | ✅ AC1: 启用 Socket.IO 压缩扩展<br>✅ AC2: 启用 Y-Websocket 压缩（permessage-deflate）<br>✅ AC3: 减少传输数据量 |

#### 变量声明

**配置变量**
```
socketio_compression: boolean = True // Socket.IO 压缩启用
yws_compression: boolean = True // Y-Websocket 压缩启用
compression_threshold: integer = 1024 // 压缩阈值（字节）
compression_level: integer = 6 // 压缩级别（0-9）
```

**输入变量**
```
message_data: object // 消息数据
```

**输出变量**
```
compressed_data: bytes // 压缩后的数据
compression_ratio: float // 压缩比率
```

**状态变量**
```
compression_enabled: boolean = False // 压缩启用状态
bytes_transferred: integer = 0 // 传输字节数
bytes_saved: integer = 0 // 节省字节数
```
| **BE-131** | P3 | `[BE]` | 🟢 **P3** | **实现性能优化 - CDN 加速** | [BE-108] | ✅ AC1: 静态资源通过 CDN 分发<br>✅ AC2: 文件上传直传到对象存储<br>✅ AC3: 减轻后端压力 |

#### 变量声明

**配置变量**
```
cdn_base_url: string = "https://cdn.example.com" // CDN 基础 URL
cdn_enabled: boolean = True // CDN 启用状态
static_file_ttl: integer = 86400 // 静态文件 TTL（秒）
```

**输入变量**
```
file_path: string // 文件路径
file_url: string // 文件 URL
```

**输出变量**
```
cdn_url: string // CDN URL
upload_url: string // 上传 URL
```

**状态变量**
```
cdn_active: boolean = False // CDN 激活状态
direct_upload_enabled: boolean = False // 直传启用状态
```
| **BE-134** | P3 | `[BE]` | 🟡 **P2** | **实现安全加固** | [BE-102] | ✅ AC1: 实现 JWT Token 刷新机制（Access Token 2小时，Refresh Token 7天）<br>✅ AC2: 实现 Rate Limiting（100 req/min per IP）<br>✅ AC3: 实现 CORS 白名单配置<br>✅ AC4: 实现 XSS 防护（DOM Purify + Content Security Policy）<br>✅ AC5: 实现 SQL 注入防护（使用 MongoDB 参数化查询）<br>✅ AC6: 实现敏感数据加密存储（bcrypt 密码哈希）<br>✅ AC7: 包含 Pytest 单元测试 |

#### 变量声明

**配置变量**
```
jwt_access_token_expire_minutes: integer = 120 // Access Token 过期时间（分钟）
jwt_refresh_token_expire_days: integer = 7 // Refresh Token 过期时间（天）
rate_limit_per_minute: integer = 100 // 每分钟请求限制
cors_allowed_origins: array = ["http://localhost:3000", "https://*.example.com"] // CORS 允许的源
csp_policy: string = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" // CSP 策略
bcrypt_rounds: integer = 12 // bcrypt 加密轮数
```

**输入变量**
```
refresh_token: string // 刷新令牌
access_token: string // 访问令牌
client_ip: string // 客户端 IP
origin: string // 请求来源
user_input: string // 用户输入
password: string // 密码
```

**输出变量**
```
new_access_token: string // 新的访问令牌
new_refresh_token: string // 新的刷新令牌
rate_limit_exceeded: boolean // 是否超过速率限制
cors_allowed: boolean // 是否允许跨域
sanitized_html: string // 清洗后的 HTML
hashed_password: string // 哈希后的密码
```

**状态变量**
```
token_refreshed: boolean = False // Token 刷新状态
rate_limit_active: boolean = False // 速率限制激活状态
security_headers_set: boolean = False // 安全头设置状态
```
| **FE-233** | P3 | `[FE]` | 🔴 **P1** | **实现 Tab 5 - AI 导师** | [FE-211], [BE-121] | **依赖接口:** [BE-121] `POST /api/v1/ai/chat/stream`<br>✅ AC1: 全屏沉浸式 AI 对话界面<br>✅ AC2: 支持流式响应（打字机效果）<br>✅ AC3: 支持 Markdown/LaTeX 渲染<br>✅ AC4: 展示引用来源<br>✅ AC5: 支持切换 AI 角色 |

#### 变量声明

**配置变量**
```
ai_chat_api_url: string = "/api/v1/ai/chat/stream" // AI 对话 API URL
typing_speed: integer = 30 // 打字机效果速度（毫秒/字符）
markdown_renderer: string = "react-markdown" // Markdown 渲染器
latex_renderer: string = "katex" // LaTeX 渲染器
max_message_length: integer = 4000 // 最大消息长度
```

**输入变量**
```
user_message: string // 用户消息
ai_role_id: string // AI 角色 ID
context_config: object // 上下文配置
```

**输出变量**
```
ai_response: string // AI 回复内容
typing_animation: object // 打字机动画状态
citations: array // 引用来源列表
```

**状态变量**
```
chat_active: boolean = False // 对话激活状态
streaming: boolean = False // 流式响应状态
current_role_id: string = "default" // 当前 AI 角色 ID
message_history: array = [] // 消息历史
```
| **FE-234** | P3 | `[FE]` | 🔴 **P1** | **实现 Tab 4 - 浏览器批注** | [FE-211], [BE-122] | **依赖接口:** [BE-122] `POST /api/v1/web-proxy/fetch`<br>✅ AC1: 方案 A（阅读模式）：后端代理抓取，前端渲染纯净 HTML<br>✅ AC2: 方案 B（白名单 Iframe）：仅允许嵌入支持 Embed 的网站<br>✅ AC3: 方案 C（外链跳转）：对于复杂应用直接在新标签页打开<br>✅ AC4: 支持对网页内容进行批注和高亮<br>✅ AC5: 支持协同阅读 |

#### 变量声明

**配置变量**
```
web_proxy_api_url: string = "/api/v1/web-proxy/fetch" // 网页代理 API URL
web_annotations_api_url: string = "/api/v1/web-annotations" // 网页批注 API URL
whitelist_domains: array = ["youtube.com", "vimeo.com"] // 白名单域名
annotation_colors: array = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"] // 批注颜色
```

**输入变量**
```
target_url: string // 目标 URL
selector: string // CSS 选择器
annotation_type: string // 批注类型（highlight/underline/note）
annotation_color: string // 批注颜色
annotation_content: string // 批注内容
```

**输出变量**
```
web_content: string // 网页内容
annotations: array // 批注列表
annotation_created: boolean // 批注创建状态
```

**状态变量**
```
web_loading: boolean = False // 网页加载状态
annotation_mode: boolean = False // 批注模式状态
current_url: string = "" // 当前 URL
annotations_count: integer = 0 // 批注数量
```
| **FE-235** | P3 | `[FE]` | 🔴 **P1** | **实现右侧边栏 - AI 快捷助手** | [FE-210], [BE-121] | **依赖接口:** [BE-121] `POST /api/v1/ai/chat/stream`<br>✅ AC1: 定位为 Copilot（轻量级快捷指令）<br>✅ AC2: 支持 /wake 呼出 AI<br>✅ AC3: 支持划词询问<br>✅ AC4: 与 Tab 5 AI 导师共享同一个对话历史 |

#### 变量声明

**配置变量**
```
copilot_api_url: string = "/api/v1/ai/chat/stream" // Copilot API URL
wake_command: string = "/wake" // 唤醒命令
quick_commands: object = {"/explain": "解释", "/summarize": "总结"} // 快捷指令映射
sidebar_width: integer = 300 // 边栏宽度（像素）
```

**输入变量**
```
command: string // 快捷指令
selected_text: string // 选中的文本
context: object // 上下文信息
```

**输出变量**
```
copilot_response: string // Copilot 回复内容
command_executed: boolean // 命令执行状态
```

**状态变量**
```
copilot_active: boolean = False // Copilot 激活状态
sidebar_visible: boolean = False // 边栏可见状态
selected_text_active: boolean = False // 选中文本激活状态
```
| **FE-236** | P3 | `[FE]` | 🟡 **P2** | **实现数据导出功能** | [FE-216], [BE-123] | **依赖接口:** [BE-123] `GET /api/v1/analytics/{project_id}/export`<br>✅ AC1: 支持导出白板为图片<br>✅ AC2: 支持导出文档为 Word / PDF<br>✅ AC3: 支持导出聊天记录<br>✅ AC4: 支持按时间导出行为流（CSV、JSON、Excel） |

#### 变量声明

**配置变量**
```
export_api_url: string = "/api/v1/analytics/{project_id}/export" // 导出 API URL
supported_formats: array = ["csv", "json", "excel", "pdf", "word", "png"] // 支持的导出格式
whiteboard_export_dpi: integer = 150 // 白板导出 DPI
```

**输入变量**
```
export_type: string // 导出类型（whiteboard/document/chat/behavior）
export_format: string // 导出格式
start_date: date // 开始日期
end_date: date // 结束日期
whiteboard_id: string // 白板 ID
document_id: string // 文档 ID
```

**输出变量**
```
download_url: string // 下载 URL
filename: string // 文件名
export_progress: float // 导出进度（0.0 - 1.0）
```

**状态变量**
```
exporting: boolean = False // 导出状态
export_progress: float = 0.0 // 导出进度
```
| **FE-237** | P3 | `[FE]` | 🟡 **P2** | **实现 Teacher 上帝视角** | [FE-223], [BE-123] | **依赖接口:** [BE-123] `GET /api/v1/analytics/{project_id}/dashboard`<br>✅ AC1: 按项目维度展示仪表盘<br>✅ AC2: 可以下钻到学生维度<br>✅ AC3: 可以查看所有学生（其班级下）的仪表盘/行为流<br>✅ AC4: 可以进入学生项目进行旁观或指导 |

#### 变量声明

**配置变量**
```
dashboard_api_url: string = "/api/v1/analytics/{project_id}/dashboard" // 仪表盘 API URL
behavior_api_url: string = "/api/v1/analytics/{project_id}/behavior" // 行为日志 API URL
drilldown_enabled: boolean = True // 下钻功能启用
observer_mode: boolean = True // 旁观模式启用
```

**输入变量**
```
view_type: string // 视图类型（project/student）
project_id: string // 项目 ID
student_id: string // 学生 ID
class_id: string // 班级 ID
```

**输出变量**
```
dashboard_data: object // 仪表盘数据（team_contribution, study_hours, task_completion, ability_model, activity_chart）
behavior_logs: array // 行为日志列表
student_list: array // 学生列表
```

**状态变量**
```
current_view: string = "project" // 当前视图
drilldown_active: boolean = False // 下钻激活状态
observer_active: boolean = False // 旁观激活状态
```
| **FE-238** | P3 | `[FE]` | 🟡 **P2** | **实现系统配置页面** | [FE-224], [BE-126] | **依赖接口:** [BE-126] `GET /api/v1/admin/config`<br>✅ AC1: 配置 LLM API Key 和模型选择（GPT-4o / Llama 3）<br>✅ AC2: 设置存储配额（默认 5GB）<br>✅ AC3: 设置单个文件大小限制（默认 50MB）<br>✅ AC4: 设置项目成员数量上限（默认 5 人）<br>✅ AC5: 设置数据保留时间（默认 365 天） |

#### 变量声明

**配置变量**
```
config_api_url: string = "/api/v1/admin/config" // 配置 API URL
default_storage_quota: integer = 5368709120 // 默认存储配额（5GB）
default_file_size_limit: integer = 52428800 // 默认文件大小限制（50MB）
default_member_limit: integer = 5 // 默认成员数量限制
default_data_retention_days: integer = 365 // 默认数据保留天数
```

**输入变量**
```
llm_api_key: string // LLM API 密钥
llm_model: string // LLM 模型名称
storage_quota: integer // 存储配额（字节）
file_size_limit: integer // 文件大小限制（字节）
member_limit: integer // 成员数量限制
data_retention_days: integer // 数据保留天数
```

**输出变量**
```
config_data: object // 配置数据
save_success: boolean // 保存成功状态
```

**状态变量**
```
config_loaded: boolean = False // 配置加载状态
config_modified: boolean = False // 配置修改状态
saving: boolean = False // 保存状态
```
| **FE-239** | P3 | `[FE]` | 🟡 **P2** | **实现系统日志页面** | [FE-224], [BE-125] | **依赖接口:** [BE-125] `GET /api/v1/admin/logs`<br>✅ AC1: 查看系统级性能日志<br>✅ AC2: 查看用户操作日志<br>✅ AC3: 查看错误日志<br>✅ AC4: 支持按时间范围导出（CSV、JSON） |

#### 变量声明

**配置变量**
```
logs_api_url: string = "/api/v1/admin/logs" // 日志 API URL
logs_export_url: string = "/api/v1/admin/logs/export" // 日志导出 API URL
log_types: array = ["performance", "operation", "error"] // 日志类型
log_page_size: integer = 50 // 日志分页大小
```

**输入变量**
```
log_type: string // 日志类型
start_date: date // 开始日期
end_date: date // 结束日期
export_format: string // 导出格式
page: integer // 页码
```

**输出变量**
```
log_list: array // 日志列表
log_count: integer // 日志总数
download_url: string // 下载 URL
```

**状态变量**
```
logs_loading: boolean = False // 日志加载状态
exporting: boolean = False // 导出状态
current_log_type: string = "all" // 当前日志类型
```
| **FE-240** | P3 | `[FE]` | 🟡 **P2** | **实现用户封禁/解封功能** | [FE-224], [BE-127] | **依赖接口:** [BE-127] `POST /api/v1/admin/users/{user_id}/ban`<br>✅ AC1: 在用户列表中显示封禁状态<br>✅ AC2: 支持封禁用户（输入封禁原因）<br>✅ AC3: 支持解封用户 |

#### 变量声明

**配置变量**
```
ban_api_url: string = "/api/v1/admin/users/{user_id}/ban" // 封禁 API URL
unban_api_url: string = "/api/v1/admin/users/{user_id}/unban" // 解封 API URL
users_api_url: string = "/api/v1/admin/users" // 用户列表 API URL
```

**输入变量**
```
user_id: string // 用户 ID
ban_reason: string // 封禁原因
```

**输出变量**
```
user_list: array // 用户列表
ban_success: boolean // 封禁成功状态
unban_success: boolean // 解封成功状态
```

**状态变量**
```
users_loading: boolean = False // 用户列表加载状态
banning: boolean = False // 封禁状态
unbanning: boolean = False // 解封状态
```
| **FE-241** | P3 | `[FE]` | 🟡 **P2** | **实现 AI 对话历史查看** | [FE-233], [BE-121] | **依赖接口:** [BE-121] `GET /api/v1/ai/conversations/{project_id}`<br>✅ AC1: 显示历史对话列表<br>✅ AC2: 点击对话查看详细内容<br>✅ AC3: 支持删除对话 |

#### 变量声明

**配置变量**
```
conversations_api_url: string = "/api/v1/ai/conversations/{project_id}" // 对话列表 API URL
conversation_detail_api_url: string = "/api/v1/ai/conversations/{conversation_id}" // 对话详情 API URL
delete_conversation_api_url: string = "/api/v1/ai/conversations/{conversation_id}" // 删除对话 API URL
```

**输入变量**
```
project_id: string // 项目 ID
conversation_id: string // 对话 ID
```

**输出变量**
```
conversation_list: array // 对话列表
conversation_detail: object // 对话详情（messages）
delete_success: boolean // 删除成功状态
```

**状态变量**
```
conversations_loading: boolean = False // 对话列表加载状态
current_conversation_id: string = "" // 当前对话 ID
deleting: boolean = False // 删除状态
```
| **FE-242** | P3 | `[FE]` | 🟡 **P2** | **实现 AI 用户反馈功能** | [FE-233], [BE-121] | **依赖接口:** [BE-121] `POST /api/v1/ai/feedback`<br>✅ AC1: 对 AI 回复进行评分（1-5 星）<br>✅ AC2: 添加评论反馈<br>✅ AC3: 反馈数据用于 RLHF 优化 |

#### 变量声明

**配置变量**
```
feedback_api_url: string = "/api/v1/ai/feedback" // 反馈 API URL
rating_scale: integer = 5 // 评分等级
```

**输入变量**
```
message_id: string // 消息 ID
rating: integer // 评分（1-5 星）
comment: string // 评论内容
```

**输出变量**
```
feedback_success: boolean // 反馈提交成功状态
feedback_data: object // 反馈数据
```

**状态变量**
```
rating_submitted: boolean = False // 评分提交状态
comment_submitted: boolean = False // 评论提交状态
```
| **FE-243** | P3 | `[FE]` | 🟢 **P3** | **实现 UI 动效** | [FE-201] | ✅ AC1: 页面切换动画（淡入淡出）<br>✅ AC2: 按钮点击动画（缩放效果）<br>✅ AC3: 加载动画（骨架屏、转圈） |

#### 变量声明

**配置变量**
```
page_transition_duration: integer = 300 // 页面切换动画时长（毫秒）
button_click_scale: float = 0.95 // 按钮点击缩放比例
loading_animation_type: string = "spinner" // 加载动画类型（spinner/skeleton）
```

**输入变量**
```
animation_type: string // 动画类型
element_id: string // 元素 ID
```

**输出变量**
```
animation_state: object // 动画状态
```

**状态变量**
```
page_transitioning: boolean = False // 页面切换状态
button_clicked: boolean = False // 按钮点击状态
loading: boolean = False // 加载状态
```
| **FE-244** | P3 | `[FE]` | 🟢 **P3** | **实现响应式布局** | [FE-203] | ✅ AC1: 支持桌面端、平板端、移动端<br>✅ AC2: 小屏幕下隐藏左侧/右侧边栏<br>✅ AC3: 使用汉堡菜单切换导航 |

#### 变量声明

**配置变量**
```
breakpoints: object = {mobile: 768, tablet: 1024, desktop: 1440} // 断点配置
sidebar_hidden_threshold: integer = 1024 // 边栏隐藏阈值
```

**输入变量**
```
screen_width: integer // 屏幕宽度
screen_height: integer // 屏幕高度
```

**输出变量**
```
device_type: string // 设备类型（mobile/tablet/desktop）
layout_config: object // 布局配置
```

**状态变量**
```
left_sidebar_visible: boolean = True // 左侧边栏可见状态
right_sidebar_visible: boolean = True // 右侧边栏可见状态
hamburger_menu_open: boolean = False // 汉堡菜单打开状态
```
| **FE-245** | P3 | `[FE]` | 🟢 **P3** | **实现快捷键支持** | [FE-211] | ✅ AC1: Ctrl/Cmd + S 保存<br>✅ AC2: Ctrl/Cmd + / 呼出 AI<br>✅ AC3: Ctrl/Cmd + K 打开命令面板 |

#### 变量声明

**配置变量**
```
shortcuts: object = {"save": "CmdOrCtrl+S", "ai_wake": "CmdOrCtrl+/", "command_palette": "CmdOrCtrl+K"} // 快捷键映射
```

**输入变量**
```
key_event: object // 键盘事件对象
```

**输出变量**
```
action_triggered: string // 触发的动作
```

**状态变量**
```
shortcuts_enabled: boolean = True // 快捷键启用状态
```
| **FE-246** | P3 | `[FE]` | 🟢 **P3** | **实现命令面板** | [FE-211] | ✅ AC1: Ctrl/Cmd + K 打开命令面板<br>✅ AC2: 支持搜索命令<br>✅ AC3: 支持快速切换 Tab |

#### 变量声明

**配置变量**
```
command_palette_shortcut: string = "CmdOrCtrl+K" // 命令面板快捷键
max_command_results: integer = 10 // 最大命令结果数
```

**输入变量**
```
search_query: string // 搜索查询
command_id: string // 命令 ID
```

**输出变量**
```
command_list: array // 命令列表
filtered_commands: array // 过滤后的命令列表
```

**状态变量**
```
command_palette_open: boolean = False // 命令面板打开状态
search_query: string = "" // 搜索查询
selected_command_index: integer = 0 // 选中的命令索引
```
| **FE-247** | P3 | `[FE]` | 🟢 **P3** | **实现离线提示** | [FE-202] | ✅ AC1: 监听网络状态（online/offline）<br>✅ AC2: 离线时显示提示横幅<br>✅ AC3: 重连后自动恢复 |

#### 变量声明

**配置变量**
```
offline_banner_duration: integer = 5000 // 离线横幅显示时长（毫秒）
reconnect_check_interval: integer = 3000 // 重连检查间隔（毫秒）
```

**输入变量**
```
network_status: string // 网络状态（online/offline）
```

**输出变量**
```
offline_banner_visible: boolean // 离线横幅可见状态
```

**状态变量**
```
is_online: boolean = True // 在线状态
reconnecting: boolean = False // 重连状态
```
| **FE-248** | P3 | `[FE]` | 🟢 **P3** | **实现性能监控面板** | [FE-216] | ✅ AC1: 显示 API 响应时间<br>✅ AC2: 显示 WebSocket 连接状态<br>✅ AC3: 显示内存使用情况 |

#### 变量声明

**配置变量**
```
performance_update_interval: integer = 1000 // 性能更新间隔（毫秒）
api_response_threshold: integer = 1000 // API 响应阈值（毫秒）
```

**输入变量**
```
api_response_time: integer // API 响应时间
websocket_status: string // WebSocket 状态
memory_usage: integer // 内存使用量
```

**输出变量**
```
performance_data: object // 性能数据（api_response_time, websocket_status, memory_usage）
```

**状态变量**
```
monitoring_active: boolean = False // 监控激活状态
```
| **FE-249** | P3 | `[FE]` | 🟡 **P2** | **实现通知中心组件** | [BE-133], [FE-202] | **Props**<br>• `user_id: string` - 当前用户 ID<br>• `socket: Socket` - Socket.IO 实例<br>**State**<br>• `notifications: array` - 通知列表<br>• `unread_count: integer` - 未读通知数<br>• `filter_type: string` - 过滤类型（all/mention/task/system）<br>**Events**<br>• `onNotificationClick(notification_id)` - 点击通知<br>• `onMarkAsRead(notification_id)` - 标记已读<br>• `onMarkAllAsRead()` - 全部标记已读<br>• `onDeleteNotification(notification_id)` - 删除通知<br>✅ AC1: 实时接收通知（Socket.IO 监听）<br>✅ AC2: 显示未读通知数量徽章<br>✅ AC3: 支持按类型过滤通知<br>✅ AC4: 支持标记单个/全部已读<br>✅ AC5: 支持删除通知<br>✅ AC6: 点击通知跳转到相关页面<br>✅ AC7: 包含 Jest 单元测试 |

#### 变量声明

**配置变量**
```
notification_polling_interval: integer = 30000 // 通知轮询间隔（毫秒）
max_notifications_display: integer = 20 // 最大显示通知数
notification_sound_enabled: boolean = True // 通知声音启用状态
```

**输入变量**
```
notification_event: object // 通知事件对象
notification_filter: string // 通知过滤器
notification_id: string // 通知 ID
```

**输出变量**
```
notification_list: array // 通知列表
unread_count: integer // 未读通知数
notification_badge_visible: boolean // 通知徽章可见状态
```

**状态变量**
```
notification_panel_open: boolean = False // 通知面板打开状态
current_filter: string = "all" // 当前过滤器
```
| **QA-003** | P3 | `[QA]` | 🔴 **P1** | **执行 P3 阶段 E2E 测试** | [FE-248] | ✅ AC1: 使用 Playwright 测试 AI 对话功能<br>✅ AC2: 测试浏览器批注功能<br>✅ AC3: 测试数据导出功能<br>✅ AC4: 测试 Teacher 上帝视角<br>✅ AC5: 测试系统配置和日志功能<br>✅ AC6: 生成测试报告 |

#### 变量声明

**配置变量**
```
test_framework: string = "playwright" // 测试框架
test_timeout_ms: integer = 30000 // 测试超时时间（毫秒）
report_format: string = "html" // 报告格式
```

**输入变量**
```
test_scenario: string // 测试场景
test_data: object // 测试数据
```

**输出变量**
```
test_result: object // 测试结果（passed, failed, duration）
test_report: string // 测试报告
```

**状态变量**
```
test_running: boolean = False // 测试运行状态
test_passed: integer = 0 // 通过测试数
test_failed: integer = 0 // 失败测试数
```
| **QA-004** | P3 | `[QA]` | 🔴 **P1** | **执行全系统压力测试** | [QA-003] | ✅ AC1: 使用 k6 或 Locust 进行压力测试<br>✅ AC2: 模拟 50-100 人同时在线协作<br>✅ AC3: 测试实时同步延迟（< 100ms）<br>✅ AC4: 测试文件上传速度（50MB 文件）<br>✅ AC5: 生成性能测试报告 |

#### 变量声明

**配置变量**
```
load_testing_tool: string = "k6" // 压力测试工具
concurrent_users: integer = 100 // 并发用户数
test_duration_seconds: integer = 300 // 测试时长（秒）
sync_latency_threshold_ms: integer = 100 // 同步延迟阈值（毫秒）
```

**输入变量**
```
user_scenario: string // 用户场景
load_profile: object // 负载配置
```

**输出变量**
```
performance_metrics: object // 性能指标（latency, throughput, error_rate）
performance_report: string // 性能测试报告
```

**状态变量**
```
load_test_running: boolean = False // 压力测试运行状态
current_users: integer = 0 // 当前用户数
average_latency: float = 0.0 // 平均延迟
```
| **QA-005** | P3 | `[QA]` | 🟡 **P2** | **执行安全测试** | [QA-003] | ✅ AC1: 测试 JWT 认证安全性<br>✅ AC2: 测试 RBAC 权限控制<br>✅ AC3: 测试 SQL 注入和 XSS 攻击防护<br>✅ AC4: 测试 CORS 保护<br>✅ AC5: 生成安全测试报告 |

#### 变量声明

**配置变量**
```
security_test_framework: string = "owasp-zap" // 安全测试框架
```

**输入变量**
```
security_scenario: string // 安全测试场景
attack_vector: string // 攻击向量
```

**输出变量**
```
security_vulnerabilities: array // 安全漏洞列表
security_report: string // 安全测试报告
```

**状态变量**
```
security_test_running: boolean = False // 安全测试运行状态
vulnerabilities_found: integer = 0 // 发现的漏洞数
```
| **QA-006** | P3 | `[QA]` | 🟡 **P2** | **执行兼容性测试** | [QA-003] | ✅ AC1: 测试 Chrome 100+ 兼容性<br>✅ AC2: 测试 Edge 100+ 兼容性<br>✅ AC3: 测试 Firefox 100+ 兼容性<br>✅ AC4: 测试 Safari 16+ 兼容性<br>✅ AC5: 生成兼容性测试报告 |

#### 变量声明

**配置变量**
```
browsers: array = ["chrome", "edge", "firefox", "safari"] // 测试浏览器
browser_versions: object = {chrome: "100+", edge: "100+", firefox: "100+", safari: "16+"} // 浏览器版本
```

**输入变量**
```
browser_name: string // 浏览器名称
test_scenario: string // 测试场景
```

**输出变量**
```
compatibility_result: object // 兼容性测试结果（browser, passed, issues）
compatibility_report: string // 兼容性测试报告
```

**状态变量**
```
compatibility_test_running: boolean = False // 兼容性测试运行状态
browsers_tested: integer = 0 // 已测试浏览器数
```
| **QA-007** | P3 | `[QA]` | 🟢 **P3** | **执行用户验收测试 (UAT)** | [QA-004] | ✅ AC1: 邀请真实用户（学生、教师、Admin）参与测试<br>✅ AC2: 收集用户反馈<br>✅ AC3: 修复关键 Bug<br>✅ AC4: 生成 UAT 报告 |

#### 变量声明

**配置变量**
```
uat_duration_days: integer = 7 // UAT 时长（天）
feedback_collection_method: string = "survey" // 反馈收集方式
```

**输入变量**
```
user_role: string // 用户角色（student/teacher/admin）
feedback_data: object // 反馈数据
```

**输出变量**
```
user_feedback: array // 用户反馈列表
uat_report: string // UAT 报告
```

**状态变量**
```
uat_active: boolean = False // UAT 激活状态
feedback_collected: integer = 0 // 收集的反馈数
bugs_fixed: integer = 0 // 修复的 Bug 数
```

---

## 附录

### A. 任务依赖关系图

```
Phase 1: 基础设施与骨架
├── INFRA-001 → INFRA-002, INFRA-003, INFRA-004
├── INFRA-002 → BE-101
├── INFRA-004 → BE-101
├── BE-101 → BE-102, BE-107
├── BE-102 → BE-103, BE-104, BE-105, BE-106
├── BE-103 → BE-104, BE-105
├── BE-104 → BE-112, BE-113
├── BE-101, INFRA-002 → BE-108
├── BE-108 → BE-137, BE-138, BE-140
├── BE-137 → BE-139
├── BE-106, BE-107 → BE-107-1
├── INFRA-001 → FE-201
├── FE-201 → FE-202, FE-203, FE-204
├── FE-202 → FE-205
├── FE-203 → FE-205
├── FE-204 → FE-205
├── FE-205 → FE-206, FE-207, FE-208, FE-209, FE-210, FE-211
├── BE-106, BE-107 → FE-211-1
├── FE-211 → FE-211-1
├── FE-211-1 → FE-211-2
├── INFRA-003 → INFRA-005
├── INFRA-002 → INFRA-006
└── INFRA-006 → QA-001

Phase 2: 核心协作 MVP
├── BE-104 → BE-109
├── BE-107 → BE-111
├── BE-109 → BE-110
├── BE-104 → BE-112, BE-113
├── BE-106 → BE-114
├── BE-101 → BE-115
├── BE-115 → BE-139, BE-140, BE-141
├── BE-141 → BE-142
├── BE-142 → BE-143, BE-144
├── BE-104 → BE-116, BE-117
├── BE-102 → BE-118
├── BE-101, INFRA-002 → BE-119
├── BE-101 → BE-120
├── FE-211-1 → FE-212, FE-214, FE-215, FE-216
├── BE-107 → FE-212, FE-214
├── BE-109 → FE-212
├── BE-110 → FE-213
├── FE-212 → FE-213, FE-212-1, FE-212-2
├── FE-212-1 → FE-212-2
├── BE-108 → FE-215
├── BE-143, BE-144 → FE-216
├── BE-139 → FE-216-1
├── BE-140 → FE-216-2
├── FE-214 → FE-214-1, FE-214-2
├── FE-214-1 → FE-214-2
├── FE-208, BE-112 → FE-217
├── FE-207, BE-113 → FE-218
├── FE-210, BE-106 → FE-219
├── FE-206, BE-104 → FE-220
├── FE-215 → FE-221
├── FE-205, BE-103 → FE-222
├── FE-205, BE-105 → FE-223
├── FE-205, BE-103 → FE-224
├── FE-204, BE-118 → FE-225
├── FE-225, BE-118 → FE-226
├── FE-222 → FE-227
├── FE-201 → FE-228, FE-229, FE-230, FE-231
├── FE-210, FE-215 → FE-232
└── FE-232 → QA-002

Phase 3: 智能化与完善
├── BE-101, INFRA-004 → AI-301
├── AI-301, BE-108 → AI-302
├── AI-301 → AI-303, AI-305, AI-307, AI-308
├── AI-301, BE-106 → AI-304
├── AI-301 → AI-306
├── AI-301 → BE-121
├── AI-302, BE-135 → AI-309
├── AI-309, BE-111 → AI-310
├── AI-309 → AI-311
├── BE-108, INFRA-004 → BE-135
├── BE-135 → BE-136
├── BE-101 → BE-122
├── BE-143, BE-144 → BE-123
├── AI-304 → BE-124
├── BE-103 → BE-125, BE-126, BE-127
├── BE-101 → BE-128
├── BE-120 → BE-129
├── BE-106, BE-107 → BE-130
├── BE-108 → BE-131
├── BE-106 → BE-133
├── BE-102 → BE-134
├── FE-211-1, BE-121 → FE-233, FE-235
├── FE-211-1, BE-122 → FE-234
├── FE-216, BE-123 → FE-236
├── FE-223, BE-123 → FE-237
├── FE-224, BE-126 → FE-238
├── FE-224, BE-125 → FE-239
├── FE-224, BE-127 → FE-240
├── FE-233, BE-121 → FE-241, FE-242
├── FE-201 → FE-243
├── FE-203 → FE-244
├── FE-211 → FE-245, FE-246
├── FE-202 → FE-247
├── FE-216 → FE-248
├── BE-133, FE-202 → FE-249
├── FE-248 → QA-003
├── QA-003 → QA-004, QA-005, QA-006
└── QA-004 → QA-007
```

### B. 技术栈版本

#### 前端
| 技术实体 | 版本 |
|----------|------|
| Node.js | v20.x (LTS) |
| React | 18.3+ |
| TypeScript | 5.3+ |
| Vite | 5.0+ |
| Tailwind CSS | 3.4+ |
| Y.js | 13.6+ |
| Tldraw | 2.x |
| TipTap | 2.2+ |
| Next.js | 14.x |
| Zustand | 4.x |
| ShadcnUI | Latest |

#### 后端
| 技术实体 | 版本 |
|----------|------|
| Python | 3.12+ |
| FastAPI | 0.109+ |
| MongoDB | 7.0+ |
| Motor | 3.3+ |
| Socket.IO | Server 5.x / Client 4.x |
| LangChain | 1.2.0+ |
| Beanie | 1.23+ |
| Pydantic | 2.5+ |
| Pydantic-Settings | 2.1+ |

#### DevOps
| 技术实体 | 版本 |
|----------|------|
| Docker | 24.x |
| Docker Compose | 2.x |
| Nginx | 1.25+ |
| GitHub Actions | Latest |
| MinIO | Latest |
| Redis | 7.x |

#### 测试
| 技术实体 | 版本 |
|----------|------|
| Vitest | 1.x |
| Pytest | 7.x |
| Playwright | 1.40+ |
| React Testing Library | 14.x |

### C. 验收标准 (Definition of Done)

每个任务必须满足以下条件才能标记为完成：

1. **代码完成**：所有代码已编写并通过代码审查
2. **单元测试**：包含针对该功能的单元测试，且测试通过
3. **集成测试**：与其他模块集成后功能正常
4. **代码质量**：通过 ESLint、Pylint、Black、isort 等代码质量检查
5. **文档更新**：如有必要，更新相关文档（API 文档、README 等）
6. **无 Bug**：无已知 Bug 或已知 Bug 已记录到 Issue Tracker

### D. 优先级说明

| 优先级 | 图标 | 说明 | 示例 |
|--------|------|------|------|
| **P0** | 🔥 | Blocker: 基础设施、核心链路。不完成它，后面的都做不了 | 数据库连接、JWT 认证 |
| **P1** | 🔴 | Core: MVP 核心功能。不完成它，产品无法演示 | 白板绘图、文档编辑 |
| **P2** | 🟡 | Feature: 完整性功能。没有它产品也能用，但体验缺损 | 修改头像、导出 Excel |
| **P3** | 🟢 | Nice to have: 锦上添花 | UI 动效、暗黑模式切换 |

### E. 角色说明

| 角色 | 说明 | 典型任务 |
|------|------|----------|
| `[INFRA]` | 基础设施/DevOps (Docker, Nginx, CI/CD) | 初始化项目结构、配置 Docker、配置 CI/CD |
| `[BE]` | 后端 (FastAPI, Python, MongoDB) | 实现 API、数据库设计、业务逻辑 |
| `[FE]` | 前端 (Next.js, React, Tailwind) | 实现页面 UI、状态管理、交互逻辑 |
| `[AI]` | 算法与模型 (LangChain, Prompt Engineering) | 实现 AI 对话、RAG 检索、Prompt 优化 |
| `[QA]` | 质量保证 (E2E测试, 系统测试) | 执行 E2E 测试、压力测试、安全测试 |

### F. 术语表

| 术语 | 解释 |
|------|------|
| CRDT | Conflict-free Replicated Data Type，无冲突复制数据类型 |
| Y.js | 基于 CRDT 的实时协作框架 |
| WebSocket | 一种在单个 TCP 连接上进行全双工通信的协议 |
| Socket.IO | 基于 WebSocket 的实时通信库 |
| RAG | Retrieval-Augmented Generation，检索增强生成 |
| TTL | Time To Live，数据过期时间 |
| RBAC | Role-Based Access Control，基于角色的访问控制 |
| SSE | Server-Sent Events，服务器推送事件 |
| JWT | JSON Web Token，JSON 格式的令牌 |
| ODM | Object-Document Mapping，对象文档映射 |
| DoD | Definition of Done，完成定义 |
| E2E | End-to-End，端到端测试 |
| UAT | User Acceptance Testing，用户验收测试 |
| MVP | Minimum Viable Product，最小可行产品 |
| CI/CD | Continuous Integration/Continuous Deployment，持续集成/持续部署 |

### G. 参考资料

- System.md（技术设计文档）
- requirements.md（需求文档）
- designs.md（设计文档）
- FastAPI 官方文档
- Y.js 官方文档
- Tldraw 官方文档
- TipTap 官方文档
- LangChain 官方文档
- Next.js 官方文档
- ShadcnUI 官方文档
- Playwright 官方文档
