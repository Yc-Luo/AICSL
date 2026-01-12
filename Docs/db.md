# 数据库

**协作学习平台，纯 MongoDB 7.0 + Redis 架构完全可行且更优**，原因如下：

1. **行为数据实时分析**：MongoDB 7.0 的聚合管道和时间序列集合专门为此设计
2. **AI 建议功能**：MongoDB 可以存储向量数据，直接支持 RAG
3. **简化架构**：避免跨数据库查询的复杂性
4. **成本效益**：减少运维复杂度

## **MongoDB 7.0 的强大功能适合需求**

| **需求** | **MongoDB 7.0 特性** | **如何支持** |
| --- | --- | --- |
| **行为数据实时分析** | 时间序列集合、实时聚合管道 | 高效处理时间序列数据 |
| **AI 建议和 RAG** | Vector Search、Atlas Search | 原生向量搜索，支持语义检索 |
| **复杂查询** | 聚合框架、$lookup 关联查询 | 处理关系型查询需求 |
| **实时协作** | Change Streams、事务支持 | 监听数据变更，实时推送 |
| **仪表盘** | Atlas Charts、聚合管道 | 直接生成可视化数据 |

**🏗 推荐架构：MongoDB 7.0 + Redis**

```jsx
┌─────────────────────────────────────────────────────────────┐
│                   应用层（React + Node.js）                   │
└─────────────────┬────────────────────┬─────────────────────┘
                  │                    │
    ┌─────────────▼──────────┐  ┌─────▼─────────────────┐
    │     MongoDB 7.0        │  │       Redis 7+       │
    ├────────────────────────┤  ├───────────────────────┤
    │  - 所有结构化数据        │  │  - 会话/认证         │
    │  - 时间序列行为日志      │  │  - 实时状态          │
    │  - 向量嵌入（AI）        │  │  - 缓存             │
    │  - 文件存储（GridFS）    │  │  - 消息队列          │
    │  - 全文搜索             │  │  - 速率限制          │
    └────────────────────────┘  └───────────────────────┘
```

**📝 具体数据库设计**

**1. 用户体系**

```jsx
// users 集合
{
  _id: ObjectId("..."),
  username: "zhangsan",
  email: "zhang@example.com",
  phone: "+8613800138000",
  passwordHash: "...",
  role: "student", // "student", "teacher", "admin"
  avatar: "https://...",
  profile: {
    fullName: "张三",
    bio: "热爱学习的学生",
    preferences: {
      theme: "light",
      language: "zh-CN"
    }
  },
  
  // 关系数据完全可以用嵌套/引用处理
  classMemberships: [
    {
      classId: ObjectId("..."),
      role: "student", // 或 "monitor"
      joinedAt: ISODate("..."),
      status: "active"
    }
  ],
  
  // 统计字段（可实时更新）
  stats: {
    totalProjects: 5,
    totalLearningHours: 120,
    lastActive: ISODate("...")
  },
  
  // 系统字段
  status: "active", // 或 "blocked"
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  lastLogin: ISODate("..."),
  loginHistory: [
    {
      ip: "192.168.1.1",
      timestamp: ISODate("..."),
      device: "Chrome on Windows"
    }
    // 建议：使用 $push + $slice 保留最近 50 条记录，避免无限增长
  ]
}
```

**2. 班级管理**

