# AICSL 协作学习系统 - 设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2025-12-24 |
| 文档状态 | 正式版 |
| 关联文档 | System.md、requirements.md |

---

## 1. 系统架构设计

### 1.1 整体架构概述

本系统采用**模块化单体（Modular Monolith）**架构设计，结合**微前端组件化**思想，将前端划分为独立的业务模块。系统遵循**关注点分离（Separation of Concerns）**原则，将 UI 布局与业务逻辑剥离，将 HTTP 请求与 WebSocket 实时通信剥离，实现高内聚、低耦合的设计目标。

整体架构分为三个核心通信层：**REST API 层**负责处理传统 CRUD 操作，**实时协同层（WebSocket - Y.js）**专门处理白板、文档的高频同步，**即时通讯/AI 层（Socket.IO）**处理聊天室消息、成员状态通知及 AI 流式响应。这种分层设计确保了各层职责清晰，便于独立扩展和维护。

系统采用**前后端分离**架构，前端使用 React 18.3+ 构建单页应用，后端使用 FastAPI 0.109+ 提供 RESTful API 和 WebSocket 服务。数据持久化采用 MongoDB 7.0+，缓存层使用 Redis，文件存储支持 MinIO（开发环境）和 AWS S3/阿里云 OSS（生产环境）。

### 1.2 技术栈版本

为确保兼容性和利用最新特性，建议锁定以下版本：

**前端技术栈**包括 Node.js v20.x LTS、React 18.3+、TypeScript 5.3+、Vite 5.0+、Tailwind CSS 3.4+、Y.js 13.6+、Tldraw 2.x、TipTap 2.2+。React 18.3+ 稳定支持并发渲染，暂不上 React 19 以免生态库未适配；Tldraw 2.x 对 React 18 支持最好，是白板核心组件的首选；TipTap 2.2+ 基于 ProseMirror，无头编辑器设计完美支持 Y.js 绑定。

**后端技术栈**包括 Python 3.12+、FastAPI 0.109+、MongoDB 7.0+、Motor 3.3+、Socket.IO Server 5.x / Client 4.x、LangChain 1.2.0+。Python 3.12+ 比 3.10 快 10-60%，对异步支持极好；MongoDB 7.0+ 必须 5.0+ 才能支持时序集合（用于行为流分析）；Motor 是 MongoDB 的异步驱动，完美配合 FastAPI。

### 1.3 通信架构设计

系统采用三层通信架构，每层处理不同类型的业务需求：

**REST API 层**基于 HTTP/HTTPS 协议，处理传统 CRUD 操作，包括用户认证、项目信息管理、日程安排、历史记录查询等。该层使用 FastAPI 框架，通过 Pydantic 进行数据校验，OpenAPI 自动生成接口文档。API 设计遵循 RESTful 规范，使用 JSON 格式进行数据交换，支持分页、排序、过滤等查询功能。

**实时协同层**基于 WebSocket 协议，使用 Y.js CRDT 技术处理白板、文档的高频同步。该层使用 ypy-websocket 作为服务器端组件，支持房间（Room）概念，每个项目对应一个协作房间。Y.js 的 CRDT 算法确保多用户同时编辑时的数据一致性，即使网络断开也能自动合并冲突。同步策略采用增量更新，每次用户操作只传输变更部分，减少网络带宽占用。

**即时通讯/AI 层**基于 Socket.IO 协议，处理聊天室消息、成员状态通知、AI 流式响应。Socket.IO 支持自动重连、断线检测、房间广播等特性，适合实时聊天场景。AI 响应使用 Server-Sent Events（SSE）协议，通过 Socket.IO 传输流式数据，实现打字机效果的文本展示。

### 1.4 代码仓库结构

系统采用 **Monorepo（单体仓库）** 结构，方便前后端共享类型定义和配置。仓库根目录包含 frontend（React 前端）、backend（FastAPI 后端）、shared（共享类型定义和 JSON Schema）、docker-compose.yml 等目录和文件。

```
/root
  /frontend          # React 前端项目
    /src
      /components    # 公共组件
      /pages         # 页面组件
      /hooks         # 自定义 Hooks
      /services      # API 服务封装
      /stores        # 状态管理
      /types         # TypeScript 类型定义
      /utils         # 工具函数
      /config        # 配置文件
  /backend           # FastAPI 后端项目
    /app
      /api           # API 路由
      /core          # 核心配置
      /models        # 数据模型
      /schemas       # Pydantic 模型
      /services      # 业务逻辑服务
      /db            # 数据库连接
      /utils         # 工具函数
  /shared            # 共享类型定义
  docker-compose.yml # Docker 编排配置
  package.json       # 前端依赖配置
  pyproject.toml     # 后端依赖配置（Poetry）
```

前后端由同一团队开发，Monorepo 结构方便从 FastAPI 生成的 OpenAPI 类型直接给前端使用，减少重复定义和数据不一致问题。分支策略采用 Feature Branch 或 Trunk Based Development，main 分支保持随时可部署状态。

---

## 2. 数据库设计

### 2.1 数据库概述

系统采用 MongoDB 作为主数据库，支持高频写入和复杂聚合查询。设计策略包括三个方面：**写优化**方面，对聊天、Y.js 快照、活动日志采用追加写模式；**读优化**方面，对项目结构、资源列表采用反范式化设计，冗余部分用户名和头像以减少连表查询；**时序数据**方面，活动日志和消息记录按时间索引，便于仪表盘分析。所有集合均建立适当的索引以优化查询性能。

MongoDB 版本要求 7.0+，以支持时序集合（Time Series Collection）和聚合管道优化等特性。时序集合特别适合存储行为日志这类按时间写入的数据，可以自动优化存储效率和查询性能。

### 2.2 用户与认证模块

**users 集合**存储核心用户信息，是系统的基础数据表。字段设计包括 username（用户名，唯一索引）、email（邮箱，唯一索引）、password_hash（密码哈希值）、avatar_url（头像 URL）、role（角色：student/teacher/admin）、settings（用户设置配置项，包含主题、语言、通知开关等）、created_at（创建时间）。角色字段采用枚举类型，确保数据一致性。

**refresh_tokens 集合**用于 JWT 令牌续期和即时黑名单机制。字段包括 user_id（关联用户 ID）、token_hash（令牌哈希值，用于快速查找）、expires_at（过期时间，TTL 索引自动删除）、is_revoked（是否已撤销，支持主动登出和令牌刷新时的旧令牌撤销）、device_info（设备信息，用于多设备管理）。TTL 索引确保过期令牌自动清理，减少数据库膨胀。

### 2.3 项目管理模块

**projects 集合**存储项目元数据，是协作空间的核心容器。字段包括 name（项目名称）、description（项目描述）、owner_id（创建者 ID）、members（成员列表数组，包含 user_id、role、joined_at）、progress（项目进度 0-100）、is_template（是否模板标记，复用 projects 集合存储模板）、created_at、updated_at。members 数组设计支持快速查询我参与的项目，owner_id 支持查询某教师创建的项目。

**tasks 集合**存储任务看板数据，对应左侧边栏的 MiniKanban 功能。字段包括 project_id（关联项目 ID）、title（任务标题）、column（任务列：todo/doing/done）、priority（优先级：low/medium/high）、assignees（负责人 ID 数组）、order（排序值，用于拖拽排序，支持 Lexorank 算法或浮点数方式）、due_date（截止日期）、created_at。通过 project_id 索引快速查询某项目的所有任务。

**calendar_events 集合**存储日程事件，对应日历视图功能。字段包括 project_id（关联项目 ID）、title（事件标题）、start_time（开始时间）、end_time（结束时间）、type（事件类型：meeting/deadline/personal）、created_by（创建者 ID）。通过 project_id 和 start_time 索引支持范围查询，获取指定时间范围内的事件。

### 2.4 班级管理模块

**courses 集合**存储班级信息，这是根据需求新增的集合，用于支持教师管理班级和学生加入班级的功能。字段包括 name（班级名称）、teacher_id（归属教师 ID）、semester（学期，如 2024-Spring）、invite_code（学生加入码，唯一索引）、students（学生 ID 数组）、created_at（创建时间）。indexes 包括 invite_code 唯一索引（用于学生加入班级）、teacher_id 索引（用于查询教师管理的班级）、students 索引（用于查询学生所在班级）。

教师拥有创建和管理班级的完整权限，创建班级时系统自动生成邀请码（6位随机字符串）。学生加入班级支持两种方式：**方式一**是邀请码加入（推荐），教师将 invite_code 发到微信群，学生输入码加入；**方式二**是 Excel 导入，教师上传学生名单（邮箱/学号），后台批量创建账号并关联到班级。

### 2.5 协作核心模块

**whiteboard_snapshots 集合**存储白板的二进制快照，使用 Y.js update vector 格式。字段包括 project_id（关联项目 ID，对应 room_id）、data（二进制数据，Y.js 编码状态）、snapshot_version（快照版本号）、created_at（创建时间）。策略是不存储每一步操作，而是由 Y-Websocket 定期（如每10秒）存一份全量快照，节省存储空间的同时确保可恢复性。

**documents 集合**存储协作文档元数据和内容快照。字段包括 project_id（关联项目 ID）、title（文档标题）、content_state（二进制数据，Y.js ProseMirror 状态）、preview_text（文档前50字，用于列表展示）、last_modified_by（最后修改者 ID）、updated_at（更新时间）。通过 project_id 索引查询某项目的所有文档。

**doc_comments 集合**存储文档评论线程，支持批注功能。字段包括 doc_id（关联文档 ID）、anchor_context（选中文本片段，用于定位）、status（状态：open/resolved）、messages（评论消息数组，包含 user_id、content、created_at）。通过 doc_id 索引快速查询某文档的所有评论。

### 2.6 资源与批注模块

**resources 集合**存储文件资源库元数据。字段包括 project_id（关联项目 ID）、filename（文件名）、file_key（S3 Object Key）、url（CDN URL）、size（文件大小字节数）、mime_type（MIME 类型）、uploaded_by（上传者 ID）、uploaded_at（上传时间）。file_key 设计为 projects/{project_id}/files/{file_id} 格式，支持对象存储的目录管理。

**web_annotations 集合**存储网页批注数据，对应浏览器批注功能。字段包括 project_id（关联项目 ID）、url_hash（URL 的 MD5 哈希）、target_url（原始 URL）、selector（选定位信息，包含 type、exact、prefix、suffix）、type（批注类型：highlight/sticky_note）、color（高亮颜色）、content（便签内容）、author_id（作者 ID）、created_at（创建时间）。通过 project_id 和 url_hash 索引支持快速查询某项目的所有批注。

### 2.7 AI 模块

**ai_personas 集合**存储 AI 角色配置，支持预设多种 AI 导师角色。字段包括 name（角色名称，如苏格拉底）、icon（角色图标）、system_prompt（系统提示词，定义角色行为和回答风格）、temperature（生成温度 0-2）、is_default（是否默认角色）、created_at。AI 角色由开发/运维人员通过后端配置文件管理，在 app/core/config.py 或数据库初始化脚本中预置标准角色。

**ai_conversations 集合**存储 AI 对话会话容器。字段包括 project_id（关联项目 ID）、user_id（用户 ID）、persona_id（角色 ID）、title（对话标题）、context_config（上下文配置，包含 use_whiteboard、use_docs 等布尔标记）、created_at。对话与会话分离设计，支持查看历史对话和管理对话上下文。

**ai_messages 集合**存储具体的对话消息记录。字段包括 conversation_id（会话 ID）、role（消息角色：user/assistant）、content（消息内容）、citations（引用来源数组，包含 resource_id、page）、feedback（用户反馈数据，包含 rating、comment）、created_at。feedback 字段支持 RLHF（基于人类反馈的强化学习）数据收集。

**ai_intervention_rules 集合**存储 AI 自动干预规则配置，支持 Admin 通过后台动态修改规则。字段包括 name（规则名称）、description（规则描述）、type（规则类型：silence_detection/emotion_detection/keyword_trigger）、enabled（是否启用）、priority（优先级数值，越大优先级越高）、conditions（触发条件，根据 type 不同而不同）、action（干预动作，包含 type、message）、created_by（创建者 ID）、created_at、updated_at。conditions 字段设计：silence_detection 包含 inactivity_minutes（无操作时间阈值），emotion_detection 包含 negative_words（负面词汇数组）和 consecutive_count（连续出现次数），keyword_trigger 包含 keywords（触发关键词数组）。

### 2.8 学习分析模块

**activity_logs 集合**存储行为日志原始数据，是仪表盘的数据源。字段包括 project_id（项目 ID）、user_id（用户 ID）、module（模块：whiteboard/document/chat）、action（操作类型：edit/view/upload/comment）、target_id（操作对象 ID）、duration（持续时长秒数）、timestamp（时间戳）。这是高频写入集合，通过 project_id、user_id、timestamp 复合索引优化查询性能。日志数据支持 TTL 索引，365天后自动删除。

**analytics_daily_stats 集合**存储每日统计缓存，避免每次打开仪表盘都进行大规模聚合计算。字段包括 project_id（项目 ID）、user_id（用户 ID）、date（日期字符串）、stats（统计数据对象，包含 code_lines、doc_words、chat_messages、study_minutes 等指标）、last_updated（最后更新时间）。通过定时任务每日凌晨聚合前一天的 activity_logs 数据写入此集合。

### 2.9 即时通讯模块

**chat_logs 集合**存储群组聊天记录。字段包括 project_id（项目 ID）、user_id（发送者 ID）、content（消息内容）、message_type（消息类型：text/system/ai）、created_at（创建时间）。消息永久保存，用于分析小组协作活跃度和社交网络图谱。system 类型消息用于新成员加入通知、任务截止提醒等系统通知。

---

## 3. API 接口设计

### 3.1 认证模块

**POST /api/auth/login** 实现用户登录功能。请求体包含 email/username/phone（任选一种方式）、password，返回 JWT 访问令牌和刷新令牌。登录成功后根据用户角色跳转到不同页面：Student → 主页面，Teacher → 教师管理页面，Admin → Admin 管理后台。

**POST /api/auth/refresh** 实现令牌刷新功能。请求体包含 refresh_token，返回新的访问令牌。刷新令牌机制确保用户无需频繁输入密码，同时支持令牌黑名单实现主动登出。

