# AICSL 协作学习系统 - 需求文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2025-12-24 |
| 文档状态 | 正式版 |

---

## 1. 项目概述

### 1.1 项目简介

AICSL（AI-Enhanced Collaborative Learning System）是一个基于 Web 的实时协作学习平台，集成 AI 辅助教学功能。系统支持多人实时协作编辑文档、绘制白板、管理资源库，并通过 AI 导师提供个性化学习指导。

### 1.2 核心特性

- **实时协作**：基于 Y.js 的 CRDT 技术，支持多人同时编辑文档和白板
- **AI 辅助**：集成 GPT-4 / DeepSeek 等大语言模型，提供智能问答和学习指导
- **多模态协作**：支持文档、白板、资源库、浏览器批注等多种协作形式
- **学习分析**：记录用户行为数据，生成学习仪表盘

### 1.3 目标用户

- **学生**：参与协作学习项目的主要用户
- **教师**：指导学生、监控学习进度、提供反馈
- **管理员**：系统维护和用户管理

---

## 2. 用户角色与权限

### 2.1 系统级角色

| 角色 | 权限描述 | 登录后跳转 |
|------|----------|-----------|
| **Student** | 默认角色。仅能创建有限数量的项目；只能加入被邀请的项目；仅能查看自己的仪表盘数据。每个 Student 只能加入 1 个项目。 | student 学生协作页面 |
| **Teacher** | 上帝视角。可以查看所有学生（其班级下）的仪表盘/行为流；可以进入学生项目进行旁观或指导；拥有创建课程/模版的权限。 | teacher 教师管理页面 |
| **Admin** | 系统维护。管理用户账号（重置密码/封号）；配置系统参数（如 LLM Key，存储配额）；查看系统级性能日志。 | manager 管理后台 |

### 2.2 项目级成员角色

| 权限点 | Editor (组员) | Owner (组长) |
|--------|---------------|---------------|
| 白板/文档/代码 | 仅查看 | 编辑/评论 | 编辑/评论 |
| 邀请成员 | ✅ | ✅ |
| 移除成员 | ❌ | ✅ |
| 修改项目设置 | ❌ | ✅ (改名/归档) |
| 删除项目 | ❌ | ✅ |
| 上传资源 | ✅ | ✅ |
| 使用 AI 导师 | ✅ | ✅ |

### 2.3 项目创建与成员管理

- **项目创建**：Student 可以主动创建项目，创建者被认定为 Owner，之后可以进行 Owner 转让。创建项目占用"加入 1 个项目"的配额。
- **成员数量上限**：最多 6 人（包括 Owner 在内，即 Owner + 5 个成员）。
- **项目归档**：支持归档功能（仅 Owner 权限），归档后可以查看但不能编辑。

---

## 3. 功能需求

### 3.1 登录页面

#### 3.1.1 登录功能

**登录方式**
- 用户名 + 密码
- 邮箱 + 密码
- 手机号 + 密码

**登录后跳转**
- Student → student 学生协作页面
- Teacher → teacher 教师管理页面
- Admin → manager 管理后台

#### 3.1.2 忘记密码

- 支持通过邮箱重置密码（发送重置链接到邮箱）
- 支持联系 Admin/Teacher 手动重置

#### 3.1.3 账号创建

**V1 版本策略**
- 由 Admin/Teacher 批量创建账号（暂不支持用户自主注册）

**批量创建方式**
- 上传 Excel/CSV 文件批量导入
- 在界面上逐个添加

**初始密码设置**
- 统一密码规则：账号 + 123（例如：用户名 "zhangsan"，初始密码为 "zhangsan123"）

---

### 3.3 教师管理页面（Teacher 工作台）

#### 3.3.1 页面布局 

**两列布局**
- **左侧（30%）**：导航栏
- **右侧（70%）**：导航对应的主要内容区

#### 3.3.2 左侧导航栏

**导航项**
- 班级管理 classmanager
- 学生列表 studentlist
- 项目管理 projectmanager
- 项目监控 projectmonitor
- 项目仪表盘 projectdashboard
- 设置 settings

#### 3.3.3 班级管理 classmanager