```jsx
// classes 集合
{
  _id: ObjectId("..."),
  name: "三年级一班",
  description: "数学学习班级",
  code: "CLASS2024-001", // 班级代码，用于邀请
  coverImage: "https://...",
  
  // 关系处理
  teacherId: ObjectId("..."), // 创建教师
  schoolId: ObjectId("..."), // 所属学校（可选）
  
  // 成员列表（部分嵌套）
  members: [
    {
      userId: ObjectId("..."),
      role: "student",
      joinedAt: ISODate("..."),
      nickname: "小明" // 班级内昵称
    }
    // 注意：这里只存储基本信息，详细用户信息通过 $lookup 查询
  ],
  
  // 项目关联
  projects: [
    {
      projectId: ObjectId("..."),
      assignedAt: ISODate("..."),
      status: "active"
    }
  ],
  
  settings: {
    maxStudents: 50,
    allowStudentCreateProject: false,
    collaborationRules: {}
  },
  
  analytics: {
    totalStudents: 30,
    activeStudents: 25,
    averageEngagement: 85.5
  },
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**3. 项目管理（核心协作单元）**

```jsx
// projects 集合
{
  _id: ObjectId("..."),
  name: "数学小组项目",
  description: "解决几何问题",
  type: "group", // "group", "individual"
  subject: "mathematics",
  tags: ["几何", "协作学习"],
  
  // 关系
  classId: ObjectId("..."), // 所属班级
  teacherId: ObjectId("..."), // 指导教师
  ownerId: ObjectId("..."), // 项目负责人（学生）
  
  // 成员管理
  members: [
    {
      userId: ObjectId("..."),
      role: "member", // "owner", "member", "viewer"
      joinedAt: ISODate("..."),
      permissions: {
        canEditWhiteboard: true,
        canEditDocument: true,
        canUploadFiles: true
      }
    }
  ],
  
  // 状态
  status: "active", // "draft", "active", "completed", "archived"
  progress: 65, // 0-100
  visibility: "class", // "private", "class", "public"
  
  // 模板配置
  templates: {
    whiteboard: { /* 白板模板配置 */ },
    document: { /* 文档模板 */ },
    tasks: { /* 任务模板 */ }
  },
  
  // 资源关联
  resources: [
    {
      type: "whiteboard",
      resourceId: ObjectId("..."), // 引用 whiteboards 集合
      lastActivity: ISODate("...")
    },
    {
      type: "document",
      resourceId: ObjectId("..."), // 引用 documents 集合
      lastActivity: ISODate("...")
    }
  ],
  
  // 时间管理
  timeline: {
    startDate: ISODate("..."),
    dueDate: ISODate("..."),
    milestones: [
      {
        name: "第一阶段完成",
        dueDate: ISODate("..."),
        completed: true
      }
    ]
  },
  
  // 统计（可定期更新）
  stats: {
    totalMessages: 245,
    totalFileUploads: 12,
    totalEdits: 1560,
    averageSessionDuration: 45 // 分钟
  },
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**4. 行为数据（使用 MongoDB 7.0 时间序列集合）**

```jsx
// 创建时间序列集合
db.createCollection("behavior_logs", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "minutes"
  },
  expireAfterSeconds: 90 * 24 * 60 * 60 // 90天自动过期
});

// 行为日志文档
{
  // 时间序列字段
  timestamp: ISODate("2024-01-15T10:30:00Z"),
  
  // 元数据字段（用于索引和分组）
  metadata: {
    userId: ObjectId("..."),
    projectId: ObjectId("..."),
    classId: ObjectId("..."),
    sessionId: "session-123",
    deviceType: "desktop"
  },
  
  // 事件数据
  eventType: "whiteboard.draw", // 或 "document.edit", "chat.message", "ai.interaction"
  eventData: {
    action: "draw_path",
    elementType: "line",
    duration: 1200, // 毫秒
    coordinates: [[100, 200], [150, 250]],
    tool: "pen"
  },
  
  // 上下文信息
  context: {
    tab: "whiteboard",
    previousEvent: "tool_selection",
    sequenceId: 5 // 会话内事件序列
  },
  
  // AI 分析标记（可后处理添加）
  aiAnalysis: {
    engagementScore: 0.85,
    collaborationPattern: "active_contributor",
    suggestedInterventions: ["鼓励分享想法"]
  }
}

// 性能优化：创建索引
db.behavior_logs.createIndex({ "metadata.userId": 1, timestamp: -1 });
db.behavior_logs.createIndex({ "metadata.projectId": 1, timestamp: -1 });
db.behavior_logs.createIndex({ eventType: 1, timestamp: -1 });
```

**5. 实时协作数据（白板、文档、聊天）**

```jsx
// whiteboards 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  name: "几何证明白板",
  
  // Yjs 文档状态
  yjsDocument: BinData(0, "..."), // 二进制存储 Yjs 状态
  
  // 元素快照（用于快速渲染）
  elements: [
    {
      id: "elem-1",
      type: "rectangle",
      x: 100,
      y: 200,
      width: 300,
      height: 200,
      style: { fill: "#FF6B6B", stroke: "#333" },
      createdBy: ObjectId("..."),
      createdAt: ISODate("...")
    }
  ],
  
  // 操作历史（用于回放和恢复）
  operations: [
    {
      id: "op-1",
      type: "create",
      elementId: "elem-1",
      data: { /* 操作数据 */ },
      timestamp: ISODate("..."),
      userId: ObjectId("..."),
      version: 1
    }
  ],
  
  // 版本控制
  versions: [
    {
      version: 5,
      snapshot: { /* 完整快照 */ },
      createdAt: ISODate("..."),
      createdBy: ObjectId("..."),
      comment: "初步完成框架"
    }
  ],
  
  settings: {
    canvasSize: { width: 5000, height: 5000 },
    background: "grid",
    locked: false
  },
  
  stats: {
    totalElements: 15,
    totalOperations: 234,
    lastActivity: ISODate("...")
  },
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}

// chat_messages 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  roomType: "project", // "project", "direct"
  
  // 消息内容
  senderId: ObjectId("..."),
  content: "大家看看这个证明过程是否正确？",
  contentType: "text", // "text", "image", "file", "system"
  
  // 富文本支持
  richContent: {
    markdown: "**大家看看**这个证明过程是否正确？",
    mentions: [ObjectId("...")], // @提及的用户
    reactions: {
      "👍": [ObjectId("..."), ObjectId("...")]
    }
  },
  
  // AI 交互
  aiContext: {
    isAIResponse: false,
    modelUsed: "gpt-4",
    promptTokens: 120,
    completionTokens: 85
  },
  
  // 元数据
  metadata: {
    replyTo: ObjectId("..."), // 回复的消息ID
    threadId: ObjectId("..."), // 线程ID
    edited: true,
    editHistory: [
      {
        content: "原始内容...",
        editedAt: ISODate("...")
      }
    ]
  },
  
  // 阅读状态
  readBy: [
    {
      userId: ObjectId("..."),
      readAt: ISODate("...")
    }
  ],
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**6. AI 相关数据（RAG 和对话）**

```jsx
// ai_conversations 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  userId: ObjectId("..."),
  
  // 对话上下文
  context: {
    mode: "socratic", // "socratic", "tutor", "collaborator"
    subject: "mathematics",
    difficulty: "intermediate",
    language: "zh-CN"
  },
  
  // 消息历史
  messages: [
    {
      role: "user",
      content: "如何证明勾股定理？",
      timestamp: ISODate("..."),
      contextSources: [
        {
          type: "document",
          docId: ObjectId("..."),
          page: 3,
          content: "直角三角形两直角边的平方和等于斜边的平方..."
        }
      ]
    },
    {
      role: "assistant",
      content: "勾股定理可以通过多种方式证明...",
      timestamp: ISODate("..."),
      model: "gpt-4",
      citations: [
        {
          sourceId: ObjectId("..."),
          confidence: 0.92
        }
      ],
      suggestedActions: [
        {
          type: "quiz",
          question: "下面哪个三角形符合勾股定理？",
          options: ["3-4-5", "2-3-4", "5-12-13"]
        }
      ]
    }
  ],
  
  // RAG 上下文 (引用 resource_embeddings)
  knowledgeBase: [
    {
      source: "uploaded_pdf",
      resourceId: ObjectId("..."), // 关联资源ID
      usedChips: [ObjectId("...")] // 关联具体的 embedding chunks (可选)
    }
  ],
  
  // 学习分析
  analytics: {
    totalTokensUsed: 1250,
    learningObjectivesCovered: ["geometry", "proof"],
    studentEngagement: 0.78,
    suggestedNextTopics: ["三角函数", "相似三角形"]
  },
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  lastActivity: ISODate("...")
}
```

**7. 系统配置和文件存储**

```jsx
// system_configs 集合
{
  _id: ObjectId("..."),
  configType: "llm_settings",
  
  // LLM 配置
  llmSettings: {
    provider: "openai", // "openai", "anthropic", "deepseek"
    apiKey: "encrypted...",
    defaultModel: "gpt-4",
    availableModels: ["gpt-4", "gpt-3.5-turbo", "claude-3"],
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000
    }
  },
  
  // 存储配额
  storageQuotas: {
    defaultProjectQuota: 5 * 1024 * 1024 * 1024, // 5GB
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxProjectMembers: 5,
    dataRetentionDays: 365
  },
  
  // 功能开关
  features: {
    aiTutorEnabled: true,
    whiteboardCollaboration: true,
    analyticsDashboard: true,
    exportFunctionality: true
  },
  
  updatedBy: ObjectId("..."),
  updatedAt: ISODate("...")
}