**POST /api/auth/logout** 实现登出功能。请求头携带访问令牌，服务端将对应的刷新令牌标记为已撤销，实现即时失效。

**POST /api/auth/password/reset-request** 实现密码重置请求。请求体包含 email，服务端发送重置链接到用户邮箱。链接包含一次性令牌，有效期 1 小时。

**POST /api/auth/password/reset** 实现密码重置确认。请求体包含 token 和新密码，验证令牌有效性后更新密码。

### 3.2 用户管理模块

**GET /api/users/me** 获取当前用户信息。返回用户基本资料、角色、设置等信息。

**PUT /api/users/me** 更新当前用户信息。支持更新 username、avatar_url、settings 等字段。

**GET /api/users** 获取用户列表（Admin/Teacher 权限）。支持分页、角色过滤、班级过滤等查询参数。

**POST /api/users** 创建用户账号（Admin/Teacher 权限）。请求体包含 username、email/phone、role、class_id（可选）等字段。支持批量创建，通过上传 Excel/CSV 文件实现批量导入。

**GET /api/users/{user_id}** 获取指定用户详情。返回用户基本信息、参与项目列表、学习仪表盘数据等。

**PUT /api/users/{user_id}** 更新指定用户信息（Admin 权限）。支持更新角色、班级等信息。

**DELETE /api/users/{user_id}** 删除用户账号（Admin 权限）。软删除或硬删除，保留数据完整性。

**POST /api/users/{user_id}/password/reset** 重置用户密码（Admin/Teacher 权限）。生成临时密码或直接重置为初始密码格式。

**POST /api/users/{user_id}/ban** 封禁用户账号（Admin 权限）。设置封禁状态和封禁原因。

**POST /api/users/{user_id}/unban** 解封用户账号（Admin 权限）。

### 3.3 班级管理模块

**GET /api/courses** 获取当前教师的班级列表。返回班级名称、学生数量、创建时间等信息。

**POST /api/courses** 创建班级。请求体包含 name、semester 等字段，返回班级信息和邀请码。

**GET /api/courses/{course_id}** 获取班级详情。返回班级信息、学生列表、关联项目等。

**PUT /api/courses/{course_id}** 更新班级信息。支持修改班级名称、描述等。

**DELETE /api/courses/{course_id}** 删除班级。

**GET /api/courses/{course_id}/students** 获取班级学生列表。

**POST /api/courses/{course_id}/students** 添加学生到班级。支持两种方式：输入邀请码加入、批量导入 Excel。

**DELETE /api/courses/{course_id}/students/{student_id}** 从班级移除学生。

**POST /api/courses/join** 学生加入班级。请求体包含 invite_code，验证后将该学生 ID 添加到班级 students 数组。

### 3.4 项目管理模块

**GET /api/projects** 获取当前用户的项目列表。支持分页、状态过滤（进行中/已归档）等。

**POST /api/projects** 创建项目。请求体包含 name、description 等字段，创建者被认定为 Owner。

**GET /api/projects/{project_id}** 获取项目详情。返回项目信息、成员列表、进度等。

**PUT /api/projects/{project_id}** 更新项目信息（Owner 权限）。支持修改项目名称、描述、归档状态等。

**DELETE /api/projects/{project_id}** 删除项目（Owner 权限）。

**POST /api/projects/{project_id}/members** 邀请成员。请求体包含 user_id 或 email，支持通过链接邀请。

**DELETE /api/projects/{project_id}/members/{member_id}** 移除成员（Owner 权限）。

**PUT /api/projects/{project_id}/members/{member_id}/role** 修改成员角色。支持 Viewer/Editor/Owner 角色转换，Owner 转让需要特殊处理。

**POST /api/projects/{project_id}/archive** 归档项目。

**POST /api/projects/{project_id}/restore** 恢复归档项目。

### 3.5 任务管理模块

**GET /api/projects/{project_id}/tasks** 获取项目任务列表。按 column 分组返回，支持排序。

**POST /api/projects/{project_id}/tasks** 创建任务。请求体包含 title、column、priority、assignees、due_date 等字段。

**GET /api/tasks/{task_id}** 获取任务详情。

**PUT /api/tasks/{task_id}** 更新任务信息。支持修改标题、优先级、负责人、截止日期等。

**PUT /api/tasks/{task_id}/column** 更新任务列。用于拖拽排序时的列变更。

**PUT /api/tasks/{task_id}/order** 更新任务排序。order 值使用 Lexorank 算法计算。

**DELETE /api/tasks/{task_id}** 删除任务。

### 3.6 日程管理模块

**GET /api/projects/{project_id}/calendar** 获取项目日程列表。支持按月份查询，返回每日事件列表。

**POST /api/projects/{project_id}/calendar** 创建日程事件。请求体包含 title、start_time、end_time、type 等字段。

**GET /api/calendar/{event_id}** 获取日程详情。

**PUT /api/calendar/{event_id}** 更新日程信息。

**DELETE /api/calendar/{event_id}** 删除日程。

### 3.7 文档管理模块

**GET /api/projects/{project_id}/documents** 获取项目文档列表。返回文档标题、最后修改时间、预览文本等。

**POST /api/projects/{project_id}/documents** 创建文档。返回文档 ID 和初始内容。

**GET /api/documents/{doc_id}** 获取文档详情。返回文档元数据和当前内容状态。

**PUT /api/documents/{doc_id}** 更新文档元数据。修改标题等信息。

**DELETE /api/documents/{doc_id}** 删除文档。

**GET /api/documents/{doc_id}/comments** 获取文档评论列表。

**POST /api/documents/{doc_id}/comments** 添加评论。

**DELETE /api/documents/{doc_id}/comments/{comment_id}** 删除评论。

**POST /api/documents/{doc_id}/versions** 创建文档版本快照。

**GET /api/documents/{doc_id}/versions** 获取文档版本历史。

### 3.8 白板管理模块

**GET /api/projects/{project_id}/whiteboard/snapshot** 获取白板最新快照。返回 Y.js 编码的二进制数据。

**POST /api/projects/{project_id}/whiteboard/snapshot** 保存白板快照（服务端定时任务调用）。

**GET /api/projects/{project_id}/whiteboard/versions** 获取白板版本历史。

**POST /api/projects/{project_id}/whiteboard/versions/{version_id}/restore** 恢复白板到指定版本。

### 3.9 资源管理模块

**GET /api/projects/{project_id}/resources** 获取项目资源列表。返回文件名、大小、上传者、上传时间等。

**POST /api/projects/{project_id}/resources/upload** 上传文件。使用 multipart/form-data 格式，支持拖拽上传。

**GET /api/resources/{resource_id}** 获取资源详情。返回元数据和下载链接。

**DELETE /api/resources/{resource_id}** 删除资源。

**GET /api/resources/{resource_id}/preview** 获取资源预览。对于 PDF、图片等支持在线预览。

### 3.10 浏览器批注模块

**GET /api/projects/{project_id}/annotations** 获取项目批注列表。支持按 URL 过滤。

**POST /api/projects/{project_id}/annotations** 创建批注。请求体包含 target_url、selector、type、color、content 等字段。

**GET /api/annotations/{annotation_id}** 获取批注详情。

**PUT /api/annotations/{annotation_id}** 更新批注内容。

**DELETE /api/annotations/{annotation_id}** 删除批注。

**POST /api/browser/fetch** 后端代理获取网页内容。请求体包含 url，返回清洗后的 HTML 内容。

**浏览器批注功能实现细节**：

**后端抓取实现**：

使用 Playwright (Python版) 进行网页抓取。Playwright 可以启动无头浏览器（Headless Browser），等待 DOM 渲染完成再获取 HTML，确保能够正确处理 JavaScript 渲染的内容。

```python
from playwright.async_api import async_playwright
from readability_lxml import Document
from bs4 import BeautifulSoup
import hashlib

async def fetch_webpage_content(url: str) -> dict:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            html_content = await page.content()
            
            url_hash = hashlib.md5(url.encode()).hexdigest()
            
            doc = Document(html_content)
            cleaned_html = doc.summary()
            
            soup = BeautifulSoup(cleaned_html, 'html.parser')
            
            for tag in soup(['script', 'iframe', 'object', 'style']):
                tag.decompose()
            
            for tag in soup.find_all():
                tag.attrs = {k: v for k, v in tag.attrs.items() 
                             if k not in ['onclick', 'onload', 'onerror']}
            
            final_html = str(soup)
            
            return {
                "success": True,
                "url": url,
                "url_hash": url_hash,
                "title": doc.title(),
                "content": final_html,
                "excerpt": doc.short_title()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__
            }
        finally:
            await browser.close()
```

**内容清洗策略**：

1. **抓取阶段**：Playwright 获取页面完整 innerHTML，等待网络空闲状态（networkidle），确保所有动态内容加载完成
2. **提取阶段**：使用 readability-lxml (Python 库) 提取核心正文，自动去除广告、导航栏、侧边栏等无关内容
3. **清洗阶段**：移除所有 `<script>`, `<iframe>`, `<object>`, `<style>` 标签，禁用所有 `onclick`, `onload`, `onerror` 事件，确保安全性
4. **注入阶段**：注入前端高亮脚本，然后返回给前端 Tab 4 的 iframe

**外链兜底机制**：

采用 HTTP 状态码驱动的 UI 降级策略。当后端抓取超时或返回 403/404 等错误时，API 返回 502 Bad Gateway。前端收到 502 后，在 Tab 4 显示一个友好的错误提示卡片，提供"在新标签页访问"的链接。

```python
from fastapi import HTTPException

@app.post("/api/browser/fetch")
async def fetch_webpage(request: WebFetchRequest):
    try:
        result = await fetch_webpage_content(request.url)
        
        if not result["success"]:
            if "TimeoutError" in result["error_type"]:
                raise HTTPException(status_code=502, detail="抓取超时")
            elif "404" in str(result["error"]):
                raise HTTPException(status_code=502, detail="网页不存在")
            else:
                raise HTTPException(status_code=502, detail="无法在阅读模式下打开")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail="抓取失败")
```

**前端 UI 降级实现**：

```typescript
const handleFetchWebpage = async (url: string) => {
  try {
    const response = await fetch('/api/browser/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (response.status === 502) {
      const error = await response.json();
      setShowErrorCard({
        title: '无法在阅读模式下打开',
        message: error.detail || '该网页无法在阅读模式下打开',
        originalUrl: url
      });
      return;
    }
    
    const data = await response.json();
    setWebpageContent(data);
  } catch (error) {
    setShowErrorCard({
      title: '网络错误',
      message: '请检查网络连接后重试',
      originalUrl: url
    });
  }
};
```

**高亮脚本注入**：

后端在清洗后的 HTML 中注入前端高亮脚本，支持用户在网页内容上进行批注和高亮操作。

```python
def inject_highlight_script(html: str, project_id: str, url_hash: str) -> str:
    script = f"""
    <script>
    window.AICSL_ANNOTATION_CONFIG = {{
        projectId: '{project_id}',
        urlHash: '{url_hash}',
        apiEndpoint: '/api/projects/{project_id}/annotations'
    }};
    </script>
    <script src="/static/js/annotation-highlight.js"></script>
    """
    return html.replace('</body>', script + '</body>')
```

### 3.11 AI 模块

**GET /api/ai/personas** 获取可用 AI 角色列表。

**POST /api/ai/conversations** 创建 AI 对话会话。请求体包含 persona_id、context_config 等字段。

**GET /api/ai/conversations** 获取对话会话列表。

**GET /api/ai/conversations/{conversation_id}** 获取会话详情和消息历史。

**POST /api/ai/conversations/{conversation_id}/messages** 发送消息。返回流式响应，支持 SSE 协议。

**DELETE /api/ai/conversations/{conversation_id}** 删除对话会话。

**GET /api/ai/intervention/rules** 获取 AI 干预规则列表（Admin 权限）。

**POST /api/ai/intervention/rules** 创建 AI 干预规则（Admin 权限）。

**PUT /api/ai/intervention/rules/{rule_id}** 更新规则（Admin 权限）。

**DELETE /api/ai/intervention/rules/{rule_id}** 删除规则（Admin 权限）。

### 3.12 仪表盘模块

**GET /api/dashboard/project/{project_id}** 获取项目仪表盘数据。返回团队贡献、学习时长、任务完成度、活跃度等统计。

**GET /api/dashboard/user/{user_id}** 获取用户个人仪表盘数据（本人或 Teacher/Admin 权限）。

**GET /api/dashboard/activity** 获取行为流记录。支持分页、时间范围过滤。

**POST /api/dashboard/export** 导出仪表盘数据。请求体包含 export_format（csv/json/excel）、date_range、data_type 等参数。后端使用 Pandas + OpenPyXL 生成 Excel 文件，支持多 Sheet 报表。

### 3.13 系统管理模块（Admin）

**GET /api/admin/stats** 获取系统统计信息。包括用户数量、项目数量、活跃度等。

**GET /api/admin/logs** 获取系统日志。支持分页、时间范围过滤、日志级别过滤。

**GET /api/admin/config** 获取系统配置。

**PUT /api/admin/config** 更新系统配置（Admin 权限）。支持修改 LLM API Key、存储配额等参数。

**POST /api/admin/users/{user_id}/promote** 提升用户为 Teacher（Admin 权限）。

**POST /api/admin/users/{user_id}/demote** 降级用户为 Student（Admin 权限）。

---

## 4. WebSocket 设计

### 4.1 双通道架构总览

系统采用**双通道 WebSocket 架构**，将实时通信职责分离到两个独立的通道，确保不同类型的数据流互不干扰，提升系统稳定性和性能。

**通道 A: 信令通道 (Socket.IO)**
- **职责**: 处理低频、高语义的消息（聊天、在线状态、协同光标位置广播、WebRTC 信令）。
- **路径**: `/socket.io/`
- **鉴权**: 握手阶段（Handshake）通过 `auth: { token }` 传递 JWT。
- **命名空间 (Namespace)**: `/collaboration` (隔离业务)。
- **房间 (Rooms)**:
  - `project_{id}`: 项目级广播（如：成员加入）。
  - `user_{id}`: 定向通知（如：私信、系统警告）。