**功能描述**
- 创建班级 createclass
- 编辑班级信息（班级名称、描述） editclass
- 删除班级 deleteclass
- 查看班级成员列表 classmembers

**班级属性**
- 班级名称 class_name
- 班级描述 class_description
- 创建时间 class_create_time
- 班级成员数量 class_member_count

#### 3.3.4 学生列表 studentlist

**功能描述**
- 查看所有学生信息 studentlist
- 添加学生到班级 addstudent
- 从班级移除学生 removestudent
- 查看学生详情 studentdetail

**学生信息展示**
- 学生姓名 student_name
- 学生账号（用户名/邮箱/手机号） student_account
- 所属班级 class_name
- 在线状态 online_status
- 最后活跃时间 last_active_time

**学生详情**
- 基本信息（姓名、账号、班级）
- 参与的项目列表 project_list
- 学习仪表盘数据 dashboard_data
- 行为流记录 behavior_log

#### 3.3.5 项目管理 projectmanager

**功能描述**
- 创建项目 createproject
- 编辑项目内容 editproject
- 删除项目 deleteproject
- 发布项目给学生 publishproject

**项目属性**
- 项目名称 project_name
- 项目描述 project_description
- 创建时间 project_create_time
- 发布状态（草稿/已发布）project_status

**项目内容**
- 白板模板 whiteboard_template
- 文档模板 document_template
- 任务模板 task_template
- 资源模板 resource_template

#### 3.3.6 项目监控 projectmonitor

**功能描述**
- 查看所有项目列表 projectlist
- 进入项目进行旁观或指导 projectmonitor

**项目列表** projectlist
- 项目名称 project_name
- 项目描述 project_description
- 项目成员 project_members
- 项目进度 project_progress
- 最后活跃时间 last_active_time

**旁观/指导模式** projectmonitor
- 仅查看模式：不能编辑项目内容 projectview
- 指导模式：可以编辑项目内容（需要项目成员邀请） projectguide


#### 3.3.7 项目仪表盘 projectdashboard

**功能描述**
- 查看项目的学习仪表盘数据 projectdashboard
- 查看项目的行为流记录 projectbehavior
- 分析项目的学习情况 projectanalysis
- 导出项目数据 projectexport

**仪表盘数据** projectdashboard
- 团队贡献 project_contribution
- 学习时长 project_learning_time
- 任务完成度 project_task_completion
- 能力模型（雷达图） project_ability_model
- 活跃度（折线图） project_activity

**行为流记录** projectbehavior
- 用户 project_user
- 时间 project_time
- 操作类型 project_action_type
- 操作对象 project_action_object
- 持续时间 project_duration

**数据导出** projectexport
- 导出白板为图片 
- 导出文档为 Word / PDF
- 导出聊天记录
- 按时间导出行为流（支持 CSV、JSON、Excel 格式）

#### 3.3.8 设置 settings

**功能描述**
- 更改头像 
- 更改ID
- 更改密码
- 退出登陆

---

### 3.4 Manager 管理后台

#### 3.4.1 页面布局

**两列布局**
- **左侧（30%）**：导航栏 
- **右侧（70%）**：导航对应的主要内容区

#### 3.4.2 左侧导航栏

**导航项**
- 用户管理 usermanager
- 系统配置 systemconfig

#### 3.4.3 用户管理 usermanager

**功能描述**
- 查看所有用户列表 userlist
- 创建用户账号 createuser
- 编辑用户信息 edituser
- 重置用户密码 resetpassword
- 封禁/解封用户账号 blockuser
- 删除用户账号 deleteuser

**用户列表信息展示** userlist
- 用户姓名 username
- 用户账号（用户名/邮箱/手机号） useraccount
- 用户角色（Student/Teacher/Admin） userrole
- 所属班级（仅 Student） userclass
- 最后活跃时间 userlastactive
- 账号状态（正常/封禁） userstatus


#### 3.4.4 系统配置 systemconfig

**功能描述** 
- 配置系统参数 systemconfig
- 查看/修改 LLM Key llmkey
- 设置存储配额 storagequota
- 配置系统其他参数 systemother