// 使用 GridFS 存储大文件
const bucket = new GridFSBucket(db, {
  bucketName: 'uploads',
  chunkSizeBytes: 1024 * 1024 // 1MB chunks
});

// 文件元数据集合
{
  _id: ObjectId("..."),
  filename: "几何课件.pdf",
  contentType: "application/pdf",
  size: 2048576,
  projectId: ObjectId("..."),
  uploadedBy: ObjectId("..."),
  
  // 处理状态
  processing: {
    status: "processed", // "pending", "processing", "processed", "error"
    extractedText: true,
    generatedEmbeddings: true,
    previewGenerated: true
  },
  
  // 预览信息
  preview: {
    thumbnail: "https://...",
    pageCount: 24,
    dimensions: { width: 1920, height: 1080 }
  },
  
  // 权限
  permissions: {
    canView: [ObjectId("..."), ObjectId("...")],
    canEdit: [ObjectId("...")],
    canDelete: [ObjectId("...")]
  },
  
  metadata: {
    author: "张老师",
    description: "几何学习课件",
    tags: ["几何", "课件", "PDF"]
  },
  
  uploadDate: ISODate("...")
}
```

**8. 补充核心业务集合 (基于需求文档补全)**

**8.1 任务看板 (Tasks - 对应 Kanban)**

为了支持 Kanban 的拖拽和状态流转，建议将 Task 独立为顶级集合，而不是内嵌在 Project 中。

```jsx
// tasks 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  title: "完成需求文档初稿",
  description: "包含核心功能列表...",
  
  // 看板状态与排序
  status: "todo", // "todo", "in_progress", "done"
  columnId: "col-1", // 可选：如果支持自定义列
  sortOrder: 1024.5, // 使用浮点数或 Lexorank 算法实现 O(1) 的拖拽排序
  
  // 核心属性
  priority: "high", // "low", "medium", "high"
  assignees: [ObjectId("...")], // 执行人列表
  dueDate: ISODate("..."),
  labels: ["文档", "需评审"],
  
  // 关联
  attachments: [
    { 
      type: "resource", // "resource", "link"
      resourceId: ObjectId("...") 
    }
  ],
  
  // 审计
  createdBy: ObjectId("..."),
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
// 索引建议
// db.tasks.createIndex({ projectId: 1, status: 1, sortOrder: 1 })
```

**8.2 协作文档 (Documents)**

这是 Tab 2 "协作文档" 的核心存储。与 Whiteboard 类似，需要存储 Y.js 的二进制更新，但也需要纯文本快照以便搜索和预览。

```jsx
// documents 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  title: "项目计划书",
  
  // Y.js 状态 (核心同步数据)
  // 保存 Y.doc 的 update encoding (Uint8Array -> Binary)
  yjsState: BinData(0, "..."), 
  
  // 内容快照 (用于搜索、预览和 AI 分析)
  content: {
    plainText: "项目计划书...", // 纯文本，用于全文搜索
    html: "<h1>项目计划书</h1>...", // HTML，用于快速渲染 (SSR)
    json: { ... } // TipTap JSON 结构
  },
  
  // 状态
  isLocked: false,
  lastEditedBy: ObjectId("..."),
  
  // 关联
  comments: [ // 简单的文档级评论，行内评论通常存储在 Y.js state 中或独立 doc_comments 集合
    { userId: ObjectId("..."), content: "...", createdAt: ISODate("...") }
  ],
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**8.3 日历日程 (Calendar Events)**