**通道 B: 数据通道 (Y-Websocket)**
- **职责**: 独占处理 Y.js 的二进制增量更新（CRDT Updates），确保白板和文档的原子级同步。
- **路径**: `/ysocket/{room_name}`
- **鉴权**: URL Query 参数 `?token=...` (WebSocket 协议限制，无法自定义 Header)。
- **房间策略**:
  - 白板: `wb:{project_id}`
  - 文档: `doc:{document_id}`

**架构优势**:
- **职责分离**: 信令通道处理业务逻辑，数据通道专注于高频同步，避免互相阻塞。
- **性能优化**: Y-Websocket 专为 CRDT 设计，二进制协议传输效率高。
- **可扩展性**: 两个通道可独立扩展，数据通道可单独部署到高性能节点。
- **容错性**: 一个通道故障不影响另一个通道，提升系统可用性。

### 4.2 消息格式规范 (Socket.IO)

| **事件名 (Event)** | **方向** | **Payload 示例** | **说明** |
| --- | --- | --- | --- |
| `join_room` | Client->Server | `{ "room_id": "proj_1" }` | 加入项目房间 |
| `leave_room` | Client->Server | `{ "room_id": "proj_1" }` | 离开房间 |
| `send_message` | Client->Server | `{ "content": "Hello", "type": "text" }` | 发送聊天 |
| `new_message` | Server->Client | `{ "sender": {...}, "content": "..." }` | 广播新消息 |
| `sync_cursor` | Client->Server | `{ "x": 100, "y": 200, "tab": "wb" }` | 广播鼠标位置 |
| `cursor_update` | Server->Client | `{ "user_id": "...", "x": 100, "y": 200 }` | 同步他人光标 |
| `user_joined` | Server->Client | `{ "user_id": "...", "username": "..." }` | 用户加入通知 |
| `user_left` | Server->Client | `{ "user_id": "..." }` | 用户离开通知 |
| `ai_intervention` | Server->Client | `{ "type": "keyword", "message": "..." }` | AI 干预触发 |
| `webrtc_signal` | Client->Server | `{ "target_id": "...", "signal": {...} }` | WebRTC 信令 |
| `webrtc_signal` | Server->Client | `{ "from_id": "...", "signal": {...} }` | 转发 WebRTC 信令 |

### 4.3 Y-Websocket 数据通道

**服务集成方式**：Y-Websocket 集成到 FastAPI 应用中（Mounting），使用 ypy-websocket 提供的 ASGI app，通过 `app.mount("/ysocket", yjs_app)` 挂载到 FastAPI 应用。这种集成方式共享 FastAPI 的 Auth 中间件（鉴权方便），减少运维复杂度。

**连接端点**：`ws://host:port/ysocket/{room_name}?token={jwt_token}`

**房间命名规范**：
- 白板房间：`wb:{project_id}`
- 文档房间：`doc:{document_id}`
- 资源库不需要实时协同

**消息格式**（Y.js Sync Protocol）：
```
// Step 1: Client 连接成功后发送 SyncStep1
{
  "type": "sync",
  "action": "step1",
  "data": <Y.js encoded state>
}

// Step 2: Server 回复 SyncStep2
{
  "type": "sync",
  "action": "step2",
  "data": <Y.js encoded state>
}

// Step 3: 后续增量更新
{
  "type": "sync",
  "action": "update",
  "data": <Y.js update vector>
}

// Awareness 同步（用户状态）
{
  "type": "awareness",
  "data": <client awareness state>
}
```

**快照保存策略**：采用防抖（Debounce）+ 环境变量配置方式。在 .env 中设置 `YJS_SNAPSHOT_INTERVAL=10`（秒）。内存中缓存 update 数据，当有数据写入时启动计时器；如果在 10 秒内又有新数据，重置计时器；直到 10 秒内无操作，或者距离上次保存超过 60 秒（强制），才写入 MongoDB。这种策略平衡了实时性和服务器负载。

**冲突解决机制**：Y.js 内置 CRDT（自动解决）。CRDT 算法保证了只要所有客户端最终收到了所有 update binary，它们的状态就是一致的。网络断开重连后，Y.js 客户端会自动向服务端请求丢失的 updates 并合并，无需人工干预。

**同步策略**：客户端每次操作生成 Y.js update，通过 WebSocket 广播给同一房间的所有用户。服务端接收更新后暂存内存，按照快照保存策略定期写入 MongoDB 快照集合。客户端连接时首先获取最新快照，然后应用增量更新。

**Awareness 同步**：用户的鼠标位置、选中文本、在线状态等通过 Awareness 协议同步。服务端作为中转站，将一方的 Awareness 状态广播给其他用户。离线时自动清除 Awareness 记录。

### 4.4 Socket.IO 信令通道

**连接端点**：`/socket.io/`（HTTP upgrade）

**命名空间**：`/collaboration`（统一命名空间，通过房间隔离业务）

**房间设计**：
- 项目房间：`project_{project_id}`（项目级广播）
- 用户房间：`user_{user_id}`（定向通知）

**连接管理**：服务端维护用户连接状态映射，用户加入房间时注册，离线时自动清理。Socket.IO 自动处理断线重连，重连成功后自动重新加入之前的房间。

**鉴权机制**：
```python
# Socket.IO 握手鉴权
@socketio.on("connect")
async def handle_connect(sid, environ, auth):
    token = auth.get("token")
    user = await verify_jwt_token(token)
    if not user:
        return False  # 拒绝连接
    await save_connection(sid, user.id)
```

### 4.5 AI 流式响应

**触发方式**：
- 聊天中 @AI 或输入 /ai
- 右侧边栏 AI 快捷助手
- Tab 5 AI 导师全屏界面

**通信架构**：采用分离通道设计。Socket.IO 仅用于聊天、状态同步；SSE（HTTP Streaming）专用于 AI 回答。AI 对话使用标准的 `POST /api/v1/ai/chat/stream`，返回 `text/event-stream`。

**流式响应实现**：
1. 客户端发送消息到 `/api/v1/ai/chat/stream`
2. 服务端调用 LangChain 链式处理
3. OpenAI 流式返回 Token，通过 SSE 逐个发送
4. 客户端使用 EventSource 监听，逐字显示（打字机效果）
5. 消息发送完成后，服务端保存到 ai_messages 集合

**错误处理**：SSE Event Types 设计。流式响应不仅发文本，还发事件类型。正常块：`event: delta\ndata: "你好"`。错误块：`event: error\ndata: "OpenAI API Timeout"`。前端 EventSource 监听 error 事件并弹窗提示。

**上下文管理**：前端显式传递 IDs，后端隐式检索。前端请求体：`{ "messages": [...], "context_file_ids": ["file_A", "file_B"] }`。后端根据 IDs 去向量数据库（或简单的全文检索）找相关段落，拼接到 System Prompt 中。

**AI 自动干预规则实现**：
- **规则配置方式**：不开发专门的 UI 页面，通过 Swagger API 直接管理。Admin 使用 `/api/ai/intervention/rules` 系列接口创建、更新、删除规则。
- **规则执行机制**：
  - 事件驱动：针对"情绪检测"和"关键词触发"，在 Socket.IO 的 `handle_message` 函数中，消息入库前，先过一遍简单的正则匹配或情绪分析函数。如果命中，直接触发 AI 回复任务。
  - 定时轮询：针对"沉默检测"，使用 APScheduler（Python 库），每 15 分钟扫描一次 projects 表中 `last_activity_time` 超过阈值的活跃项目。
- **规则优先级处理**：采用短路逻辑（关键词 High > 情绪 Medium > 沉默 Low），一旦触发高优先级规则，立即执行干预并停止后续检查。每个项目设置 `last_intervention_time`，防止 AI 在 5 分钟内连续插话两次，避免打扰用户。

---

## 5. 前端架构设计

### 5.1 组件层次结构

前端采用 **Next.js App Router** 架构，按照职责划分为以下层级：

**Layout Layer (`app/layout.tsx`)**: 全局 Providers (Auth, Theme, Toast)。负责提供全局上下文和配置，包括认证状态管理、主题切换、全局通知等。所有页面共享此布局，确保一致性。

**Page Layer (`app/project/[id]/page.tsx`)**: 负责获取路由参数，初始化项目上下文。通过 `useParams` 获取项目 ID，调用 API 获取项目详情，初始化 Y.js 连接和 Socket.IO 连接。页面层作为容器，组织 Feature Containers 的渲染。

**Feature Containers**:
- `ProjectLayout`: 负责 Grid 布局 (Left/Main/Right)。管理左侧边栏、主内容区、右侧边栏的显示和折叠状态，响应式适配不同屏幕尺寸。
- `WhiteboardContainer`: 懒加载 Tldraw，初始化 Yjs Provider。使用 `dynamic import` 延迟加载白板组件，减少首屏加载时间。初始化 Y.js Provider 连接到 `wb:{project_id}` 房间。
- `EditorContainer`: 初始化 TipTap，绑定 Collaboration Extension。配置 TipTap 编辑器，启用协同编辑功能，连接到 `doc:{document_id}` 房间。
- `ChatContainer`: 管理聊天消息列表和输入框，初始化 Socket.IO 连接。
- `DashboardContainer`: 管理仪表盘数据展示，调用学习分析 API。

**UI Atoms (`components/ui`)**: 纯展示组件 (Button, Input)，无业务逻辑。使用 ShadcnUI 库提供的组件，基于 Radix UI + Tailwind CSS，提供无障碍访问和高度可定制性。这些组件不依赖业务逻辑，可独立测试和复用。

### 5.2 状态管理

**全局状态 (Zustand)**: 管理跨组件共享的状态，包括当前用户信息、当前项目 ID、当前激活的 Tab、侧栏展开状态、主题设置等。Zustand 相比 Redux 更简洁，适合中小型项目。

```typescript
// stores/useProjectStore.ts
interface ProjectStore {
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  activeTab: 'whiteboard' | 'document' | 'resources' | 'browser' | 'ai' | 'dashboard';
  setActiveTab: (tab: string) => void;
  leftSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  rightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  activeTab: 'whiteboard',
  setActiveTab: (tab) => set({ activeTab: tab as any }),
  leftSidebarOpen: true,
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  rightSidebarOpen: true,
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
}));
```

**服务器状态 (React Query)**: 管理异步数据获取和缓存，包括项目列表、用户信息、统计数据等。React Query 自动处理加载状态、缓存策略、重试逻辑，减少样板代码。

```typescript
// hooks/useProjects.ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/v1/projects');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/projects/${projectId}`);
      return response.json();
    },
    enabled: !!projectId,
  });
}
```

**协作状态 (Y.js)**: 管理实时协作相关的状态，包括白板数据、文档内容、光标位置、选中状态、在线状态等。与 Y.js Awareness API 集成，实现多用户实时协同。

```typescript
// hooks/useYjsWhiteboard.ts
export function useYjsWhiteboard(projectId: string) {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const yprovider = new WebsocketProvider(
      `ws://${window.location.host}/ysocket/wb:${projectId}`,
      'whiteboard',
      ydoc
    );

    setDoc(ydoc);
    setProvider(yprovider);

    return () => {
      ydoc.destroy();
      yprovider.destroy();
    };
  }, [projectId]);

  return { doc, provider };
}
```

**本地状态 (useState/useReducer)**: 管理组件内部状态，如表单数据、UI 状态（展开/折叠、弹窗显示）等。

### 5.3 路由设计

**路由架构**：采用 Next.js App Router（Next.js 14+），使用 Next.js 原生的文件系统路由（app/page.tsx、app/projects/[id]/page.tsx）。路由守卫通过 middleware.ts 或 layout.tsx 中的 AuthContext 检查实现。

**路由结构**：
```
/login -> 登录页面
/register -> 注册页面（暂不开放）

/ -> 主页面（Student 协作工作台）
  /projects -> 项目列表
  /projects/[id] -> 项目详情
    /[tab] -> 功能 Tab (whiteboard/document/resources/browser/ai/dashboard)

/teacher -> 教师管理页面
  /courses -> 班级管理
  /students -> 学生列表
  /templates -> 课程/模板管理
  /monitor -> 学生项目监控
  /dashboard -> 学生仪表盘

/admin -> Admin 管理后台
  /users -> 用户管理
  /config -> 系统配置
  /logs -> 系统日志
```

**嵌套路由**：项目详情页面使用嵌套路由，实现 Tab 切换时保持 URL 同步，支持浏览器前进/后退按钮。Tab 切换使用 CSS display:none 或 React Offscreen API 保持组件状态，避免 WebSocket 断开重连。

```typescript
// app/projects/[id]/[tab]/page.tsx
export default function ProjectTabPage({ params }: { params: { id: string; tab: string } }) {
  const { id, tab } = params;
  const { setActiveTab } = useProjectStore();

  useEffect(() => {
    setActiveTab(tab);
  }, [tab, setActiveTab]);

  return <ProjectLayout projectId={id} activeTab={tab} />;
}
```

**路由守卫**：通过 Next.js middleware.ts 实现全局路由守卫，检查用户认证状态和角色权限。未登录用户重定向到 /login，无权限用户返回 403 页面。

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const path = request.nextUrl.pathname;

  // 未登录用户重定向到登录页
  if (!token && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 教师页面权限检查
  if (path.startsWith('/teacher')) {
    const user = await getUserFromToken(token);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Admin 页面权限检查
  if (path.startsWith('/admin')) {
    const user = await getUserFromToken(token);
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}
```

### 5.4 组件通信

**Props Drilling**: 适用于少量层级的父子组件通信，传递简单数据（如项目 ID、用户信息）。

**Context API**: 适用于全局状态管理，如认证状态、主题设置、语言设置等。

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Zustand**: 适用于跨组件状态管理，如当前项目、Tab 状态、侧栏展开状态等。

**Y.js Awareness**: 适用于实时协作状态，如光标位置、选中状态、在线状态等。

```typescript
// hooks/useAwareness.ts
export function useAwareness(provider: WebsocketProvider) {
  const [awarenessStates, setAwarenessStates] = useState<any[]>([]);

  useEffect(() => {
    const updateAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setAwarenessStates(states);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    return () => {
      provider.awareness.off('change', updateAwareness);
    };
  }, [provider]);

  const setLocalState = (state: any) => {
    provider.awareness.setLocalStateField('user', state);
  };

  return { awarenessStates, setLocalState };
}
```