**配置项**
- LLM API Key llmkey
- LLM 模型选择（GPT-4o / DeepSeek / Llama 3） llmmodule
- 项目存储配额（默认 5GB）
- 单个文件大小限制（默认 50MB）
- 项目成员数量上限（默认 5 人）
- 数据保留时间（默认 365 天）

---

### 3.5 主页面（Student 协作工作台）

#### 3.5.1 App Shell（全局布局与状态管理）

#### 3.5.1 布局结构

采用 Grid 布局，分为三个区域：
- **左侧边栏**：项目信息、日程安排、任务看板（左侧边栏可以进行展开和隐藏）
- **主内容区**：6 个功能 Tab（深度探究、文档、资源库、浏览器、AI 导师、仪表盘）
- **右侧边栏**：成员列表、群组聊天
- **左下角悬浮**：AI 快捷助手（可以进行展开和隐藏）

#### 3.5.2 全局状态管理

- 当前用户信息（用户名、头像、角色）
- 点击用户头像弹出设置弹窗
- 当前项目 ID
- 当前激活的 Tab
- WebSocket 连接状态（Y.js、Socket.IO）

#### 3.5.3 用户认证

- 支持 JWT 登录验证
- 支持刷新令牌机制
- 支持登出功能

---

### 3.6 左侧边栏（项目管理与日程）

#### 3.6.1 项目信息卡片

- 显示项目名称、描述
- 显示项目进度（0-100%）
- 显示项目成员头像列表
- 支持进入项目设置（仅 Owner）

#### 3.6.2 日历视图

- 显示当前月份日历
- 高亮有事件的日期
- 支持点击日期查看当日日程
- 日程类型：会议、截止日期、个人事件
- 支持"私密"标记（Teacher 可以查看学生的私密日程）

#### 3.6.3 任务看板（Mini Kanban）

- 三列布局：待办、进行中、已完成
- 支持任务拖拽排序
- 任务属性：标题、优先级（低/中/高）、负责人、截止日期
- 支持任务状态流转

---

### 3.7 主内容区（6 个 Tab）

#### 3.7.1 Tab 1：深度探究空间 (Deep Inquiry Space)

**功能描述**
- **双模式切换**：支持“灵感收集 (Scrapbook)”和“逻辑论证 (Argumentation)”两种视图。
- **灵感收集池**：支持将外部网页片段、PDF 摘要、个人想法、AI 回答以“卡片”形式收集并进行视觉化聚类。
- **结构论证图**：提供逻辑建模画布，支持将卡片定义为“论点”、“证据”、“反驳”等角色，并通过有向线段建立逻辑链。
- **AI 逻辑审查**：AI 扮演“恶魔代言人”，检测论证逻辑漏洞，识别证据缺失，并提供反面观点。
- **多人实时协作**：支持多人同时编辑节点、调整布局，显示协作光标。

**技术实现**
- 前端：React + React Flow + Zustand
- 实时同步：Y.js (Y.Map / Y.Array) + WebSocket
- 数据持久化：定期保存 Nodes 和 Edges 的 JSON 快照
- AI 集成：基于项目上下文的 RAG + 逻辑分析 Prompt 链

---

#### 3.7.2 Tab 2：协作文档