支持左侧边栏的日历视图。

```jsx
// calendar_events 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."), // 归属项目
  userId: ObjectId("..."), // 创建者
  
  title: "小组周会",
  type: "meeting", // "meeting", "deadline", "personal"
  
  // 时间范围
  start: ISODate("..."),
  end: ISODate("..."),
  allDay: false,
  
  // 权限与可见性
  isPrivate: false, // true 则只有创建者和老师可见
  
  // 参与人
  attendees: [ObjectId("...")],
  
  // 详情
  description: "讨论排期",
  location: "线上会议室",
  referenceLink: "http://...", // 关联的文档或会议链接
  
  createdAt: ISODate("...")
}
// 索引：db.calendar_events.createIndex({ projectId: 1, start: 1 })
```

**8.4 网页批注 (Web Annotations)**

对应 Tab 4 "浏览器" 的协作阅读功能。

```jsx
// web_annotations 集合
{
  _id: ObjectId("..."),
  projectId: ObjectId("..."),
  userId: ObjectId("..."), // 批注人
  
  // 目标网页
  url: "https://wikipedia.org/wiki/Artificial_Intelligence",
  pageTitle: "Artificial Intelligence - Wikipedia",
  
  // 锚点定位 (基于 W3C Web Annotation 标准)
  selector: {
    type: "TextQuoteSelector",
    exact: "Artificial Intelligence", // 选中的文字
    prefix: "The history of ", // 前文
    suffix: " began with..." // 后文
  },
  
  // 样式与内容
  style: {
    color: "yellow", // "yellow", "green", "red"
    type: "highlight" // "highlight", "underline"
  },
  comment: "这段定义很重要，可以引用到论文中",
  
  createdAt: ISODate("...")
}
```