### 5.5 性能优化

**懒加载 (React.lazy, dynamic import)**: 延迟加载大型组件，减少首屏加载时间。

```typescript
// 动态导入白板组件
const Whiteboard = dynamic(() => import('@/components/Whiteboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // 白板组件不支持 SSR
});

// 动态导入编辑器组件
const Editor = dynamic(() => import('@/components/Editor'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

**虚拟滚动 (react-window)**: 优化长列表渲染性能，只渲染可视区域内的元素。

```typescript
import { FixedSizeList } from 'react-window';

function MessageList({ messages }: { messages: Message[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageItem message={messages[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**防抖/节流 (lodash)**: 优化高频事件处理，如搜索输入、滚动事件等。

```typescript
import { debounce } from 'lodash';

function SearchInput() {
  const [query, setQuery] = useState('');

  const debouncedSearch = debounce((value: string) => {
    // 执行搜索 API 调用
    searchProjects(value);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

**代码分割 (Code Splitting)**: 使用 Next.js 的动态导入功能，按路由分割代码，减少初始加载体积。

**图片优化 (next/image)**: 使用 Next.js 的 Image 组件，自动优化图片大小和格式，支持懒加载。

### 5.6 页面布局设计

**Student 主页面**采用 Grid 布局，分为三个区域：

左侧边栏宽度 280px（可收起），主内容区占剩余空间的 70%，右侧边栏宽度 320px（可收起）。侧栏收起后主内容区自动扩展。

```typescript
// components/ProjectLayout.tsx
export function ProjectLayout({ projectId, activeTab }: ProjectLayoutProps) {
  const { leftSidebarOpen, rightSidebarOpen } = useProjectStore();

  return (
    <div className="h-screen grid grid-cols-[280px_1fr_320px]">
      {leftSidebarOpen && <LeftSidebar projectId={projectId} />}
      <MainContent projectId={projectId} activeTab={activeTab} />
      {rightSidebarOpen && <RightSidebar projectId={projectId} />}
    </div>
  );
}
```

**教师管理页面**采用两列布局，左侧导航栏宽度 30%，右侧主要内容区宽度 70%。左侧导航固定显示，右侧内容区根据选中导航动态切换。

**Admin 管理后台**同样采用两列布局，结构与教师管理页面一致。

---

## 6. 后端架构设计

### 6.1 模块化单体架构

后端采用 **模块化单体（Modular Monolith）** 架构，将应用划分为独立的模块，每个模块包含自己的路由、服务、模型和依赖。这种架构既保持了单体应用的部署简单性，又具备微服务的模块化优势。

**架构优势**：
- **开发效率高**：无需跨服务通信，调试和测试更简单
- **部署成本低**：单一 Docker 容器，运维复杂度低
- **性能优异**：无网络调用开销，直接内存访问
- **易于演进**：模块边界清晰，未来可拆分为微服务

**模块划分**：
- **认证模块**：用户登录、注册、JWT 令牌管理
- **用户模块**：用户信息管理、角色权限
- **项目模块**：项目 CRUD、成员管理、权限控制
- **任务模块**：任务看板、任务分配、状态管理
- **日程模块**：日历事件、提醒通知
- **文档模块**：文档 CRUD、协同编辑
- **白板模块**：白板数据管理、实时同步
- **资源模块**：文件上传、资源管理、批注
- **AI 模块**：AI 对话、RAG 检索、自动干预
- **分析模块**：行为日志、学习分析、仪表盘
- **导出模块**：数据导出、报表生成

### 6.2 代码组织 (Directory Structure)

```
backend/app/
├── api/
│   └── v1/
│       ├── endpoints/        # 路由层：解析参数，调用 Service
│       │   ├── auth.py       # 认证相关端点
│       │   ├── users.py      # 用户管理端点
│       │   ├── projects.py   # 项目管理端点
│       │   ├── tasks.py      # 任务管理端点
│       │   ├── calendar.py   # 日程管理端点
│       │   ├── documents.py  # 文档管理端点
│       │   ├── whiteboard.py # 白板管理端点
│       │   ├── resources.py  # 资源管理端点
│       │   ├── ai.py         # AI 相关端点
│       │   ├── dashboard.py  # 仪表盘端点
│       │   └── admin.py      # 管理后台端点
│       └── deps.py           # 依赖注入：get_current_user, get_db
├── core/                     # 核心配置
│   ├── config.py             # Pydantic 配置（环境变量）
│   ├── security.py          # JWT 安全相关
│   └── logger.py             # 日志配置
├── models/                   # Beanie ODM 模型定义
│   ├── user.py               # 用户模型
│   ├── project.py            # 项目模型
│   ├── task.py               # 任务模型
│   ├── calendar_event.py     # 日程事件模型
│   ├── document.py           # 文档模型
│   ├── whiteboard.py         # 白板模型
│   ├── resource.py           # 资源模型
│   ├── ai_message.py         # AI 消息模型
│   ├── activity_log.py       # 行为日志模型
│   └── analytics.py          # 分析统计模型
├── schemas/                  # Pydantic DTO 数据验证
│   ├── user.py               # 用户相关 Schema
│   ├── project.py            # 项目相关 Schema
│   ├── task.py               # 任务相关 Schema
│   ├── calendar.py           # 日程相关 Schema
│   ├── document.py           # 文档相关 Schema
│   ├── whiteboard.py         # 白板相关 Schema
│   ├── resource.py           # 资源相关 Schema
│   ├── ai.py                 # AI 相关 Schema
│   └── dashboard.py          # 仪表盘相关 Schema
├── services/                 # 业务逻辑层：事务处理、复杂计算
│   ├── auth_service.py       # 认证服务
│   ├── project_service.py    # 项目服务
│   ├── task_service.py       # 任务服务
│   ├── ai_service.py         # AI 服务
│   ├── analytics_service.py  # 分析服务
│   ├── export_service.py     # 导出服务
│   └── notification_service.py # 通知服务
├── websockets/               # Socket.IO 和 Y-Websocket 的处理逻辑
│   ├── ywebsocket.py         # Y-Websocket 处理
│   └── socketio.py           # Socket.IO 处理
├── db/                       # 数据库连接
│   ├── mongo.py              # MongoDB 连接
│   └── redis.py              # Redis 连接
├── utils/                    # 工具函数
│   ├── helpers.py            # 通用工具函数
│   └── validators.py         # 自定义验证器
├── main.py                   # FastAPI 应用入口
└── lifespan.py               # 应用生命周期管理
```

### 6.3 依赖注入 (Dependency Injection)

后端采用 FastAPI 的依赖注入系统，实现组件解耦和测试友好。

**核心依赖**：
- `get_db()`：提供 MongoDB 数据库连接（依赖 Motor）
- `get_redis()`：提供 Redis 连接（依赖 aioredis）
- `get_current_user()`：解析 JWT 令牌，返回当前用户
- `require_role(roles: List[Role])`：检查用户角色权限
- `check_permission(min_role: str)`：检查项目级权限

**依赖注入示例**：
```python
# api/v1/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.mongo import get_db
from app.models.user import User
from app.core.security import verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return User(**user)

def check_permission(min_role: str = "viewer"):
    async def dependency(
        project_id: str,
        current_user: User = Depends(get_current_user),
        db = Depends(get_db)
    ):
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")
        
        # 检查 Teacher 权限继承
        if current_user.role == "teacher" and project.get("course_id") in current_user.courses:
            return current_user
        
        # 检查项目成员权限
        member = next((m for m in project["members"] if m["user_id"] == current_user.id), None)
        if not member:
            raise HTTPException(status_code=403, detail="无权限访问该项目")
        
        role_hierarchy = {"viewer": 1, "editor": 2, "owner": 3}
        if role_hierarchy.get(member["role"], 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(status_code=403, detail="权限不足")
        
        return current_user
    return dependency
```

### 6.4 路由层 (Endpoints Layer)

路由层负责解析 HTTP 请求参数，调用 Service 层处理业务逻辑，返回响应。

**路由示例**：
```python
# api/v1/endpoints/projects.py
from fastapi import APIRouter, Depends
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService
from app.api.v1.deps import get_current_user, check_permission
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends()
):
    return await project_service.create_project(project_data, current_user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(check_permission("viewer")),
    project_service: ProjectService = Depends()
):
    return await project_service.get_project(project_id)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(check_permission("owner")),
    project_service: ProjectService = Depends()
):
    return await project_service.update_project(project_id, project_data)

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(check_permission("owner")),
    project_service: ProjectService = Depends()
):
    await project_service.delete_project(project_id)
    return {"message": "项目已删除"}
```

### 6.5 服务层 (Service Layer)

服务层包含业务逻辑，处理事务、复杂计算、外部 API 调用等。

**服务示例**：
```python
# services/project_service.py
from typing import List
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.project import Project
from app.models.user import User

class ProjectService:
    def __init__(self, db):
        self.db = db
    
    async def create_project(self, project_data: ProjectCreate, owner_id: str) -> ProjectResponse:
        project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=owner_id,
            members=[{
                "user_id": owner_id,
                "role": "owner",
                "joined_at": datetime.utcnow()
            }]
        )
        result = await self.db.projects.insert_one(project.dict())
        project.id = result.inserted_id
        return ProjectResponse(**project.dict())
    
    async def get_project(self, project_id: str) -> ProjectResponse:
        project = await self.db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise ValueError("项目不存在")
        return ProjectResponse(**project)
    
    async def update_project(self, project_id: str, project_data: ProjectUpdate) -> ProjectResponse:
        update_data = project_data.dict(exclude_unset=True)
        await self.db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        return await self.get_project(project_id)
    
    async def delete_project(self, project_id: str):
        await self.db.projects.delete_one({"_id": ObjectId(project_id)})
```

### 6.6 模型层 (Models Layer)

模型层定义数据结构，使用 Beanie ODM 进行 MongoDB 操作。

**模型示例**：
```python
# models/project.py
from beanie import Document, PydanticObjectId
from datetime import datetime
from typing import List, Optional

class Member(BaseModel):
    user_id: PydanticObjectId
    role: str  # owner, editor, viewer
    joined_at: datetime

class Project(Document):
    name: str
    description: Optional[str] = None
    owner_id: PydanticObjectId
    members: List[Member] = []
    progress: int = 0
    is_template: bool = False
    course_id: Optional[PydanticObjectId] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "projects"
        indexes = [
            "owner_id",
            "members.user_id",
            "course_id",
        ]
```

### 6.7 Schema 层 (Schemas Layer)

Schema 层定义数据验证模型，使用 Pydantic 进行请求和响应数据的验证。

**Schema 示例**：
```python
# schemas/project.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MemberSchema(BaseModel):
    user_id: str
    role: str
    joined_at: datetime

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    progress: Optional[int] = Field(None, ge=0, le=100)

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    members: List[MemberSchema]
    progress: int
    is_template: bool
    course_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### 6.2 认证服务

**JWT 令牌设计**：
- 访问令牌（Access Token）：有效期 30 分钟，Payload 包含 user_id、role、token_id
- 刷新令牌（Refresh Token）：有效期 7 天，存储在 refresh_tokens 集合

**密码处理**：使用 bcrypt 算法哈希存储密码，禁用明文存储。批量创建用户时使用初始密码格式（username + "123"）。

**权限管理细化**：
- **项目级权限**：在 projects 集合的 members 数组中，role 字段的具体值为：
  - owner：教师、组长（CRUD 项目，管理成员）
  - editor：组员（编辑文档/白板，上传资源）
  - viewer：访客（仅查看）
- **权限继承**：Teacher 在班级中的权限如何映射到项目中的权限？数据库不硬存 "Teacher 是所有项目的 owner"，而是进行逻辑层面的动态判断：
  ```python
  if user.role == 'teacher' and project.course_id in user.courses:
      return "owner"  # 老师自动获得 owner 权限
  else:
      return db.lookup_project_role(user.id)
  ```
- **API 权限控制**：基于依赖注入的 RBAC。编写一个 `deps.check_permission(min_role="editor")`。在 Router 中使用：
  ```python
  async def delete_file(user = Depends(check_permission("owner"))):
      ...
  ```

**权限装饰器**：
```python
def require_auth(func):
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        return await func(*args, current_user, **kwargs)
    return wrapper

def require_roles(*roles: Role):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if current_user.role not in roles:
                raise HTTPException(status_code=403, detail="权限不足")
            return await func(*args, current_user, **kwargs)
        return wrapper
    return decorator

def check_permission(min_role: str = "viewer"):
    async def dependency(
        project_id: str,
        current_user: User = Depends(get_current_user),
        db: AsyncIOMotorClient = Depends(get_db)
    ):
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")
        
        # 检查 Teacher 权限继承
        if current_user.role == "teacher" and project.get("course_id") in current_user.courses:
            return current_user
        
        # 检查项目成员权限
        member = next((m for m in project["members"] if m["user_id"] == current_user.id), None)
        if not member:
            raise HTTPException(status_code=403, detail="无权限访问该项目")
        
        role_hierarchy = {"viewer": 1, "editor": 2, "owner": 3}
        if role_hierarchy.get(member["role"], 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(status_code=403, detail="权限不足")
        
        return current_user
    return dependency
```

### 6.3 AI 服务

**服务设计**：集成 OpenAI API（GPT-4o）和 Ollama（Llama 3），通过环境变量 `AI_PROVIDER` 切换。使用 LangChain 构建链式处理，支持 RAG 检索增强生成。

**RAG 实现**：
1. 用户上传资源（PDF/DOCX）到资源库
2. 后台异步任务提取文本内容，生成向量存储到向量数据库（Milvus/Pgvector）
3. 用户提问时，先检索相关段落，再将检索结果作为上下文传给 LLM

**流式响应**：使用 SSE 协议输出 LLM 生成的内容。FastAPI 通过 `StreamingResponse` 实现，支持异步迭代器输出。

**AI 角色管理**：角色配置预置在代码或数据库初始化脚本中，不提供运行时编辑接口。系统启动时加载到内存，响应请求时使用。

### 6.4 分析服务

**日志收集**：前端通过 `navigator.sendBeacon` 发送行为日志，后端接收后缓存到内存缓冲区，达到阈值（如 100 条或 5 秒）后批量写入 MongoDB。

**统计计算**：每日凌晨执行定时任务，聚合前一天的 activity_logs 数据，计算每个用户的学习时长、贡献度、活跃度等指标，写入 analytics_daily_stats 集合。

**仪表盘查询**：优先从 analytics_daily_stats 获取聚合数据，实时数据从 activity_logs 聚合（限制时间范围减少计算量）。

### 6.5 导出服务

**实现方式**：后端使用 Pandas 处理数据，OpenPyXL 生成 Excel 文件。

**同步下载策略**：

采用同步下载方式，用户点击导出按钮后立即下载文件。为了平衡用户体验和服务器性能，限制导出数据的时间范围为最近 3 个月，防止超时和内存溢出。用户体验流程为：点击按钮 → Loading 转圈（约 2-5 秒）→ 浏览器弹出保存框。

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.services.export_service import ExportService
from app.core.deps import get_current_user, check_permission
from app.models.user import User

router = APIRouter()

@router.post("/api/dashboard/export")
async def export_dashboard_data(
    export_format: str,
    date_range: DateRange,
    data_type: str,
    current_user: User = Depends(check_permission("teacher"))
):
    export_service = ExportService()
    
    start_date = datetime.now() - timedelta(days=90)
    if date_range.start_date < start_date:
        raise HTTPException(
            status_code=400, 
            detail="仅支持导出最近 3 个月的数据"
        )
    
    if export_format == "csv":
        return await export_service.export_csv(data_type, date_range)
    elif export_format == "excel":
        return await export_service.export_excel(data_type, date_range)
    elif export_format == "json":
        return await export_service.export_json(data_type, date_range)
    else:
        raise HTTPException(status_code=400, detail="不支持的导出格式")
```

**StreamingResponse 流式响应**：

为了避免大数据量导出时内存溢出，使用 StreamingResponse 实现流式响应。不要把整个 Excel 生成在内存里，而是使用 BytesIO 作为缓冲区，边生成边写入 HTTP Response 流。

```python
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse

class ExportService:
    async def export_excel(self, data_type: str, date_range: DateRange):
        buffer = BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            if data_type == "activity_logs":
                df = await self._fetch_activity_logs(date_range)
                df.to_excel(writer, sheet_name='行为日志', index=False)
                
                summary_df = self._generate_summary(df)
                summary_df.to_excel(writer, sheet_name='统计汇总', index=False)
            
            elif data_type == "grades":
                df = await self._fetch_grades(date_range)
                df.to_excel(writer, sheet_name='成绩单', index=False)
        
        buffer.seek(0)
        
        filename = f"{data_type}_{date_range.start_date}_to_{date_range.end_date}.xlsx"
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
```

**导出权限控制**：

仅 Teacher 和 Admin 可以导出数据，学生无权导出全组行为数据（涉及隐私）。通过 RBAC 中间件实现权限检查。

```python
from fastapi import Depends
from app.core.deps import check_permission

@router.post("/api/dashboard/export")
async def export_dashboard_data(
    export_format: str,
    date_range: DateRange,
    data_type: str,
    current_user: User = Depends(check_permission("teacher"))
):
    pass
```

**格式支持**：
- CSV：通过 `df.to_csv()` 生成，适合简单数据
- Excel：通过 `df.to_excel()` 生成，支持多 Sheet（如成绩单 + 详细日志）
- JSON：通过 `df.to_json()` 生成，适合科研数据备份

**V2 优化方向**：

如果未来数据量极大，可以改为"生成后发送下载链接"的异步方式：
1. 用户点击导出 → 创建异步任务 → 返回任务 ID
2. 后台 Celery 执行导出 → 上传到 MinIO/S3
3. 用户轮询任务状态 → 完成后提供下载链接

**任务队列**：大量数据导出使用 Celery 异步任务，避免阻塞 API 线程。Redis 作为 Celery Broker。

### 6.6 WebSocket 服务

**Y-Websocket 服务**：使用 ypy-websocket 库，监听 WebSocket 连接，管理房间状态。连接时验证用户权限（通过 JWT 令牌）。

**Socket.IO 服务**：使用 python-socketio 库，实现聊天和 AI 消息的实时通信。房间与项目绑定，支持广播和私聊。

**连接管理**：维护用户 ID 到 Socket ID 的映射，支持向特定用户推送消息（如 AI 干预通知）。

---

## 7. 实时协作设计

### 7.1 Y.js CRDT 原理

Y.js 是一个基于 CRDT（Conflict-free Replicated Data Type）的实时协作框架，确保多用户同时编辑时的数据一致性。核心特性包括：

**数据类型**：Y.js 提供多种数据类型，包括 Y.Map（键值对）、Y.Array（数组）、Y.Text（文本）、Y.XmlFragment（XML 片段）等。TipTap 使用 Y.Text 存储文档内容，Tldraw 使用 Y.Map 存储白板数据。

**状态同步**：每次用户操作生成 Update（增量更新），包含操作类型和受影响的数据范围。Update 通过 WebSocket 广播给其他用户，接收方应用 Update 后与本地状态合并。

**冲突解决**：CRDT 算法确保最终状态一致，无论操作顺序如何。例如，两个用户同时编辑同一位置，Y.js 自动合并内容（通常使用位置偏移处理）。

### 7.2 Y-Websocket 服务器集成

**集成方式**：将 Y-Websocket 服务器集成到 FastAPI 应用中，使用 `ypy-websocket` 提供的 ASGI app，通过 `app.mount("/ysocket", yjs_app)` 挂载。这种方式共享 FastAPI 的 Auth 中间件（鉴权方便），减少运维复杂度。

**集成代码实现**：

```python
from fastapi import FastAPI
from ypy_websocket import YpyWebSocket
from app.core.security import verify_token

yjs_app = YpyWebSocket()

async def yjs_auth(request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    user = await verify_token(token)
    return user

yjs_app.auth = yjs_auth

app = FastAPI()
app.mount("/ysocket", yjs_app)
```

**房间管理**：每个项目对应一个 Y.js 房间，房间 ID 为 `project:{project_id}`。文档和白板使用不同的子房间：
- 文档房间：`project:{project_id}:doc:{document_id}`
- 白板房间：`project:{project_id}:wb:{whiteboard_id}`

### 7.3 快照保存策略

**防抖 + 环境变量配置**：

在 `.env` 中设置 `YJS_SNAPSHOT_INTERVAL=10`（秒）。内存中缓存 update 数据，当有数据写入时启动计时器；如果在 10 秒内又有新数据，重置计时器；直到 10 秒内无操作，或者距离上次保存超过 60 秒（强制），才写入 MongoDB。

**防抖实现代码**：

```python
import asyncio
from datetime import datetime, timedelta
from typing import Dict
from app.core.config import settings

class SnapshotManager:
    def __init__(self):
        self.pending_snapshots: Dict[str, asyncio.Task] = {}
        self.last_snapshot_time: Dict[str, datetime] = {}
        self.snapshot_interval = settings.YJS_SNAPSHOT_INTERVAL
        self.force_save_interval = 60

    async def schedule_snapshot(self, room_id: str, ydoc: Y.Doc):
        if room_id in self.pending_snapshots:
            self.pending_snapshots[room_id].cancel()

        task = asyncio.create_task(self._debounced_save(room_id, ydoc))
        self.pending_snapshots[room_id] = task

    async def _debounced_save(self, room_id: str, ydoc: Y.Doc):
        await asyncio.sleep(self.snapshot_interval)

        last_save = self.last_snapshot_time.get(room_id)
        now = datetime.now()

        if last_save and (now - last_save).total_seconds() < self.force_save_interval:
            return

        await self._save_snapshot(room_id, ydoc)
        self.last_snapshot_time[room_id] = now

    async def _save_snapshot(self, room_id: str, ydoc: Y.Doc):
        snapshot = ydoc.get_update()
        await WhiteboardSnapshot(
            room_id=room_id,
            data=snapshot,
            created_at=datetime.now()
        ).save()

snapshot_manager = SnapshotManager()
```

**快照恢复机制**：

用户连接时，首先获取最新快照，然后应用快照之后的所有增量 Update，恢复到最新状态。

```python
async def restore_ydoc(room_id: str) -> Y.Doc:
    ydoc = Y.Doc()

    snapshot = await WhiteboardSnapshot.find_one(
        {"room_id": room_id},
        sort=[("created_at", -1)]
    )

    if snapshot:
        Y.applyUpdate(ydoc, snapshot.data)

    return ydoc
```

### 7.4 冲突解决机制

**Y.js 内置 CRDT 自动解决**：

CRDT 算法保证了只要所有客户端最终收到了所有 update binary，它们的状态就是一致的。网络重连后，Y.js 客户端会自动向服务端请求丢失的 updates 并合并。

**网络重连处理**：

```typescript
import { WebsocketProvider } from 'y-websocket';

const provider = new WebsocketProvider(
  'ws://localhost:8000/ysocket',
  `project:${projectId}:wb:${whiteboardId}`,
  ydoc,
  {
    connect: true,
    reconnect: true,
    maxRetries: 10,
    retryDelay: 1000,
  }
);

provider.on('status', (event: { status: string }) => {
  if (event.status === 'connected') {
    console.log('Y.js connected');
  } else if (event.status === 'disconnected') {
    console.log('Y.js disconnected');
  }
});

provider.on('sync', (isSynced: boolean) => {
  if (isSynced) {
    console.log('Y.js synced with server');
  }
});
```

**离线编辑支持**：

Y.js 支持离线编辑，用户在离线状态下可以继续编辑，所有操作会缓存到本地 IndexedDB。当网络恢复后，Y.js 会自动同步所有离线操作。

```typescript
import { IndexeddbPersistence } from 'y-indexeddb';

const idbPersistence = new IndexeddbPersistence(
  `project:${projectId}:wb:${whiteboardId}`,
  ydoc
);

idbPersistence.on('synced', () => {
  console.log('Data synced from IndexedDB');
});
```

### 7.5 白板同步设计

**数据结构**：白板数据存储为 Y.Map，包含 nodes（节点）和 edges（边）两个 Y.Array。

```typescript
const ydoc = new Y.Doc();
const yWhiteboard = ydoc.getMap('whiteboard');

const yNodes = ydoc.getArray('nodes');
const yEdges = ydoc.getArray('edges');

yNodes.push([
  { id: 'node1', type: 'rectangle', x: 100, y: 200, content: '...' },
  { id: 'node2', type: 'circle', x: 300, y: 400, content: '...' }
]);

yEdges.push([
  { id: 'edge1', from: 'node1', to: 'node2' }
]);
```

**同步流程**：
1. 用户 A 创建节点 → 生成 Update A1
2. Update A1 发送到 Y-Websocket 服务器
3. 服务器广播 Update A1 给房间内所有用户（包括用户 B）
4. 用户 B 接收 Update A1，更新本地 Y.Map
5. Tldraw 监听 Y.Map 变化，重新渲染画布

**Tldraw 集成代码**：

```typescript
import { Editor } from 'tldraw';
import { useEffect, useRef } from 'react';
import { WebsocketProvider } from 'y-websocket';

function CollaborativeWhiteboard({ projectId, whiteboardId }: Props) {
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:8000/ysocket',
      `project:${projectId}:wb:${whiteboardId}`,
      ydoc
    );

    const yStore = ydoc.getMap('store');

    provider.on('sync', (synced: boolean) => {
      if (synced) {
        const storeSnapshot = yStore.get('store');
        if (storeSnapshot && editorRef.current) {
          editorRef.current.loadStoreSnapshot(storeSnapshot);
        }
      }
    });

    const handleStoreChange = () => {
      if (editorRef.current) {
        const storeSnapshot = editorRef.current.getStoreSnapshot();
        yStore.set('store', storeSnapshot);
      }
    };

    return () => {
      provider.disconnect();
    };
  }, [projectId, whiteboardId]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Editor
        onMount={(editor) => {
          editorRef.current = editor;
          editor.registerExternalContentHandler('yjs', handleStoreChange);
        }}
      />
    </div>
  );
}
```

**鼠标位置同步**：通过 Y.js Awareness 协议同步。用户移动鼠标时，更新 Awareness 状态中的 cursor 字段。服务器广播 Awareness 更新后，其他用户看到光标移动。

```typescript
provider.awareness.setLocalStateField('user', {
  name: user.name,
  color: user.color,
  cursor: { x: 100, y: 200 }
});

