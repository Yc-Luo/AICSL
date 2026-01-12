# 深度探究空间 (Deep Inquiry Space) 设计文档

## 1. 概述
深度探究空间是 AICSL 系统中的核心协作组件，旨在支持学生从零碎资料搜集到系统化逻辑论证的完整探究过程。它替代了传统的自由白板，提供了更具教学法支撑的结构化协作模式。

## 2. 核心架构

### 2.1 视图层 (Views)
组件包含两种互补的视图：
1. **灵感墙视图 (Scrapbook View)**：
   - 采用 Masonry (瀑布流) 布局或自由拖拽卡片布局。
   - 用于快速堆叠从各个渠道（资源库、浏览器、AI助手）收集来的信息片段。
2. **论证画布视图 (Argumentation View)**：
   - 基于 **React Flow** 构建的节点连线图。
   - 用于将灵感卡片转化为具有逻辑意义的证据链。

### 2.2 数据模型 (Data Model)
采用 Y.js 实现实时同步，数据结构存储在 `Y.Doc` 中：

```typescript
interface InquiryState {
  // 灵感池中的卡片
  scrapbook: Y.Map<{
    id: string;
    type: 'text' | 'image' | 'link' | 'ai_response';
    content: string;
    authorId: string;
    position?: { x: number, y: number }; // 灵感墙上的坐标
  }>;
  
  // 画布上的逻辑节点
  nodes: Y.Map<{
    id: string;
    type: 'claim' | 'evidence' | 'counter-argument' | 'rebuttal';
    data: { label: string, sourceRef?: string }; // sourceRef 链接回 scrapbook 卡片
    position: { x: number, y: number };
  }>;
  
  // 逻辑连线
  edges: Y.Map<{
    id: string;
    source: string;
    target: string;
    label: 'supports' | 'refutes' | 'contains';
  }>;
}
```

## 3. 核心功能流程

### 3.1 收集流 (Collection Flow)
1. **来源**：用户在浏览器 Tab 划词、PDF 预览页选择、或 AI 对话框中点击“钉入探究空间”。
2. **动作**：系统发起 REST 请求/WebSocket 发送指令，向该项目的 `scrapbook` 集合添加新卡片。
3. **反馈**：侧边栏“灵感池”实时弹出红点通知。

### 3.2 论证流 (Argumentation Flow)
1. **拖拽转化**：从灵感池侧栏拖拽卡片至中央 React Flow 画布。
2. **定义角色**：拖入时弹出小菜单，询问用户该卡片是“证据(Evidence)”还是“反驳(Counter)”。
3. **建立关联**：通过节点手柄拉出连线，选择逻辑关系。

### 3.3 AI 参与流 (AI Integration)
1. **聚类分析 (Clustering)**：用户点击“一键整理”，AI 根据语义对灵感池卡片进行分类并置顶建议。
2. **恶魔代言人 (Devil's Advocate)**：
   - AI 轮询当前 Edges 结构。
   - 如果发现孤立的“孤岛论点”，AI 会在旁边生成一个临时的“挑战卡片”。
   - 提供语义检测：“你这里的证据 A 与论点 B 之间逻辑跳跃过大，系统建议寻找关于‘变量 C’的资料。”

## 4. 技术栈
- **图形库**：[React Flow](https://reactflow.dev/) (用于论证图)。
- **同步库**：Y.js + y-websocket。
- **UI 组件库**：shadcn/ui + Tailwind CSS。
- **状态管理**：Zustand (记录局部 UI 状态如缩放、选中项)。

## 5. UI/UX 效果预期
- **专业感**：浅色模式/毛玻璃质感的卡片设计。
- **流畅感**：节点连线具有丝滑的动画效果。
- **秩序感**：逻辑角色（论点/证据/反驳）对应的节点颜色鲜明（例如：红-反驳，绿-支持，蓝-论点）。