**8.5 向量知识库优化 (Vector Embeddings)**

原设计将 Vector 存在 `ai_conversations` 中是不恰当的。向量应该是 `resources` 的衍生属性，或独立存储以复用。

```jsx
// resource_embeddings 集合
// 专门存储 RAG 向量，与 AI 对话解耦，实现"一次上传，多次引用"
{
  _id: ObjectId("..."),
  resourceId: ObjectId("..."), // 关联 resources 集合的文件
  
  // 切片信息
  chunkIndex: 0,
  content: "文本片段内容...", // 原始文本块
  
  // 向量数据 (DeepSeek/OpenAI Embedding)
  vector: [0.012, -0.234, ...], // 1536维或其它维度
  
  metadata: {
    page: 1,
    sourceFilename: "几何课件.pdf"
  }
}
// 必须在 vector 字段上建立 Vector Search Index
```

**🔧 技术实现细节**

**1. 关系查询的解决方案**

MongoDB 7.0 的 `$lookup` 功能强大：

```jsx
// 示例：获取班级详情及所有学生信息
db.classes.aggregate([
  {
    $match: { _id: ObjectId("class123") }
  },
  {
    $lookup: {
      from: "users",
      let: { memberIds: "$members.userId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$_id", "$$memberIds"]
            }
          }
        },
        {
          $project: {
            username: 1,
            email: 1,
            "profile.fullName": 1,
            avatar: 1,
            status: 1
          }
        }
      ],
      as: "memberDetails"
    }
  },
  {
    $lookup: {
      from: "projects",
      localField: "projects.projectId",
      foreignField: "_id",
      as: "projectDetails"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "teacherId",
      foreignField: "_id",
      as: "teacherInfo"
    }
  },
  {
    $addFields: {
      teacher: { $arrayElemAt: ["$teacherInfo", 0] }
    }
  },
  {
    $project: {
      teacherInfo: 0
    }
  }
]);
```

**2. 实时分析聚合管道**