provider.awareness.on('change', () => {
  const states = Array.from(provider.awareness.getStates().values());
  states.forEach((state) => {
    if (state.user && state.user.cursor) {
      renderRemoteCursor(state.user);
    }
  });
});
```

### 7.6 文档同步设计

**数据结构**：TipTap 使用 Y.ProseMirror 扩展，将 Y.js 数据类型映射到 ProseMirror 文档模型。

```typescript
import { Editor } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const editor = new Editor({
  extensions: [
    StarterKit,
    Collaboration.configure({
      document: ydoc,
    }),
    CollaborationCursor.configure({
      provider: provider,
      user: {
        name: user.name,
        color: user.color,
      },
    }),
  ],
});
```

**同步流程**：与白板类似，用户的每次编辑（输入、删除、格式化）生成 Y.js Update，通过 WebSocket 同步。

**冲突处理**：ProseMirror 处理编辑冲突，Y.js 处理同步冲突。对于并发编辑同一位置，Y.js 使用索引位置标记，合并后的内容可能与预期不同（取决于具体实现）。

**文档快照保存**：

```python
async def save_document_snapshot(document_id: str, ydoc: Y.Doc):
    snapshot = ydoc.get_update()
    await DocumentSnapshot(
        document_id=document_id,
        data=snapshot,
        created_at=datetime.now()
    ).save()
```

### 7.7 性能优化

**Update 压缩**：Y.js 的 Update 是二进制格式，体积小，传输效率高。对于大型文档，可以启用增量压缩。

**批量更新**：用户快速输入时，Y.js 会将多个操作合并为一个 Update，减少网络传输次数。

**本地优先**：所有操作先更新本地状态，再发送到服务器。即使网络延迟，用户也能立即看到自己的操作。

**选择性同步**：对于大型白板，可以只同步可视区域内的元素，减少数据传输量。

```typescript
import { observeDeep } from 'yjs';

