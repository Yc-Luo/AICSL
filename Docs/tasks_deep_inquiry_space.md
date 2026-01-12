# 深度探究空间 (Deep Inquiry Space) 任务清单

## 第一阶段：基础设施与数据同步 (Expected: 3 days)

### 1.1 后端扩展
- [ ] 在 MongoDB 中创建 `inquiry_snapshots` 集合。
- [ ] 实现 `GET /api/projects/{id}/inquiry` 获取当前状态快照的接口。
- [ ] 实现 `POST /api/projects/{id}/inquiry/snapshot` 保存快照的接口。
- [ ] 更新 Socket.IO 事件，支持 `inquiry_op` 类型的操作分发。

### 1.2 前端基础框架
- [ ] 创建 `frontend/src/modules/inquiry` 目录。
- [ ] 集成 `React Flow` 核心依赖。
- [ ] 实现 `InquiryStore` (Zustand) 与 `Yjs` 的深度绑定逻辑。
- [ ] 创建基础布局：主画布区 + 可伸缩灵感侧栏。

## 第二阶段：核心交互开发 (Expected: 4 days)

### 2.1 灵感池 (Scrapbook) 开发
- [ ] 实现多种卡片渲染组件（文本型、引用型、AI 回答型）。
- [ ] 实现全局“钉入”机制（从文档、浏览器 Tab 传递数据至灵感池）。
- [ ] 实现灵感池卡片的 CRUD 及其 Yjs 同步。

### 2.2 论证画布 (Argumentation Canvas) 开发
- [ ] 自定义 React Flow 节点类型：Claim, Evidence, Counter-Argument。
- [ ] 实现从灵感池侧栏“拖拽”卡片进入画布的 DnD 交互。
- [ ] 实现自定义连线样式（有向箭头，支持双色标识支持/反对）。
- [ ] 实现节点位置、连线关系的实时同步。

## 第三阶段：AI 能力集成 (Expected: 3 days)

### 3.1 AI 逻辑分析
- [ ] 编写 “逻辑分析助手” 的 Prompt 模版。
- [ ] 实现后端服务调用 LLM 分析 `Nodes/Edges` 结构的能力。
- [ ] 前端实现 AI “红色警告” 标记显示逻辑。

### 3.2 AI 智能聚类
- [ ] 实现基于 Embedding 的卡片自动分类建议功能。
- [ ] 在灵感池视图中实现“一键整理”动画效果。

## 第四阶段：优化与打磨 (Expected: 2 days)

- [ ] 优化多人协作下的光标冲突（使用 Y-Websocket 的 Awareness）。
- [ ] 添加缩放自适应、小地图导航、一键整理画布功能。
- [ ] 移除旧有的 `whiteboard` 相关代码引用。