```jsx
// 实时生成项目仪表盘数据
db.behavior_logs.aggregate([
  {
    $match: {
      "metadata.projectId": ObjectId("project123"),
      timestamp: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
      }
    }
  },
  {
    $group: {
      _id: {
        userId: "$metadata.userId",
        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
      },
      
      // 计算贡献度指标
      totalActions: { $sum: 1 },
      whiteboardEdits: {
        $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /whiteboard/ } }, 1, 0] }
      },
      documentEdits: {
        $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /document/ } }, 1, 0] }
      },
      chatMessages: {
        $sum: { $cond: [{ $regexMatch: { input: "$eventType", regex: /chat/ } }, 1, 0] }
      },
      
      // 计算学习时长
      totalDuration: { $sum: "$eventData.duration" },
      
      // 计算活跃时间段
      activityHours: {
        $push: { $hour: "$timestamp" }
      }
    }
  },
  {
    $group: {
      _id: "$_id.userId",
      
      // 汇总用户数据
      totalDaysActive: { $sum: 1 },
      averageDailyActions: { $avg: "$totalActions" },
      totalLearningHours: {
        $sum: { $divide: ["$totalDuration", 1000 * 60 * 60] }
      },
      
      // 活动分布
      activityByType: {
        whiteboard: { $sum: "$whiteboardEdits" },
        document: { $sum: "$documentEdits" },
        chat: { $sum: "$chatMessages" }
      },
      
      // 活跃时间段分析
      peakActivityHour: {
        $function: {
          body: function(hoursArray) {
            const flattened = hoursArray.flat();
            const freq = {};
            flattened.forEach(h => freq[h] = (freq[h] || 0) + 1);
            return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
          },
          args: ["$activityHours"],
          lang: "js"
        }
      }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "userInfo"
    }
  },
  {
    $addFields: {
      user: { $arrayElemAt: ["$userInfo", 0] }
    }
  },
  {
    $project: {
      userInfo: 0,
      "user.passwordHash": 0
    }
  },
  {
    $sort: { totalLearningHours: -1 }
  }
]);
```

**3. AI 建议生成流程**

```jsx
// 基于行为数据生成个性化建议
async function generateAIRecommendations(userId, projectId) {
  const pipeline = [
    // 1. 获取用户行为数据
    {
      $match: {
        "metadata.userId": userId,
        "metadata.projectId": projectId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    },
    
    // 2. 分析行为模式
    {
      $group: {
        _id: null,
        totalSessions: { $addToSet: "$metadata.sessionId" },
        whiteboardTime: {
          $sum: {
            $cond: [
              { $eq: ["$eventType", "whiteboard.draw"] },
              { $ifNull: ["$eventData.duration", 0] },
              0
            ]
          }
        },
        documentTime: {
          $sum: {
            $cond: [
              { $eq: ["$eventType", "document.edit"] },
              { $ifNull: ["$eventData.duration", 0] },
              0
            ]
          }
        },
        chatInteractions: {
          $sum: {
            $cond: [
              { $eq: ["$eventType", "chat.message"] },
              1,
              0
            ]
          }
        },
        
        // 提取技能标签
        skillsUsed: {
          $addToSet: {
            $cond: [
              { $regexMatch: { input: "$eventData.elementType", regex: /code/i } },
              "programming",
              {
                $cond: [
                  { $regexMatch: { input: "$eventData.tool", regex: /diagram/i } },
                  "visual_design",
                  "general"
                ]
              }
            ]
          }
        }
      }
    },
    
    // 3. 获取同龄人比较数据
    {
      $lookup: {
        from: "behavior_logs",
        let: { user: userId },
        pipeline: [
          {
            $match: {
              "metadata.projectId": projectId,
              "metadata.userId": { $ne: userId },
              timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: "$metadata.userId",
              avgWhiteboardTime: { $avg: "$eventData.duration" }
            }
          },
          {
            $group: {
              _id: null,
              peerAvgWhiteboardTime: { $avg: "$avgWhiteboardTime" },
              peerCount: { $sum: 1 }
            }
          }
        ],
        as: "peerComparison"
      }
    },
    
    // 4. 获取项目要求
    {
      $lookup: {
        from: "projects",
        localField: "metadata.projectId",
        foreignField: "_id",
        as: "projectInfo"
      }
    }
  ];
  
  const analysis = await db.behavior_logs.aggregate(pipeline).toArray();
  
  // 5. 生成建议（可调用 AI API）
  const recommendations = [];
  
  if (analysis[0]) {
    const data = analysis[0];
    
    // 基于数据分析生成建议
    if (data.whiteboardTime < data.peerComparison[0]?.peerAvgWhiteboardTime * 0.5) {
      recommendations.push({
        type: "suggestion",
        priority: "medium",
        title: "增加白板协作参与",
        message: "您的白板使用时间低于团队平均水平，建议多参与图形化讨论",
        action: "join_whiteboard_session",
        metrics: {
          yourTime: data.whiteboardTime,
          peerAverage: data.peerComparison[0]?.peerAvgWhiteboardTime
        }
      });
    }
    
    if (data.skillsUsed && data.skillsUsed.includes("programming")) {
      recommendations.push({
        type: "skill_development",
        priority: "high",
        title: "编程技能突出",
        message: "检测到您经常使用编程相关功能，建议您担任技术指导角色",
        action: "assign_technical_lead",
        resources: [
          {
            type: "learning_path",
            title: "协作编程最佳实践",
            url: "/resources/collaborative-coding"
          }
        ]
      });
    }
  }
  
  return recommendations;
}
```