yWhiteboard.observeDeep((events) => {
  events.forEach((event) => {
    if (event.path.includes('nodes')) {
      const visibleNodes = getVisibleNodes(yNodes.toArray());
      syncVisibleNodes(visibleNodes);
    }
  });
});
```

---

## 8. AI 功能设计

### 8.1 AI 服务架构

**服务设计**：集成 OpenAI API（GPT-4o）和 Ollama（Llama 3），通过环境变量 `AI_PROVIDER` 切换。使用 LangChain 构建链式处理，支持 RAG 检索增强生成。

**多模型支持**：

```python
from langchain.llms import OpenAI
from langchain_community.llms import Ollama
from app.core.config import settings

class AIService:
    def __init__(self):
        if settings.AI_PROVIDER == "openai":
            self.llm = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                model="gpt-4o",
                temperature=0.7
            )
        elif settings.AI_PROVIDER == "ollama":
            self.llm = Ollama(
                base_url=settings.OLLAMA_BASE_URL,
                model="llama3"
            )
        else:
            raise ValueError(f"Unsupported AI provider: {settings.AI_PROVIDER}")
```

**AI 角色管理**：角色配置预置在代码或数据库初始化脚本中，不提供运行时编辑接口。系统启动时加载到内存，响应请求时使用。

```python
AI_PERSONAS = {
    "tutor": {
        "name": "学习导师",
        "system_prompt": "你是一位经验丰富的学习导师，擅长帮助学生理解复杂概念，提供学习建议。",
        "icon": "🎓"
    },
    "assistant": {
        "name": "项目助手",
        "system_prompt": "你是一位项目管理助手，擅长组织任务、规划时间、协调团队。",
        "icon": "📋"
    },
    "reviewer": {
        "name": "内容审核",
        "system_prompt": "你是一位内容审核专家，擅长检查文档的准确性、完整性和可读性。",
        "icon": "✅"
    }
}
```

### 8.2 RAG 实现架构

**RAG 工作流程**：

1. 用户上传资源（PDF/DOCX）到资源库
2. 后台异步任务提取文本内容，生成向量存储到向量数据库（Milvus/Pgvector）
3. 用户提问时，先检索相关段落，再将检索结果作为上下文传给 LLM

**文本提取实现**：

```python
import pypdf
from docx import Document
from typing import List

class TextExtractor:
    @staticmethod
    def extract_from_pdf(file_path: str) -> str:
        text = ""
        with open(file_path, 'rb') as file:
            reader = pypdf.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text()
        return text

    @staticmethod
    def extract_from_docx(file_path: str) -> str:
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text

    @staticmethod
    def extract_text(file_path: str) -> str:
        if file_path.endswith('.pdf'):
            return TextExtractor.extract_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            return TextExtractor.extract_from_docx(file_path)
        else:
            raise ValueError("Unsupported file format")
```

**向量嵌入实现**：

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Milvus
from app.core.config import settings

class VectorStoreService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY
        )
        self.vector_store = Milvus(
            embedding_function=self.embeddings,
            connection_args={
                "host": settings.MILVUS_HOST,
                "port": settings.MILVUS_PORT
            },
            collection_name="resources"
        )

    async def add_document(self, resource_id: str, text: str):
        chunks = self._split_text(text)
        self.vector_store.add_texts(
            texts=chunks,
            metadatas=[{"resource_id": resource_id} for _ in chunks]
        )

    async def search(self, query: str, top_k: int = 5) -> List[dict]:
        results = self.vector_store.similarity_search(
            query=query,
            k=top_k
        )
        return [
            {
                "content": doc.page_content,
                "resource_id": doc.metadata["resource_id"]
            }
            for doc in results
        ]

    def _split_text(self, text: str, chunk_size: int = 500) -> List[str]:
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks
```

**RAG 链式处理**：

```python
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

class RAGService:
    def __init__(self, vector_store: VectorStoreService, llm):
        self.vector_store = vector_store
        self.llm = llm

    async def query(self, question: str, context_file_ids: List[str]) -> str:
        if context_file_ids:
            context = await self._retrieve_context(context_file_ids, question)
        else:
            context = ""

        prompt = self._build_prompt(question, context)
        response = await self.llm.apredict(prompt)
        return response

    async def _retrieve_context(self, file_ids: List[str], question: str) -> str:
        contexts = []
        for file_id in file_ids:
            results = await self.vector_store.search(question)
            contexts.extend([r["content"] for r in results])
        return "\n\n".join(contexts)

    def _build_prompt(self, question: str, context: str) -> str:
        if context:
            return f"""
            基于以下上下文信息回答问题：

            上下文：
            {context}

            问题：{question}

            如果上下文中没有相关信息，请基于你的知识回答。
            """
        else:
            return f"问题：{question}"
```

### 8.3 流式响应实现

**SSE 协议输出**：

使用 SSE 协议输出 LLM 生成的内容。FastAPI 通过 `StreamingResponse` 实现，支持异步迭代器输出。

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.services.rag_service import RAGService

router = APIRouter()

@router.post("/api/v1/ai/chat/stream")
async def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    rag_service = RAGService()
    
    async def generate():
        try:
            async for chunk in rag_service.stream_query(
                request.messages,
                request.context_file_ids
            ):
                yield f"event: delta\ndata: {chunk}\n\n"
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

**流式查询实现**：

```python
from langchain.chat_models import ChatOpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

class RAGService:
    async def stream_query(self, messages: List[dict], context_file_ids: List[str]):
        context = await self._retrieve_context(context_file_ids, messages[-1]["content"])
        prompt = self._build_prompt(messages[-1]["content"], context)

        chat = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model="gpt-4o",
            streaming=True,
            callbacks=[StreamingCallbackHandler()]
        )

        async for chunk in chat.astream(prompt):
            yield chunk.content

class StreamingCallbackHandler:
    async def on_llm_new_token(self, token: str, **kwargs):
        yield token
```

**前端 EventSource 监听**：

```typescript
function useAIChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string, contextFileIds: string[]) => {
    setIsStreaming(true);

    const eventSource = new EventSource(
      `/api/v1/ai/chat/stream?conversation_id=${conversationId}`
    );

    eventSource.addEventListener('delta', (event) => {
      const chunk = event.data;
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + chunk }
          ];
        } else {
          return [...prev, { role: 'assistant', content: chunk }];
        }
      });
    });

    eventSource.addEventListener('done', () => {
      eventSource.close();
      setIsStreaming(false);
    });

    eventSource.addEventListener('error', (event) => {
      console.error('AI stream error:', event.data);
      eventSource.close();
      setIsStreaming(false);
    });

    await fetch('/api/v1/ai/conversations/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        context_file_ids: contextFileIds
      })
    });
  };

  return { messages, sendMessage, isStreaming };
}
```

### 8.4 AI 自动干预规则

**规则配置方式**：

不开发专门的 UI 页面，通过 Swagger API 直接管理。Admin 使用 `/api/ai/intervention/rules` 系列接口创建、更新、删除规则。

```python
from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional, Literal

class AIInterventionRule(Document):
    rule_name: str
    rule_type: Literal["keyword", "emotion", "silence"]
    trigger_config: dict
    priority: int = Field(default=1)
    intervention_message: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
```

**规则执行机制**：

- **事件驱动**：针对"情绪检测"和"关键词触发"，在 Socket.IO 的 `handle_message` 函数中，消息入库前，先过一遍简单的正则匹配或情绪分析函数。如果命中，直接触发 AI 回复任务。
- **定时轮询**：针对"沉默检测"，使用 APScheduler（Python 库），每 15 分钟扫描一次 projects 表中 `last_activity_time` 超过阈值的活跃项目。

**事件驱动实现**：

```python
import re
from textblob import TextBlob
from app.websocket.socketio_server import sio
from app.services.ai_service import AIService

@sio.on('message')
async def handle_message(sid, data):
    message = data['message']
    project_id = data['project_id']

    await save_message_to_db(message, project_id)

    rules = await AIInterventionRule.find(
        {"rule_type": {"$in": ["keyword", "emotion"]}, "is_active": True}
    ).to_list()

    for rule in sorted(rules, key=lambda r: r.priority, reverse=True):
        if rule.rule_type == "keyword":
            if re.search(rule.trigger_config["pattern"], message):
                await trigger_intervention(project_id, rule)
                break
        elif rule.rule_type == "emotion":
            blob = TextBlob(message)
            sentiment = blob.sentiment.polarity
            if sentiment < rule.trigger_config["threshold"]:
                await trigger_intervention(project_id, rule)
                break

async def trigger_intervention(project_id: str, rule: AIInterventionRule):
    project = await Project.get(project_id)
    last_intervention = project.last_intervention_time

    if last_intervention and (datetime.now() - last_intervention).total_seconds() < 300:
        return

    ai_service = AIService()
    response = await ai_service.send_intervention_message(
        project_id,
        rule.intervention_message
    )

    await sio.emit('ai_intervention', {
        "message": response,
        "rule_id": str(rule.id)
    }, room=f"project:{project_id}")

    project.last_intervention_time = datetime.now()
    await project.save()
```

**定时轮询实现**：

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=15)
async def check_silence_intervention():
    threshold = datetime.now() - timedelta(minutes=15)
    
    rules = await AIInterventionRule.find(
        {"rule_type": "silence", "is_active": True}
    ).to_list()

    for rule in rules:
        projects = await Project.find({
            "last_activity_time": {"$lt": threshold},
            "is_active": True
        }).to_list()

        for project in projects:
            last_intervention = project.last_intervention_time
            if last_intervention and (datetime.now() - last_intervention).total_seconds() < 300:
                continue

            await trigger_intervention(str(project.id), rule)

scheduler.start()
```

**规则优先级处理**：

采用短路逻辑（关键词 High > 情绪 Medium > 沉默 Low），一旦触发高优先级规则，立即执行干预并停止后续检查。每个项目设置 `last_intervention_time`，防止 AI 在 5 分钟内连续插话两次，避免打扰用户。

### 8.5 上下文管理

**前端显式传递 IDs**：

```typescript
interface ChatRequest {
  messages: Message[];
  context_file_ids: string[];
}

const request: ChatRequest = {
  messages: [
    { role: 'user', content: '请帮我总结这个文档' }
  ],
  context_file_ids: ['file_A', 'file_B']
};