**功能描述**
- 类似 Google Docs 的多光标实时编辑
- 支持 Markdown 语法（如 ```python）
- 支持批注功能（@某人采用批注形式，不触发通知）
- 支持文档历史版本

**技术实现**
- 前端：TipTap（基于 ProseMirror）
- 实时同步：Y-ProseMirror + Y.js
- 数据持久化：定期保存快照

---

#### 3.7.3 Tab 3：协作资源库

**功能描述**
- 文件上传（支持拖拽上传）
- 文件列表展示（名称、大小、上传者、上传时间）
- 支持文件预览（PDF、图片、视频）
- 支持文件删除

**文件类型支持**
- PDF
- DOCX
- PPTX
- 图片（JPG, PNG, GIF）
- 视频（MP4, AVI, MOV）

**限制条件**
- 单个文件大小限制：50MB
- 项目存储配额：5GB
- 不支持文件夹层级结构

---

#### 3.7.4 Tab 4：浏览器

**功能描述**
- 在平台内直接查阅外部资料
- 支持对网页内容进行批注和高亮
- 支持协同阅读

**实现方案（混合）**

**方案 A：阅读模式（核心方案）**
- 后端代理请求目标 URL
- 使用 Readability.js 或 BeautifulSoup 提取正文内容
- 清洗广告和脚本，在前端渲染为纯净 HTML
- 适用场景：论文、技术博客、新闻文章

**方案 B：白名单 Iframe**
- 仅允许嵌入明确支持 Embed 的网站（YouTube、Figma、Google Docs 发布链接）
- 适用场景：视频、外部协作工具

**方案 C：外链跳转**
- 对于需要登录的复杂应用（Github、知乎），直接在新标签页打开

---

#### 3.7.5 Tab 5：AI 导师

**功能描述**
- 全屏沉浸式 AI 对话界面
- 支持苏格拉底式教学
- 支持生成测验题、代码解释、深度阅读论文
- 支持 Markdown/LaTeX 渲染
- 展示引用来源

**AI 功能特性**
- 统一后端：与右侧边栏 AI 助手共享同一个对话历史
- 混合模式：AI 默认拥有通用知识（GPT-4）
- RAG 功能：如果用户勾选"基于项目上下文"，则必须先上传资源到资源库，后台异步对 PDF/Doc 进行向量化
- 如果资源库为空，AI 将基于通用知识回答，并提示用户"上传资料可获得更精准回答"

---

#### 3.7.6 Tab 6：学习仪表盘

**功能描述**
- 可视化展示团队贡献、学习时长、任务完成度
- 支持雷达图（能力模型）、折线图（活跃度）
- 仅显示当前项目的数据

---

### 3.8 右侧边栏（即时通讯与 AI 助手）

#### 3.8.1 成员列表

- 显示项目成员头像和用户名
- 显示在线状态（绿点/灰点）

#### 3.8.2 群组聊天

- 显示聊天消息列表
- 支持 @提及功能（在聊天输入框上方显示谁 @某人，点击后跳转到具体位置）
- 消息永久保存（用于分析小组协作活跃度和社交网络图谱）
- 支持 /呼出AI进行对话（可以有不同AI角色）
- 可以根据对话内容进行自动AI干预

### 3.9 AI 快捷助手(悬浮图标)

- 定位：Copilot（轻量级快捷指令）
- 场景：用户正在写文档，划词询问；在白板画图时问流程图下一步
- 与 Tab 5 AI 导师共享同一个对话历史和后端

---

## 4. 非功能性需求

### 4.1 性能需求

| 指标 | 要求 |
|------|------|
| 单机实例并发 | 支持 50-100 人同时在线协作（2核 4G 配置） |
| 实时同步延迟 | < 100ms |
| 页面加载时间 | < 3s（首屏） |
| 文件上传速度 | 支持 50MB 文件上传 |

### 4.2 可用性需求

- **网络弹性**：如果网络断开 5 分钟，Socket.IO 和 Y-Websocket 会自动重连并同步丢失的数据
- **降级策略**：如果 Socket 断开，前端暂时缓存在 localStorage，重连后补发

### 4.3 安全需求

- **身份认证**：JWT 令牌认证
- **权限控制**：基于角色的访问控制（RBAC）
- **数据加密**：HTTPS 传输，密码哈希存储
- **CORS 保护**：限制跨域访问

### 4.4 兼容性需求

**仅支持现代浏览器**
- Chrome 100+
- Edge 100+
- Firefox 100+
- Safari 16+

**不支持**：IE 全系列

**理由**：使用了 WebSockets、Canvas API、Flex/Grid、CSS Variables 等现代特性

### 4.5 国际化需求

- V1 版本仅支持中文
- 架构上预留多语言支持，所有 UI 文本统一放入 `frontend/src/config/locales.ts` 字典中

### 4.6 部署需求

- **容器化部署**：Docker 容器化部署
- **兼容环境**：阿里云/AWS EC2、学校内网私有服务器、开发者的笔记本
- **CI/CD**：GitHub Actions 自动构建和部署

---

## 5. 数据需求

### 5.1 数据持久化策略

| 数据类型 | 保存策略 |
|----------|----------|
| Y.js 快照 | 动态防抖（5秒无操作或60秒强制保存） |
| 聊天记录 | 永久保存 |
| 活动日志 | TTL 索引，365天后自动删除 |
| 文档快照 | 定期保存 |

### 5.2 数据导出功能

**Teacher 端支持以下导出功能**
- 导出白板为图片
- 导出文档为 Word / PDF
- 导出聊天记录
- 按时间导出行为流（支持 CSV、JSON、Excel 格式）

**行为流导出字段**
- 用户
- 时间
- 操作类型
- 操作对象
- 持续时间

### 5.3 数据库设计

采用 MongoDB 作为主数据库，主要集合包括：

| 集合名称 | 用途 |
|----------|------|
| users | 用户信息 |
| refresh_tokens | JWT 刷新令牌 |
| projects | 项目元数据 |
| tasks | 任务看板 |
| calendar_events | 日程事件 |
| inquiry_snapshots | 深度探究空间快照（Nodes/Edges） |
| documents | 文档元数据 |
| doc_comments | 文档评论 |
| resources | 资源库文件 |
| web_annotations | 网页批注 |
| ai_personas | AI 角色配置 |
| ai_conversations | AI 对话会话 |
| ai_messages | AI 对话记录 |
| activity_logs | 活动日志 |
| analytics_daily_stats | 统计缓存 |
| chat_logs | 聊天记录 |

---

## 6. 技术约束

### 6.1 技术栈版本

#### 前端
| 技术实体 | 版本 |
|----------|------|
| Node.js | v20.x (LTS) |
| React | 18.3+ |
| TypeScript | 5.3+ |
| Vite | 5.0+ |
| Tailwind CSS | 3.4+ |
| Y.js | 13.6+ |
| React Flow | 12.x+ |
| TipTap | 2.2+ |

#### 后端
| 技术实体 | 版本 |
|----------|------|
| Python | 3.12+ |
| FastAPI | 0.109+ |
| MongoDB | 7.0+ |
| Motor | 3.3+ |
| Socket.IO | Server 5.x / Client 4.x |
| LangChain | 1.2.0+ |

### 6.2 架构约束

- **模块化单体**：采用模块化单体或微前端组件化的设计思想
- **关注点分离**：UI 布局与业务逻辑剥离，HTTP 请求与 WebSocket 实时通信剥离
- **三层通信**：
  1. REST API 层：处理传统的 CRUD
  2. 实时协同层（WebSocket - Y.js）：处理白板、文档的高频同步
  3. 即时通讯/AI 层（Socket.IO）：处理聊天室消息、成员状态通知、AI 流式响应

### 6.3 开发环境约束

- **包管理器**：
  - 前端：pnpm
  - 后端：Poetry
- **本地数据库**：Docker Compose 启动 MongoDB 7.0 和 Redis
- **环境变量管理**：使用 .env 文件

### 6.4 测试框架

- **单元测试**：Vitest（前端）、Pytest（后端）
- **组件测试**：React Testing Library
- **端到端测试**：Playwright

---


## 7. AI 功能约束

### 7.1 AI 配额

- 不需要用户级别的配额限制
- 不需要记录 AI Token 消耗量

### 7.2 AI 模型

- 默认对接 OpenAI API (GPT-4o) 或 deepseek
- 开发态降本：支持切换到 Ollama (Llama 3)，通过环境变量切换

### 7.3 AI 流式输出

- 使用 Server-Sent Events (SSE) 协议
- 前端使用 fetch + ReadableStream 读取

---

## 8. 附录

### 8.1 术语表

| 术语 | 解释 |
|------|------|
| CRDT | Conflict-free Replicated Data Type，无冲突复制数据类型 |
| Y.js | 基于 CRDT 的实时协作框架 |
| WebSocket | 一种在单个 TCP 连接上进行全双工通信的协议 |
| Socket.IO | 基于 WebSocket 的实时通信库 |
| RAG | Retrieval-Augmented Generation，检索增强生成 |
| TTL | Time To Live，数据过期时间 |

### 8.2 参考资料

- System.md（技术设计文档）
- FastAPI 官方文档
- Y.js 官方文档
- Weave.js 官方文档
- TipTap 官方文档