**4. 实时仪表盘数据流**

```jsx
// 使用 Change Streams 实现实时仪表盘更新
const pipeline = [
  {
    $match: {
      $or: [
        { operationType: "insert" },
        { operationType: "update" }
      ],
      "fullDocument.metadata.projectId": projectId
    }
  }
];

const changeStream = db.collection('behavior_logs').watch(pipeline, {
  fullDocument: 'updateLookup'
});

changeStream.on('change', async (change) => {
  const projectId = change.fullDocument.metadata.projectId;
  
  // 实时重新计算仪表盘数据
  const dashboardData = await calculateRealTimeDashboard(projectId);
  
  // 通过 WebSocket 推送到前端
  io.to(`project:${projectId}:dashboard`).emit('dashboard:update', {
    type: 'real_time_update',
    data: dashboardData,
    timestamp: new Date()
  });
  
  // 检查是否需要 AI 干预
  const needsIntervention = await checkForAIIntervention(projectId, change.fullDocument);
  
  if (needsIntervention) {
    // 触发 AI 干预
    const intervention = await generateAIIntervention(projectId, change.fullDocument);
    
    // 推送到聊天或 AI 助手
    io.to(`project:${projectId}:chat`).emit('ai:intervention', intervention);
  }
});
```

**🚀 Redis 使用策略**