fetch('/api/v1/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});
```

**后端隐式检索**：

后端根据 IDs 去向量数据库（或简单的全文检索）找相关段落，拼接到 System Prompt 中。

```python
async def build_context_prompt(file_ids: List[str], question: str) -> str:
    if not file_ids:
        return ""

    vector_store = VectorStoreService()
    contexts = []

    for file_id in file_ids:
        results = await vector_store.search(question, top_k=3)
        contexts.extend([r["content"] for r in results])

    if contexts:
        return f"""
        以下是与问题相关的文档内容：

        {chr(10).join([f"- {c}" for c in contexts])}

        请基于以上内容回答问题。
        """
    else:
        return ""
```

---

## 9. 部署设计

### 8.1 Docker 容器化

**前端镜像**：
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端镜像**：
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.in-project true
COPY . .
RUN poetry install --no-dev

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**单体容器部署架构**：

采用单体容器部署策略，不将 FastAPI、Y-Websocket、Socket.IO 拆分为独立的服务容器。一个 Docker 容器运行 `uvicorn main:app`，同时处理 HTTP、Socket.IO、Y-Websocket 三种通信协议。这种部署方式具有以下优势：

- **简化运维**：减少容器间网络配置和依赖管理
- **降低延迟**：所有服务在同一进程内，避免跨容器通信开销
- **共享状态**：FastAPI 的 Auth 中间件可以直接应用于所有 WebSocket 连接

**后端应用启动配置**：

在 `app/main.py` 中集成所有服务：
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ypy_websocket import YpyWebSocket
import socketio
from app.core.config import settings
from app.db.mongodb import init_beanie
from app.api.v1 import api_router
from app.websocket.socketio_server import sio

app = FastAPI(title="AICSL API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

yjs_app = YpyWebSocket()
app.mount("/ysocket", yjs_app)

app.mount("/socket.io", socketio.ASGIApp(sio))

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    await init_beanie()
```

**Docker Compose**：
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://admin:password@mongodb:27017/collab_db?authSource=admin
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - mongodb
      - redis
      - minio

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  minio_data:
```

### 8.2 Nginx 配置

**多实例负载均衡配置**：

当部署多个后端实例时，必须在 Nginx 层配置 `ip_hash`，确保同一个用户的 Socket.IO 握手请求总是打到同一台服务器，否则握手会失败。

```nginx
upstream backend {
    ip_hash;
    
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 80;
    server_name aicsl.example.com;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ysocket {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /sse {
        proxy_pass http://backend;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

**WebSocket 会话保持说明**：

- **ip_hash 原理**：根据客户端 IP 地址计算哈希值，将同一 IP 的请求路由到同一后端服务器
- **必要性**：Socket.IO 连接建立后，后续通信必须发送到同一服务器，否则连接会断开
- **替代方案**：如果使用云服务商的负载均衡器，可以使用 Session Affinity（会话亲和性）功能

### 8.3 数据库自动迁移

**Beanie 自动迁移机制**：

MongoDB 本身是 Schema-less 的数据库，不需要像关系型数据库那样执行复杂的迁移脚本。我们在 FastAPI 应用的 lifespan 启动事件中运行 `init_beanie`，它会自动创建缺失的 Collection 和 Indexes。

**迁移实现代码**：

```python
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.course import Course
from app.models.activity_log import ActivityLog
from app.models.chat_log import ChatLog
from app.models.ai_intervention_rule import AIInterventionRule

async def init_beanie():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client.collab_db,
        document_models=[
            User,
            Project,
            Task,
            Course,
            ActivityLog,
            ChatLog,
            AIInterventionRule,
        ]
    )
```

**索引自动创建**：

在 Beanie 模型中定义的索引会在应用启动时自动创建：

```python
from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional

class ActivityLog(Document):
    project_id: Indexed(str)
    user_id: Indexed(str)
    timestamp: Indexed(datetime)
    action_type: str
    metadata: dict = Field(default_factory=dict)
    
    class Settings:
        name = "activity_logs"
        indexes = [
            [("project_id", 1), ("user_id", 1), ("timestamp", -1)],
        ]
```

**迁移策略**：

- **开发环境**：每次应用启动时检查并创建索引，开发人员无需手动执行迁移命令
- **生产环境**：首次部署时自动创建索引，后续启动时跳过已存在的索引
- **索引变更**：如果需要修改索引结构，在模型定义中更新后重启应用即可
- **数据迁移**：如果需要迁移数据，编写独立的 Python 脚本执行，不依赖 Beanie

### 9.4 CI/CD 流程

**GitHub Actions Workflow**：

系统采用 GitHub Actions 实现自动化测试、构建和部署流程，确保代码质量和部署效率。

**完整 CI/CD Pipeline 配置**：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 后端代码质量检查
  backend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install ruff black mypy
      
      - name: Run Ruff linter
        run: |
          cd backend
          ruff check .
      
      - name: Run Black formatter check
        run: |
          cd backend
          black --check .
      
      - name: Run MyPy type check
        run: |
          cd backend
          mypy app/

  # 前端代码质量检查
  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      
      - name: Run ESLint
        run: |
          cd frontend
          pnpm lint
      
      - name: Run TypeScript check
        run: |
          cd frontend
          pnpm tsc --noEmit

  # 后端单元测试
  backend-test:
    runs-on: ubuntu-latest
    needs: backend-lint
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[dev]"
      
      - name: Run pytest with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=html
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend

  # 前端单元测试
  frontend-test:
    runs-on: ubuntu-latest
    needs: frontend-lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      
      - name: Run Vitest
        run: |
          cd frontend
          pnpm test -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/coverage-final.json
          flags: frontend

  # E2E 测试
  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
          pnpm playwright install --with-deps
      
      - name: Start services
        run: docker compose up -d
      
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -s http://localhost:8000/health; do sleep 2; done'
      
      - name: Run Playwright tests
        run: |
          cd frontend
          pnpm test:e2e
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
      
      - name: Stop services
        if: always()
        run: docker compose down

  # 构建并推送 Docker 镜像
  build-and-push:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata for backend
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Extract metadata for frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 部署到生产环境
  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://aicsl.example.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app/aicsl
            docker compose pull
            docker compose up -d
            docker system prune -f
      
      - name: Run database migrations
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app/aicsl
            docker compose exec backend python -m app.db.migrate
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://aicsl.example.com/health || exit 1
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed successfully'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

**CI/CD 流程说明**：

1. **代码质量检查阶段**：
   - 后端：使用 Ruff 进行代码规范检查，Black 进行格式化检查，MyPy 进行类型检查
   - 前端：使用 ESLint 进行代码规范检查，TypeScript 编译器进行类型检查

2. **单元测试阶段**：
   - 后端：使用 pytest 运行单元测试，生成覆盖率报告
   - 前端：使用 Vitest 运行单元测试，生成覆盖率报告
   - 覆盖率报告自动上传到 Codecov 进行追踪

3. **E2E 测试阶段**：
   - 使用 Playwright 进行端到端测试
   - 启动完整的 Docker Compose 环境
   - 模拟真实用户操作流程
   - 测试失败时上传 Playwright 报告

4. **构建和推送阶段**：
   - 使用 Docker Buildx 构建多架构镜像
   - 推送到 GitHub Container Registry
   - 使用 GitHub Actions 缓存加速构建

5. **部署阶段**：
   - SSH 连接到生产服务器
   - 拉取最新镜像并重启服务
   - 执行数据库迁移
   - 健康检查确保服务正常
   - Slack 通知部署结果

**部署策略**：

- **蓝绿部署**：维护两套生产环境（蓝和绿），新版本部署到非活跃环境，健康检查通过后切换流量
- **滚动更新**：逐步替换旧版本实例，确保服务不中断
- **回滚机制**：部署失败时自动回滚到上一个稳定版本

**环境变量管理**：

使用 GitHub Secrets 存储敏感信息：
- `PRODUCTION_HOST`: 生产服务器地址
- `PRODUCTION_USER`: SSH 用户名
- `SSH_PRIVATE_KEY`: SSH 私钥
- `SLACK_WEBHOOK`: Slack 通知 Webhook
- `MONGODB_URL`: MongoDB 连接字符串
- `OPENAI_API_KEY`: OpenAI API 密钥

### 9.5 环境配置

**.env 文件示例**：
```
# 应用配置
APP_NAME=AICSL
DEBUG=true
SECRET_KEY=your-secret-key-here

# MongoDB
MONGODB_URL=mongodb://admin:password@localhost:27017/collab_db?authSource=admin

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-jwt-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI 配置
AI_PROVIDER=openai  # openai 或 ollama
OPENAI_API_KEY=your-openai-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# 文件存储
STORAGE_PROVIDER=minio  # minio 或 s3
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
S3_BUCKET=aicsl-files

# 日志配置
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

---

## 10. 安全设计

### 10.1 认证授权

**JWT 令牌实现**：

系统使用 JWT（JSON Web Token）进行用户认证，采用 RS256 算法签名，确保令牌的不可伪造性。

**令牌结构**：
```python
# JWT Payload 示例
{
  "sub": "user_id",           # 用户 ID
  "role": "teacher",          # 系统级角色
  "exp": 1704067200,          # 过期时间
  "iat": 1704065400,          # 签发时间
  "jti": "unique_token_id"    # 令牌唯一标识
}
```

**令牌类型**：
- **访问令牌（Access Token）**：有效期 30 分钟，用于 API 请求认证
- **刷新令牌（Refresh Token）**：有效期 7 天，用于获取新的访问令牌

**令牌存储策略**：
- 访问令牌存储在内存（JavaScript 变量），防止 XSS 攻击窃取
- 刷新令牌存储在 HttpOnly Cookie，设置 SameSite=Strict

**密码安全**：
- 使用 bcrypt 算法，cost factor 设置为 12
- 禁止弱密码（长度小于 8、与用户名相似、常见密码等）
- 密码修改时要求输入旧密码验证

**登出处理**：
- 刷新令牌存储在数据库的 `refresh_tokens` 集合
- 登出时标记令牌为已撤销，即使令牌未过期也无法继续使用
- 支持单点登出（撤销用户所有刷新令牌）

**基于依赖注入的 RBAC**：

系统采用基于依赖注入的角色访问控制（RBAC）机制，通过 FastAPI 的依赖注入系统实现权限验证。

**权限检查依赖**：
```python
from fastapi import Depends, HTTPException, status
from typing import Literal
from app.core.security import get_current_user
from app.models.user import User

def check_permission(min_role: Literal["student", "teacher", "admin"]):
    """
    权限检查依赖工厂函数
    
    Args:
        min_role: 最低要求的角色级别
    
    Returns:
        FastAPI 依赖函数
    """
    async def permission_checker(current_user: User = Depends(get_current_user)):
        role_hierarchy = {
            "student": 0,
            "teacher": 1,
            "admin": 2
        }
        
        if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(min_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker

# 使用示例
@app.delete("/api/v1/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(check_permission("admin"))
):
    """仅管理员可删除用户"""
    pass
```

**项目级权限**：

项目成员在 `projects` 集合的 `members` 数组中，`role` 字段的具体值为：
- **owner**: 教师、组长。权限包括 CRUD 项目、管理成员、删除项目
- **editor**: 组员。权限包括编辑文档/白板、上传资源、参与协作
- **viewer**: 访客。权限包括仅查看内容，无法编辑

**权限继承**：

Teacher 在班级中的权限通过逻辑层面的动态判断映射到项目中的权限，数据库不硬存 "Teacher 是所有项目的 owner"。

```python
async def get_project_role(user: User, project: Project) -> str:
    """
    获取用户在项目中的角色
    
    Args:
        user: 当前用户
        project: 目标项目
    
    Returns:
        用户角色 (owner/editor/viewer)
    """
    # 教师自动获得 owner 权限
    if user.role == "teacher" and project.course_id in user.courses:
        return "owner"
    
    # 查询数据库中的项目角色
    member = next(
        (m for m in project.members if m.user_id == user.id),
        None
    )
    
    if member:
        return member.role
    
    return "viewer"  # 默认访客权限
```

**API 权限控制示例**：
```python
from fastapi import APIRouter, Depends
from app.core.security import check_permission, get_project_role

router = APIRouter()

@router.delete("/api/v1/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(check_permission("teacher"))
):
    """删除项目（需要 teacher 或 owner 权限）"""
    project = await get_project(project_id)
    role = await get_project_role(current_user, project)
    
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can delete project")
    
    await project.delete()
    return {"message": "Project deleted"}

@router.post("/api/v1/projects/{project_id}/files")
async def upload_file(
    project_id: str,
    file: UploadFile,
    current_user: User = Depends(check_permission("student"))
):
    """上传文件（需要 editor 或 owner 权限）"""
    project = await get_project(project_id)
    role = await get_project_role(current_user, project)
    
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Only editor and owner can upload files")
    
    # 处理文件上传...
    pass
```

### 10.2 安全防护

**输入验证**：

所有用户输入使用 Pydantic 模型校验，限制字段类型、长度、格式，防止恶意输入。

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class ProjectCreateRequest(BaseModel):
    """项目创建请求模型"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    course_id: Optional[str] = None
    
    @validator('name')
    def name_must_not_contain_html(cls, v):
        """防止 XSS 攻击"""
        if '<' in v or '>' in v:
            raise ValueError('Name must not contain HTML tags')
        return v

class MessageCreateRequest(BaseModel):
    """消息创建请求模型"""
    content: str = Field(..., min_length=1, max_length=5000)
    type: str = Field("text", regex="^(text|image|file)$")
    
    @validator('content')
    def content_sanitize(cls, v):
        """清理恶意内容"""
        import html
        return html.escape(v)
```

**SQL/NoSQL 注入防护**：

使用 Motor 的参数化查询，不拼接字符串到查询语句，防止注入攻击。

```python
# 不安全的做法（禁止）
async def get_user_unsafe(username: str):
    query = {"username": f"'{username}'"}  # SQL 注入风险
    return await User.find_one(query)

# 安全的做法（推荐）
async def get_user_safe(username: str):
    query = {"username": username}  # 参数化查询
    return await User.find_one(query)

# 使用聚合管道时的安全做法
async def get_project_stats(project_id: str):
    pipeline = [
        {"$match": {"project_id": project_id}},
        {"$group": {"_id": "$action_type", "count": {"$sum": 1}}}
    ]
    return await ActivityLog.aggregate(pipeline).to_list(None)
```

**XSS 防护**：

前端渲染用户输入时进行转义，React 默认转义 HTML 内容。对于富文本内容，使用 DOMPurify 进行清理。

```typescript
// React 默认转义（安全）
function Message({ content }: { content: string }) {
  return <div>{content}</div>;  // 自动转义
}

// 富文本清理（使用 DOMPurify）
import DOMPurify from 'dompurify';

function RichText({ html }: { html: string }) {
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
```

**CSRF 防护**：

使用 SameSite Cookie，API 使用 JWT 令牌而非 Cookie（刷新令牌除外）。

```python
# FastAPI Cookie 设置
from fastapi import Response

@app.post("/api/v1/auth/refresh")
async def refresh_token(
    refresh_token: str = Cookie(None, alias="refresh_token")
):
    """刷新令牌接口"""
    # 验证刷新令牌...
    pass

# Cookie 配置（在响应中设置）
response.set_cookie(
    key="refresh_token",
    value=new_refresh_token,
    httponly=True,
    secure=True,      # 仅 HTTPS
    samesite="strict"  # 防止 CSRF
)
```

**速率限制**：

使用 Redis 实现速率限制，防止暴力破解和 DDoS 攻击。

```python
from fastapi import HTTPException, Request
from redis import Redis
import time

redis = Redis.from_url(settings.REDIS_URL)

async def rate_limit(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 60
):
    """
    速率限制中间件
    
    Args:
        request: FastAPI 请求对象
        max_requests: 时间窗口内最大请求数
        window_seconds: 时间窗口（秒）
    """
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    current = redis.incr(key)
    
    if current == 1:
        redis.expire(key, window_seconds)
    
    if current > max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s"
        )

# 使用示例
@app.post("/api/v1/auth/login")
async def login(
    request: Request,
    credentials: LoginRequest,
    _: None = Depends(rate_limit(max_requests=5, window_seconds=60))
):
    """登录接口（每分钟最多 5 次）"""
    pass
```

**WebSocket 安全**：

连接 Y-Websocket 和 Socket.IO 时验证 JWT 令牌，无权限的用户无法进入协作房间。

```python
# Socket.IO 握手鉴权
@socketio.on("connect")
async def handle_connect(sid, environ, auth):
    token = auth.get("token")
    user = await verify_jwt_token(token)
    if not user:
        return False  # 拒绝连接
    await save_connection(sid, user.id)

# Y-Websocket 鉴权（通过 URL Query 参数）
async def yjs_authenticate(request: Request):
    token = request.query_params.get("token")
    user = await verify_jwt_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
```

### 10.3 数据安全

**传输加密**：
- 全站使用 HTTPS，WebSocket 使用 WSS
- SSL 证书由 Let's Encrypt 或云服务商提供
- 强制 HTTP 到 HTTPS 重定向

**存储加密**：
- MongoDB 启用 TLS 连接
- 敏感字段（如密码）使用 bcrypt 哈希存储
- 文件存储使用 MinIO 的服务器端加密

**备份策略**：
- 每日自动备份 MongoDB 数据，保留 7 天
- 备份文件加密存储
- 支持手动触发备份和恢复

### 10.4 日志审计

**日志级别配置**：

通过环境变量 `.env` 静态配置，不支持运行时动态调整。

```python
# .env 文件
LOG_LEVEL=INFO  # 选项: DEBUG, INFO, WARNING, ERROR
```

**日志级别说明**：
- **DEBUG**：显示 SQL 语句、详细报错、调试信息（开发环境）
- **INFO**：记录关键请求和操作（生产环境）
- **WARNING**：记录潜在问题
- **ERROR**：记录系统异常和错误

**日志内容**：
- 用户登录/登出
- 项目创建/删除
- 文件上传/删除
- API 错误
- WebSocket 错误
- 系统异常

**日志存储**：
- 日志写入文件（JSON 格式）
- 按日期分割
- 保留 30 天
- 支持导出分析

**日志实现**：
```python
import logging
from app.core.config import settings

logger = logging.getLogger("aicsl")
logger.setLevel(getattr(logging, settings.LOG_LEVEL))

handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# 使用示例
logger.info(f"User {user_id} logged in")
logger.error(f"API error: {str(e)}")
```

---

## 11. 性能优化

### 11.1 前端优化

**代码分割**：使用 Vite 的动态导入实现路由级别代码分割，首屏只加载必要代码。

**资源压缩**：生产构建启用 Gzip/Brotli 压缩，图片使用 WebP 格式。

**缓存策略**：静态资源使用内容哈希命名（cache-busting），CSS/JS 设置长期缓存。

**虚拟滚动**：长列表（如聊天记录、文件列表）使用虚拟滚动，只渲染可见区域元素。

**状态缓存**：React Query 缓存 API 响应，避免重复请求。设置合理的 staleTime 和 cacheTime。

### 11.2 后端优化

**数据库索引优化**：

所有查询字段建立索引，定期分析慢查询并优化。MongoDB 使用 `explain()` 分析查询计划。

```python
# Beanie 模型索引定义
from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime

class ActivityLog(Document):
    project_id: Indexed(str)
    user_id: Indexed(str)
    timestamp: Indexed(datetime)
    action_type: str
    metadata: dict = Field(default_factory=dict)
    
    class Settings:
        name = "activity_logs"
        indexes = [
            [("project_id", 1), ("user_id", 1), ("timestamp", -1)],
            [("project_id", 1), ("timestamp", -1)],
        ]

# 查询优化示例
async def get_user_activities(project_id: str, user_id: str, limit: int = 100):
    """获取用户活动日志（使用索引）"""
    return await ActivityLog.find(
        ActivityLog.project_id == project_id,
        ActivityLog.user_id == user_id
    ).sort(-ActivityLog.timestamp).limit(limit).to_list()

# 慢查询分析
async def analyze_slow_query():
    """分析慢查询"""
    pipeline = [
        {"$match": {"millis": {"$gt": 100}}},  # 超过 100ms 的查询
        {"$group": {
            "_id": "$command",
            "count": {"$sum": 1},
            "avg_time": {"$avg": "$millis"}
        }}
    ]
    return await db.system.profile.aggregate(pipeline).to_list(None)
```

**连接池配置**：

MongoDB 和 Redis 使用连接池，避免频繁建立连接。连接池大小根据并发量配置。

```python
# MongoDB 连接池配置
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(
    settings.MONGODB_URL,
    maxPoolSize=50,      # 最大连接数
    minPoolSize=10,      # 最小连接数
    maxIdleTimeMS=30000, # 空闲连接超时时间
    connectTimeoutMS=5000,
    socketTimeoutMS=30000
)

# Redis 连接池配置
from redis import Redis
from redis.connection import ConnectionPool

pool = ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    max_connections=50,
    decode_responses=True
)
redis = Redis(connection_pool=pool)
```

**查询优化**：

避免 N+1 查询，使用聚合管道一次获取关联数据。大数据量查询使用分页和投影。

```python
# N+1 查询问题（不推荐）
async def get_projects_with_members_slow():
    """获取项目及其成员（N+1 查询）"""
    projects = await Project.find_all().to_list()
    for project in projects:
        project.members = await User.find(
            User.id.in_([m.user_id for m in project.members])
        ).to_list()
    return projects

# 优化后的查询（推荐）
async def get_projects_with_members_fast():
    """获取项目及其成员（使用聚合管道）"""
    pipeline = [
        {"$lookup": {
            "from": "users",
            "localField": "members.user_id",
            "foreignField": "_id",
            "as": "member_details"
        }},
        {"$project": {
            "name": 1,
            "description": 1,
            "members": {
                "$map": {
                    "input": "$members",
                    "as": "member",
                    "in": {
                        "role": "$$member.role",
                        "user": {
                            "$arrayElemAt": [
                                {
                                    "$filter": {
                                        "input": "$member_details",
                                        "cond": {"$eq": ["$$this._id", "$$member.user_id"]}
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        }}
    ]
    return await Project.aggregate(pipeline).to_list(None)

# 分页查询
async def get_projects_paginated(page: int = 1, page_size: int = 20):
    """分页查询项目"""
    skip = (page - 1) * page_size
    return await Project.find().skip(skip).limit(page_size).to_list()

# 投影查询（只返回需要的字段）
async def get_project_summary(project_id: str):
    """获取项目摘要（只返回部分字段）"""
    return await Project.find_one(
        Project.id == project_id,
        projection_model=ProjectSummary  # 只返回 name, description 等字段
    )
```

**缓存层设计**：

热点数据（如用户信息、项目列表）缓存到 Redis，设置合理的 TTL。缓存穿透使用布隆过滤器防护。

```python
from functools import wraps
import json
from typing import Optional

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """
    缓存装饰器
    
    Args:
        ttl: 缓存过期时间（秒）
        key_prefix: 缓存键前缀
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            
            # 尝试从缓存获取
            cached = redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # 执行函数
            result = await func(*args, **kwargs)
            
            # 存入缓存
            redis.setex(cache_key, ttl, json.dumps(result, default=str))
            
            return result
        return wrapper
    return decorator

# 使用示例
@cache_result(ttl=600, key_prefix="user")
async def get_user(user_id: str) -> Optional[User]:
    """获取用户信息（缓存 10 分钟）"""
    return await User.find_one(User.id == user_id)

@cache_result(ttl=300, key_prefix="project_list")
async def get_user_projects(user_id: str) -> list[Project]:
    """获取用户项目列表（缓存 5 分钟）"""
    return await Project.find(Project.members.user_id == user_id).to_list()

# 缓存更新
async def update_project(project_id: str, data: dict):
    """更新项目并清除缓存"""
    await Project.find_one(Project.id == project_id).update({"$set": data})
    
    # 清除相关缓存
    pattern = "project_list:*"
    for key in redis.scan_iter(match=pattern):
        redis.delete(key)
```

**布隆过滤器防护缓存穿透**：

```python
from pybloom_live import ScalableBloomFilter

# 初始化布隆过滤器
bloom_filter = ScalableBloomFilter(initial_capacity=10000, error_rate=0.001)

async def get_project_with_bloom(project_id: str) -> Optional[Project]:
    """使用布隆过滤器防护缓存穿透"""
    
    # 检查布隆过滤器
    if project_id not in bloom_filter:
        return None  # 项目不存在
    
    # 检查缓存
    cache_key = f"project:{project_id}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # 查询数据库
    project = await Project.find_one(Project.id == project_id)
    
    if project:
        # 添加到布隆过滤器
        bloom_filter.add(project_id)
        # 存入缓存
        redis.setex(cache_key, 600, json.dumps(project.dict(), default=str))
    
    return project
```

### 11.3 网络优化

**WebSocket 压缩**：

启用 WebSocket 压缩扩展，减少传输数据量。

```python
# Socket.IO 压缩配置
import socketio

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25,
    compression=True  # 启用压缩
)

# Y-Websocket 压缩（通过 WebSocket 扩展）
from ypy_websocket import YpyWebSocket

yjs_app = YpyWebSocket(
    compression=True  # 启用 permessage-deflate 压缩
)
```

**增量同步**：

Y.js 只传输增量更新，不传输全量状态。减少网络带宽占用。

```typescript
// Y.js 增量同步示例
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const provider = new WebsocketProvider(
  'ws://localhost:8000/ysocket',
  'wb:project_123',
  doc,
  {
    // 启用增量同步
    connect: true,
    // 只同步变更的部分
    params: {
      token: jwt_token
    }
  }
);

// 监听更新事件（只传输增量）
doc.on('update', (update, origin) => {
  console.log('Y.js update:', update);
  // update 是二进制增量数据，而非全量状态
});
```

**CDN 加速**：

静态资源通过 CDN 分发，用户就近访问。文件上传直传到对象存储，减轻后端压力。

```typescript
// 前端直传 MinIO
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'https://cdn.example.com',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key'
  }
});

async function uploadFile(file: File) {
  // 生成预签名 URL
  const command = new PutObjectCommand({
    Bucket: 'aicsl-files',
    Key: `uploads/${Date.now()}_${file.name}`,
    Body: file,
    ContentType: file.type
  });
  
  // 直传到 MinIO
  await s3Client.send(command);
  
  // 返回 CDN URL
  return `https://cdn.example.com/aicsl-files/uploads/${file.name}`;
}
```

### 11.4 监控告警

**监控指标**：

- API 响应时间（P50、P95、P99）
- WebSocket 连接数
- 数据库查询性能
- CPU/内存/磁盘使用率

**告警规则**：

- API 响应时间 > 3s 持续 5 分钟
- WebSocket 连接数 > 1000
- 磁盘使用率 > 80%

**工具**：使用 Prometheus + Grafana 进行监控和可视化，Alertmanager 发送告警通知。

**Prometheus 配置示例**：

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
  
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb:27017']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

**FastAPI Prometheus 集成**：

```python
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# 自定义指标
from prometheus_client import Counter, Histogram

api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def prometheus_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    api_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    api_request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

**Grafana Dashboard 配置**：

```json
{
  "dashboard": {
    "title": "AICSL Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])"
          }
        ]
      },
      {
        "title": "API Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "WebSocket Connections",
        "targets": [
          {
            "expr": "websocket_connections_total"
          }
        ]
      }
    ]
  }
}
```

**Alertmanager 告警规则**：

```yaml
# alertmanager.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, api_request_duration_seconds) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API response time is too high"
          description: "P95 response time is {{ $value }}s"
      
      - alert: TooManyWebSocketConnections
        expr: websocket_connections_total > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Too many WebSocket connections"
          description: "Current connections: {{ $value }}"
      
      - alert: HighDiskUsage
        expr: disk_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage"
          description: "Disk usage is {{ $value }}%"
```

---

## 12. 开发规范

### 11.1 代码风格

**前端代码规范**：使用 ESLint + Prettier 统一代码风格。ESLint 配置 extends: ['plugin:@typescript-eslint/recommended', 'prettier']。代码提交前自动运行 lint 检查。

**后端代码规范**：使用 Ruff 进行代码检查和格式化。Ruff 是 Python 的极速 linter，比 flake8 快 10-100 倍。代码风格遵循 PEP 8，使用类型注解。

### 11.2 Git 规范

**分支策略**：采用 Feature Branch 工作流。main 分支保持稳定，develop 分支作为开发主分支，功能开发从 develop 创建 feature 分支。

**提交规范**：遵循 Conventional Commits 规范。格式为 `<type>(<scope>): <description>`，type 包括 feat、fix、docs、style、refactor、test、chore 等。

**代码审查**：Pull Request 必须经过审查才能合并。至少 1 人批准，CI 检查通过。

### 11.3 测试规范

**单元测试**：前端使用 Vitest，后端使用 Pytest。测试覆盖率要求 > 80%。

**组件测试**：前端使用 React Testing Library，测试组件渲染和交互行为。

**E2E 测试**：使用 Playwright 测试关键用户流程，如登录、创建项目、实时协作等。

**测试数据**：使用 Factory 模式生成测试数据，避免硬编码。测试数据在每次运行前自动创建。

### 11.4 文档规范

**API 文档**：FastAPI 自动生成 OpenAPI 文档，Swagger UI 提供在线测试界面。复杂接口添加 docstring 说明。

**代码注释**：复杂逻辑添加注释说明，函数添加类型注解和说明文档。公共 API 必须有文档注释。

**变更日志**：使用 CHANGELOG.md 记录版本变更。格式遵循 Keep a Changelog 规范。

---

## 12. 附录

### 12.1 数据库集合索引汇总

| 集合名称 | 索引字段 | 索引类型 | 用途 |
|----------|----------|----------|------|
| users | email | unique | 用户登录 |
| users | username | unique | 用户登录 |
| refresh_tokens | token_hash | normal | 令牌查找 |
| refresh_tokens | expires_at | TTL | 自动清理 |
| projects | members.user_id | normal | 查询我的项目 |
| tasks | project_id | normal | 查询项目任务 |
| calendar_events | project_id, start_time | compound | 日程查询 |
| courses | invite_code | unique | 学生加入班级 |
| courses | teacher_id | normal | 教师班级列表 |
| courses | students | normal | 学生班级查询 |
| whiteboard_snapshots | project_id, created_at | compound | 白板快照查询 |
| documents | project_id | normal | 项目文档列表 |
| doc_comments | doc_id | normal | 文档评论查询 |
| resources | project_id | normal | 项目资源列表 |
| web_annotations | project_id, url_hash | compound | 项目批注查询 |
| activity_logs | project_id, user_id, timestamp | compound | 行为分析查询 |
| chat_logs | project_id, created_at | compound | 聊天记录查询 |

### 12.2 环境变量配置说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| MONGODB_URL | 是 | - | MongoDB 连接串 |
| REDIS_URL | 否 | - | Redis 连接串 |
| JWT_SECRET_KEY | 是 | - | JWT 签名密钥 |
| ACCESS_TOKEN_EXPIRE_MINUTES | 否 | 30 | 访问令牌有效期 |
| REFRESH_TOKEN_EXPIRE_DAYS | 否 | 7 | 刷新令牌有效期 |
| AI_PROVIDER | 否 | openai | AI 提供商 |
| OPENAI_API_KEY | 条件 | - | OpenAI API Key |
| OLLAMA_BASE_URL | 条件 | - | Ollama 服务地址 |
| LOG_LEVEL | 否 | INFO | 日志级别 |
| STORAGE_PROVIDER | 否 | minio | 存储提供商 |

### 12.3 术语表

| 术语 | 解释 |
|------|------|
| CRDT | Conflict-free Replicated Data Type，无冲突复制数据类型 |
| Y.js | 基于 CRDT 的实时协作框架 |
| WebSocket | 一种在单个 TCP 连接上进行全双工通信的协议 |
| Socket.IO | 基于 WebSocket 的实时通信库 |
| SSE | Server-Sent Events，服务端推送事件 |
| RAG | Retrieval-Augmented Generation，检索增强生成 |
| TTL | Time To Live，数据过期时间 |
| JWT | JSON Web Token，用于身份认证的令牌标准 |
| RBAC | Role-Based Access Control，基于角色的访问控制 |