```jsx
const redisConfig = {
  // 1. 会话管理
  sessions: {
    prefix: 'session:',
    ttl: 24 * 60 * 60 // 24小时
  },
  
  // 2. 实时状态
  presence: {
    prefix: 'presence:',
    ttl: 5 * 60 // 5分钟
  },
  
  // 3. 缓存
  cache: {
    // 项目仪表盘数据缓存
    projectDashboard: {
      prefix: 'cache:dashboard:',
      ttl: 30 // 30秒
    },
    
    // AI 对话历史缓存
    aiConversation: {
      prefix: 'cache:ai:conversation:',
      ttl: 10 * 60 // 10分钟
    }
  },
  
  // 4. 消息队列
  queues: {
    emailQueue: 'queue:emails',
    aiProcessingQueue: 'queue:ai:processing',
    analyticsQueue: 'queue:analytics'
  },
  
  // 5. 速率限制
  rateLimits: {
    login: {
      key: 'ratelimit:login:{ip}',
      maxAttempts: 5,
      window: 15 * 60 // 15分钟
    },
    
    api: {
      key: 'ratelimit:api:{userId}',
      maxRequests: 100,
      window: 60 // 1分钟
    }
  }
};

// Redis 使用示例
class RedisManager {
  constructor() {
    this.client = createRedisClient();
    this.pubSubClient = createRedisClient();
  }
  
  // 用户在线状态管理
  async updateUserPresence(userId, projectId, status) {
    const key = `presence:project:${projectId}:user:${userId}`;
    const data = {
      userId,
      projectId,
      status,
      lastSeen: Date.now(),
      tab: 'whiteboard', // 当前所在标签页
      cursorPosition: { x: 100, y: 200 }
    };
    
    await this.client.setex(key, 300, JSON.stringify(data));
    
    // 发布状态更新
    await this.publish(`project:${projectId}:presence`, {
      type: 'presence_update',
      data
    });
  }
  
  // 实时协作状态
  async updateCollaborationState(projectId, tab, data) {
    const key = `collab:project:${projectId}:tab:${tab}`;
    await this.client.setex(key, 60, JSON.stringify(data));
  }
  
  // 仪表盘数据缓存
  async getDashboardData(projectId, forceRefresh = false) {
    const cacheKey = `cache:dashboard:${projectId}`;
    
    if (!forceRefresh) {
      const cached = await this.client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    // 从 MongoDB 计算数据
    const data = await calculateDashboardData(projectId);
    
    // 缓存结果
    await this.client.setex(cacheKey, 30, JSON.stringify(data));
    
    return data;
  }
  
  // 实时消息队列
  async enqueueAITask(task) {
    await this.client.lpush('queue:ai:processing', JSON.stringify(task));
  }
  
  // 速率限制
  async checkRateLimit(key, maxAttempts, window) {
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, window);
    }
    
    return current <= maxAttempts;
  }
}
```

**📈 性能优化策略**

```jsx
// 1. 索引策略
const indexes = {
  users: [
    { username: 1, unique: true },
    { email: 1, unique: true },
    { phone: 1, unique: true },
    { "classMemberships.classId": 1 },
    { role: 1, createdAt: -1 }
  ],
  
  classes: [
    { teacherId: 1 },
    { "members.userId": 1 },
    { code: 1, unique: true },
    { createdAt: -1 }
  ],
  
  projects: [
    { classId: 1 },
    { ownerId: 1 },
    { "members.userId": 1 },
    { status: 1, updatedAt: -1 },
    { tags: 1 }
  ],
  
  behavior_logs: [
    // 时间序列索引
    { timestamp: -1 },
    { "metadata.userId": 1, timestamp: -1 },
    { "metadata.projectId": 1, timestamp: -1 },
    { eventType: 1, timestamp: -1 },
    
    // 复合索引用于常见查询
    { "metadata.projectId": 1, "metadata.userId": 1, timestamp: -1 },
    { "metadata.classId": 1, eventType: 1, timestamp: -1 }
  ],
  
  chat_messages: [
    { projectId: 1, createdAt: -1 },
    { senderId: 1, createdAt: -1 },
    { "richContent.mentions": 1 }
  ]
};

// 2. 分片策略（应对大数据量）
const shardingConfig = {
  behavior_logs: {
    shardKey: { "metadata.projectId": 1, timestamp: 1 },
    chunks: 256
  },
  
  chat_messages: {
    shardKey: { projectId: 1, createdAt: 1 },
    chunks: 128
  }
};

// 3. 聚合管道优化
const aggregationOptimizations = {
  // 使用 $match 尽早过滤
  earlyFilter: true,
  
  // 使用 $project 减少数据传输
  projection: true,
  
  // 使用 $facet 并行处理
  facetForParallel: true,
  
  // 使用 $lookup 代替多次查询
  singleLookup: true,
  
  // 缓存聚合结果
  cacheResults: {
    enabled: true,
    ttl: 60 // 60秒
  }
};
```

**实施建议：**

- 使用 MongoDB Atlas（云服务）简化运维
- 利用 Atlas Vector Search 实现 RAG
- 使用 Atlas Charts 快速创建仪表盘
- 通过 Change Streams 实现实时更新
