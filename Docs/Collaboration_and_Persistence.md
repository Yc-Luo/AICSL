# 白板、文档、聊天协同与持久化方案

我们将采用以下技术方案：

1. 使用WebSocket进行实时通信。
2. 使用IndexedDB和localStorage进行本地持久化。
3. 使用Broadcast Channel API进行同源多个标签页之间的通信。
4. 使用OT（操作转换）或CRDT（无冲突复制数据类型）算法解决冲突。
5. 使用React Context或状态管理库（如Zustand）进行状态管理。

### **OT vs CRDT技术选择策略**

| **模块** | **技术选择** | **原因** | **实现方式** |
| --- | --- | --- | --- |
| **白板** | **OT（操作转换）** | 图形操作顺序敏感，需要保证操作意图 | 自定义OT引擎处理绘图操作 |
| **文档** | **CRDT（Yjs）** | 文本编辑需要高效合并，离线支持强 | 使用Yjs库，自动解决冲突 |
| **聊天** | **时间戳排序** | 消息冲突较少，按时间排序即可 | 简单的时间戳去重机制 |

### **React Context vs Zustand状态管路具体分工**

| **技术** | **负责内容** | **示例** |
| --- | --- | --- |
| **Zustand** | 全局应用状态、持久化数据、业务逻辑 | 用户信息、房间列表、离线队列 |
| **React Context** | 组件树状态传递、UI状态、局部状态 | 主题、语言、组件间通信 |

```jsx
graph TB
    subgraph "状态管理层"
        Zustand[Zustand Store] --> ModuleState[模块状态]
        Zustand --> SystemState[系统状态]
        Zustand --> UserState[用户状态]
    end
    
    subgraph "组件层"
        ReactContext[React Context] --> Whiteboard[白板组件]
        ReactContext --> Document[文档组件]
        ReactContext --> Chat[聊天组件]
    end
    
    ModuleState --> ReactContext
    SystemState --> ReactContext
    
    Whiteboard --> Actions[用户操作]
    Document --> Actions
    Chat --> Actions
    
    Actions --> Zustand
```

由于白板和文档的协作特性不同，我们可能采用不同的冲突解决策略：

- 白板：每个操作（如绘制一个图形）相对独立，可以使用OT或CRDT，也可以采用操作日志和最后状态合并的方式。
- 文档：使用CRDT（如Yjs）来处理文本协作。
- 聊天：消息按时间顺序排列，冲突较少，可以采用简单的消息ID去重和排序。

考虑到复杂性，我们将为每个模块设计独立的数据同步层，然后通过一个统一的同步服务来管理WebSocket连接和标签页间通信。

步骤：

1. 设计统一的数据同步服务（SyncService），负责：
    - 管理WebSocket连接，包括重连、心跳等。
    - 将来自服务器的消息分发给各个模块。
    - 将本地操作发送到服务器。
    - 使用Broadcast Channel在标签页之间同步数据（避免同一用户多个标签页重复发送WebSocket消息）。
2. 为每个模块（白板、文档、聊天）设计一个适配器，负责：
    - 将模块的操作转换为同步操作（定义操作格式）。
    - 处理本地操作（乐观更新）。
    - 处理来自其他用户或标签页的远程操作。
    - 与本地持久化层交互，保存草稿和加载历史。
3. 设计本地持久化层：
    - 使用IndexedDB存储大量数据（如白板操作历史、文档历史版本）。
    - 使用localStorage存储当前活跃房间的简单状态（如房间ID、用户信息）和聊天记录（数据量较小）。
    - 设计数据合并策略，在加载数据时合并服务器数据和本地草稿。
4. 设计标签页协调器（TabManager）：
    - 通过Broadcast Channel或localStorage事件协调多个标签页，避免重复操作。
    - 选举一个主标签页负责某些协调工作（如定期保存到服务器）。
5. 设计React组件和状态管理：
    - 使用React Context提供全局的同步服务和模块适配器。
    - 每个模块的组件通过Context获取对应的适配器，发送操作和接收更新。
6. 离线处理：
    - 在离线时，将操作保存在本地，待上线后同步到服务器。
    - 使用Service Worker缓存静态资源，并支持离线访问。

**系统架构总览**

```
graph TB
subgraph "前端层"
UI[React UI组件]
SM[统一状态管理]
SS[同步服务]
TM[标签页管理器]
end

subgraph "模块层"
    WB[白板模块]
    DOC[文档模块]
    CHAT[聊天模块]
end

subgraph "存储层"
    LS[LocalStorage]
    IDB[IndexedDB]
    SW[Service Worker]
end

subgraph "网络层"
    WS[WebSocket连接]
    HTTP[REST API]
end

UI --> SM
SM --> SS
SS --> TM

UI --> WB
UI --> DOC
UI --> CHAT

WB --> SS
DOC --> SS
CHAT --> SS

SS --> WS
SS --> HTTP

WB --> LS
WB --> IDB
DOC --> LS
DOC --> IDB
CHAT --> LS

TM --> SW

WS --> Backend[后端服务器]
HTTP --> Backend

```

**🏗 1. 需要明确的项目结构**

src/
├── services/              # 核心服务
│   ├── SyncService.js     # 统一同步服务
│   ├── TabManager.js      # 标签页协调
│   ├── StorageManager.js  # 存储管理
│   └── RealtimeService.js # 实时通信
├── modules/              # 功能模块
│   ├── whiteboard/       # 白板模块
│   ├── document/         # 文档模块
│   └── chat/            # 聊天模块
├── store/               # 状态管理
│   ├── systemStore.js   # 系统状态
│   ├── roomStore.js     # 房间状态
│   └── userStore.js     # 用户状态
├── hooks/               # React Hooks
│   ├── useRoom.js       # 房间Hook
│   ├── useSync.js       # 同步Hook
│   └── usePersistence.js # 持久化Hook
├── components/          # 组件
│   ├── providers/       # 上下文提供者
│   └── common/          # 通用组件
└── utils/              # 工具函数
 　 ├── mergeStrategies.js # 数据合并
　  ├── conflictResolver.js # 冲突解决
  　└── idGenerator.js   # ID生成器

**🎯 2. 统一状态管理**

```jsx
// src/store/systemStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 统一存储配置
const storageConfig = {
  name: 'collab-system-store',
  storage: createJSONStorage(() => ({
    getItem: async (name) => {
      const value = localStorage.getItem(name);
      if (value) return JSON.parse(value);
      
      // 从IndexedDB回退
      const db = await openDB('SystemDB', 1);
      const stored = await db.get('system', name);
      return stored || null;
    },
    setItem: async (name, value) => {
      localStorage.setItem(name, JSON.stringify(value));
      
      // 同时保存到IndexedDB
      const db = await openDB('SystemDB', 1);
      await db.put('system', value, name);
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    }
  })),
  partialize: (state) => ({
    // 只持久化必要状态
    user: state.user,
    preferences: state.preferences,
    recentRooms: state.recentRooms,
    draftRooms: state.draftRooms
  })
};

export const useSystemStore = create(
  persist(
    (set, get) => ({
      // 用户信息
      user: null,
      sessionId: null,
      
      // 房间管理
      activeRoomId: null,
      rooms: {}, // 房间元数据
      
      // 各模块状态
      modules: {
        whiteboard: {},
        document: {},
        chat: {}
      },
      
      // 同步状态
      syncStatus: {
        isOnline: true,
        isMasterTab: false,
        connectedUsers: 0,
        lastSynced: null
      },
      
      // 操作
      setUser: (user) => set({ user }),
      setActiveRoom: (roomId) => {
        const prevRoomId = get().activeRoomId;
        if (prevRoomId && prevRoomId !== roomId) {
          // 离开前保存当前房间草稿
          get().saveRoomDraft(prevRoomId);
        }
        set({ activeRoomId: roomId });
      },
      
      // 更新模块状态
      updateModuleState: (module, roomId, data) => set((state) => ({
        modules: {
          ...state.modules,
          [module]: {
            ...state.modules[module],
            [roomId]: {
              ...state.modules[module]?.[roomId],
              ...data,
              updatedAt: Date.now()
            }
          }
        }
      })),
      
      // 保存草稿
      saveRoomDraft: async (roomId) => {
        const state = get();
        const draft = {
          whiteboard: state.modules.whiteboard[roomId],
          document: state.modules.document[roomId],
          chat: state.modules.chat[roomId],
          savedAt: Date.now()
        };
        
        // 保存到IndexedDB
        const db = await openDB('RoomDrafts', 1);
        await db.put('drafts', draft, roomId);
        
        // 标记为有草稿
        set((state) => ({
          draftRooms: {
            ...state.draftRooms,
            [roomId]: Date.now()
          }
        }));
      },
      
      // 清理草稿
      clearRoomDraft: async (roomId) => {
        const db = await openDB('RoomDrafts', 1);
        await db.delete('drafts', roomId);
        
        set((state) => ({
          draftRooms: Object.fromEntries(
            Object.entries(state.draftRooms).filter(([id]) => id !== roomId)
          )
        }));
      }
    }),
    storageConfig
  )
);
```

**🔌 3. 统一同步服务**

```jsx
// src/services/SyncService.js
import EventEmitter from 'events';

export class SyncService extends EventEmitter {
  constructor() {
    super();
    
    // 连接管理
    this.ws = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    // 状态管理
    this.connectionId = null;
    this.roomSubscriptions = new Map(); // roomId -> 模块订阅
    this.pendingOperations = new Map(); // roomId -> 待同步操作
    
    // 标签页通信
    this.broadcastChannel = null;
    this.isMaster = false;
    this.otherTabs = new Set();
    
    // 心跳
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    
    this.init();
  }
  
  async init() {
    // 1. 初始化标签页通信
    this.initBroadcastChannel();
    
    // 2. 选举主标签页
    await this.electMaster();
    
    // 3. 建立WebSocket连接（如果是主标签页）
    if (this.isMaster) {
      this.connectWebSocket();
      this.startHeartbeat();
    } else {
      // 从标签页通过主标签页代理通信
      this.setupProxyCommunication();
    }
    
    // 4. 设置存储监听
    this.setupStorageListeners();
    
    // 5. 设置离线检测
    this.setupOfflineDetection();
    
    console.log(`SyncService initialized as ${this.isMaster ? 'MASTER' : 'SLAVE'}`);
  }
  
  // WebSocket连接
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    
    const wsUrl = this.getWebSocketUrl();
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection:open');
      
      // 发送身份验证
      this.send({
        type: 'auth',
        payload: this.getAuthData()
      });
      
      // 重新订阅房间
      this.resubscribeRooms();
      
      // 发送待处理操作
      this.flushPendingOperations();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.emit('connection:close', event);
      
      // 尝试重连
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('connection:error', error);
    };
  }
  
  // 标签页通信
  initBroadcastChannel() {
    this.broadcastChannel = new BroadcastChannel('collab-sync');
    
    this.broadcastChannel.onmessage = (event) => {
      const { type, payload, sourceTabId, isMaster } = event.data;
      
      // 忽略自己发送的消息
      if (sourceTabId === this.tabId) return;
      
      switch (type) {
        case 'tab-joined':
          this.handleTabJoined(payload);
          break;
        case 'tab-left':
          this.handleTabLeft(payload);
          break;
        case 'master-election':
          this.handleMasterElection(payload);
          break;
        case 'sync-operation':
          this.handleSyncOperation(payload);
          break;
        case 'room-data':
          this.handleRoomData(payload);
          break;
      }
    };
    
    // 广播自己的存在
    this.broadcastTabPresence();
  }
  
  // 选举主标签页
  async electMaster() {
    const tabId = this.getTabId();
    
    // 获取所有标签页
    const tabs = await this.getActiveTabs();
    
    if (tabs.length === 0) {
      this.isMaster = true;
      this.setMasterTab(tabId);
    } else {
      const currentMaster = localStorage.getItem('master-tab');
      
      // 检查主标签页是否还活着
      const masterAlive = currentMaster && tabs.includes(currentMaster);
      
      if (!masterAlive || !currentMaster) {
        // 选择最小的tabId作为主标签页
        const sortedTabs = [...tabs, tabId].sort();
        if (sortedTabs[0] === tabId) {
          this.isMaster = true;
          this.setMasterTab(tabId);
        }
      } else if (currentMaster === tabId) {
        this.isMaster = true;
      }
    }
    
    // 广播选举结果
    if (this.isMaster) {
      this.broadcastChannel.postMessage({
        type: 'master-election',
        payload: { masterTabId: tabId },
        sourceTabId: tabId
      });
    }
  }
  
  // 统一消息发送接口
  async sendOperation(module, roomId, operation, options = {}) {
    const operationId = this.generateOperationId();
    const timestamp = Date.now();
    
    const fullOperation = {
      id: operationId,
      module,
      roomId,
      operation,
      timestamp,
      clientId: this.clientId,
      version: await this.getNextVersion(roomId, module),
      metadata: {
        tabId: this.tabId,
        isLocal: true,
        ...options
      }
    };
    
    // 1. 乐观更新本地状态
    this.emit('operation:local', fullOperation);
    
    // 2. 保存到操作日志（用于恢复）
    await this.saveToOperationLog(fullOperation);
    
    // 3. 如果是主标签页，发送到服务器
    if (this.isMaster && this.ws?.readyState === WebSocket.OPEN) {
      this.sendToServer(fullOperation);
    } else if (this.isMaster) {
      // 主标签页但WebSocket未连接，暂存
      this.addPendingOperation(roomId, fullOperation);
    } else {
      // 从标签页，转发给主标签页
      this.broadcastToMaster({
        type: 'forward-operation',
        payload: fullOperation
      });
    }
    
    // 4. 广播到其他标签页（立即同步）
    this.broadcastToOtherTabs({
      type: 'sync-operation',
      payload: fullOperation
    });
    
    return operationId;
  }
  
  // 处理不同类型的数据
  async handleIncomingMessage(message) {
    const { type, payload, roomId, module } = message;
    
    switch (type) {
      case 'operation':
        await this.handleRemoteOperation(payload);
        break;
        
      case 'presence':
        this.handlePresenceUpdate(payload);
        break;
        
      case 'room-state':
        await this.handleRoomState(payload);
        break;
        
      case 'sync-response':
        this.handleSyncResponse(payload);
        break;
        
      case 'conflict':
        await this.handleConflict(payload);
        break;
        
      case 'server-time':
        this.adjustServerTime(payload);
        break;
    }
    
    // 通知订阅者
    if (roomId && module) {
      this.emit(`room:${roomId}:${module}`, message);
    }
  }
  
  // 冲突解决
  async handleConflict(conflictData) {
    const { roomId, module, serverState, clientOperations } = conflictData;
    
    // 获取本地状态
    const localState = await this.getLocalState(roomId, module);
    
    // 使用策略解决冲突
    const resolved = await ConflictResolver.resolve(
      module,
      serverState,
      localState,
      clientOperations
    );
    
    // 更新本地状态
    await this.updateLocalState(roomId, module, resolved);
    
    // 通知UI更新
    this.emit('conflict:resolved', {
      roomId,
      module,
      state: resolved
    });
    
    // 发送解决后的状态到服务器
    this.sendToServer({
      type: 'conflict-resolution',
      roomId,
      module,
      state: resolved
    });
  }
  
  // 数据恢复
  async recoverData(roomId) {
    console.log('开始数据恢复流程...');
    
    const recoverySteps = [
      // 1. 检查内存中的状态
      () => this.getFromMemory(roomId),
      
      // 2. 检查本地草稿
      async () => {
        const db = await openDB('RoomDrafts', 1);
        return db.get('drafts', roomId);
      },
      
      // 3. 检查操作日志
      async () => {
        const operations = await this.getOperationLog(roomId);
        if (operations.length > 0) {
          return this.rebuildFromOperations(roomId, operations);
        }
        return null;
      },
      
      // 4. 从服务器加载
      async () => {
        try {
          const response = await fetch(`/api/rooms/${roomId}/state`);
          if (response.ok) {
            return response.json();
          }
        } catch (error) {
          console.error('从服务器加载失败:', error);
        }
        return null;
      },
      
      // 5. 从其他标签页获取
      async () => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 1000);
          
          const handler = (event) => {
            if (event.data.type === 'room-data-response' && 
                event.data.payload.roomId === roomId) {
              clearTimeout(timeout);
              this.broadcastChannel.removeEventListener('message', handler);
              resolve(event.data.payload.data);
            }
          };
          
          this.broadcastChannel.addEventListener('message', handler);
          
          // 请求其他标签页的数据
          this.broadcastChannel.postMessage({
            type: 'room-data-request',
            payload: { roomId },
            sourceTabId: this.tabId
          });
        });
      }
    ];
    
    // 顺序执行恢复步骤
    for (const step of recoverySteps) {
      try {
        const data = await step();
        if (data) {
          console.log(`从${step.name}恢复数据成功`);
          return data;
        }
      } catch (error) {
        console.warn(`${step.name}恢复失败:`, error);
      }
    }
    
    console.warn('所有恢复步骤都失败，返回空状态');
    return this.getEmptyState(roomId);
  }
}
```

**🧩 4. 模块适配器实现**

**4.1 白板模块适配器**

```jsx
// src/modules/whiteboard/WhiteboardAdapter.js
import { OperationalTransform } from '../../utils/ot';

export class WhiteboardAdapter {
  constructor(roomId, syncService) {
    this.roomId = roomId;
    this.syncService = syncService;
    
    // 白板特有状态
    this.elements = new Map(); // id -> element
    this.elementOrder = [];    // 元素渲染顺序
    this.selection = new Set(); // 选中元素
    this.history = [];         // 操作历史
    
    // OT引擎
    this.otEngine = new OperationalTransform();
    
    // 本地操作队列
    this.localOperations = [];
    this.pendingRemoteOps = [];
    
    this.init();
  }
  
  async init() {
    // 订阅同步事件
    this.unsubscribe = this.syncService.on(
      `room:${this.roomId}:whiteboard`,
      this.handleSyncEvent.bind(this)
    );
    
    // 加载数据
    await this.loadData();
    
    // 设置自动保存
    this.setupAutoSave();
    
    // 设置离线检测
    this.setupOfflineHandler();
  }
  
  // 绘图操作
  async draw(operation) {
    const op = {
      type: 'draw',
      data: operation,
      timestamp: Date.now(),
      clientId: this.syncService.clientId
    };
    
    // 立即应用到本地
    this.applyLocalOperation(op);
    
    // 发送到同步服务
    await this.syncService.sendOperation('whiteboard', this.roomId, op, {
      immediate: true,
      compress: operation.type !== 'path' // 路径数据不压缩
    });
    
    // 添加到历史
    this.history.push({
      operation: op,
      snapshot: this.getSnapshot()
    });
    
    // 限制历史长度
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  // 处理远程操作
  async handleRemoteOperation(operation, source) {
    // 如果是来自其他标签页，检查是否已处理
    if (source === 'broadcast') {
      const alreadyProcessed = this.localOperations.some(
        op => op.id === operation.id
      );
      if (alreadyProcessed) return;
    }
    
    // 应用OT转换
    const transformed = this.otEngine.transform(
      operation,
      this.localOperations
    );
    
    // 应用到本地
    this.applyOperation(transformed);
    
    // 添加到已处理操作
    this.localOperations.push(transformed);
    
    // 通知UI更新
    this.emit('elements:changed', this.getElements());
  }
  
  // 保存草稿
  async saveDraft() {
    const draft = {
      elements: Array.from(this.elements.entries()),
      elementOrder: this.elementOrder,
      history: this.history.slice(-50), // 保存最近50个操作
      timestamp: Date.now(),
      version: await this.getVersion()
    };
    
    // 保存到IndexedDB
    const db = await openDB('WhiteboardDrafts', 1);
    await db.put('drafts', draft, this.roomId);
    
    // 保存到localStorage（快速访问）
    localStorage.setItem(
      `wb-draft-${this.roomId}`,
      JSON.stringify({
        elements: draft.elements.slice(0, 100), // 只保存前100个元素
        version: draft.version
      })
    );
  }
  
  // 数据恢复
  async recover() {
    console.log('恢复白板数据...');
    
    const sources = [
      // 1. 内存
      () => this.elements.size > 0 ? this.getSnapshot() : null,
      
      // 2. localStorage草稿
      () => {
        const draft = localStorage.getItem(`wb-draft-${this.roomId}`);
        return draft ? JSON.parse(draft) : null;
      },
      
      // 3. IndexedDB草稿
      async () => {
        const db = await openDB('WhiteboardDrafts', 1);
        return db.get('drafts', this.roomId);
      },
      
      // 4. 操作日志重建
      async () => {
        const operations = await this.getOperationLog();
        if (operations.length > 0) {
          return this.rebuildFromOperations(operations);
        }
        return null;
      },
      
      // 5. 服务器快照
      async () => {
        try {
          const response = await fetch(`/api/whiteboard/${this.roomId}/snapshot`);
          return response.ok ? response.json() : null;
        } catch (error) {
          return null;
        }
      }
    ];
    
    for (const source of sources) {
      try {
        const data = await source();
        if (data) {
          await this.loadSnapshot(data);
          return true;
        }
      } catch (error) {
        console.warn(`恢复源失败:`, error);
      }
    }
    
    return false;
  }
}
```

**4.2 文档模块适配器（使用Yjs CRDT）**

```jsx
// src/modules/document/DocumentAdapter.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export class DocumentAdapter {
  constructor(roomId, syncService) {
    this.roomId = roomId;
    this.syncService = syncService;
    
    // Yjs文档
    this.ydoc = new Y.Doc();
    
    // 提供者
    this.wsProvider = null;
    this.idbProvider = null;
    
    // 本地状态
    this.isLoading = true;
    this.lastSaved = null;
    this.unsavedChanges = false;
    
    this.init();
  }
  
  async init() {
    // 1. 初始化IndexedDB持久化
    this.idbProvider = new IndexeddbPersistence(
      `document-${this.roomId}`,
      this.ydoc
    );
    
    await this.idbProvider.whenSynced;
    console.log('IndexedDB数据加载完成');
    
    // 2. 初始化WebSocket连接
    if (this.syncService.isMaster) {
      this.initWebSocketProvider();
    } else {
      // 从标签页通过广播同步
      this.setupBroadcastSync();
    }
    
    // 3. 设置自动保存
    this.setupAutoSave();
    
    // 4. 监听变化
    this.setupObservers();
    
    this.isLoading = false;
  }
  
  initWebSocketProvider() {
    this.wsProvider = new WebsocketProvider(
      'wss://your-server.com/yjs',
      this.roomId,
      this.ydoc
    );
    
    this.wsProvider.on('status', (event) => {
      this.emit('connection:status', event);
    });
    
    this.wsProvider.on('sync', (isSynced) => {
      if (isSynced) {
        console.log('Yjs文档同步完成');
        this.emit('document:synced');
      }
    });
  }
  
  // 广播同步（标签页间）
  setupBroadcastSync() {
    this.broadcastChannel = new BroadcastChannel(`yjs-${this.roomId}`);
    
    // 监听来自主标签页的更新
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'yjs-update') {
        Y.applyUpdate(this.ydoc, event.data.update, 'broadcast');
      }
    };
    
    // 监听本地变化并广播
    this.ydoc.on('update', (update, origin) => {
      if (origin === 'local') {
        this.broadcastChannel.postMessage({
          type: 'yjs-update',
          update,
          roomId: this.roomId,
          timestamp: Date.now()
        });
      }
    });
  }
  
  // 编辑文档
  edit(transaction) {
    this.ydoc.transact(() => {
      transaction(this.ydoc.getText('content'));
    }, 'local');
    
    this.unsavedChanges = true;
    this.lastSaved = Date.now();
  }
  
  // 获取文档内容
  getContent() {
    return this.ydoc.getText('content').toString();
  }
  
  // 保存文档
  async save() {
    if (!this.unsavedChanges) return;
    
    // 1. 确保IndexedDB保存
    await this.idbProvider.save();
    
    // 2. 保存到服务器
    if (this.syncService.isOnline) {
      await this.saveToServer();
    }
    
    // 3. 保存草稿到localStorage
    this.saveDraft();
    
    this.unsavedChanges = false;
  }
  
  async saveDraft() {
    const content = this.getContent();
    const draft = {
      content,
      timestamp: Date.now(),
      version: this.ydoc.store.getStateVector()
    };
    
    localStorage.setItem(
      `doc-draft-${this.roomId}`,
      JSON.stringify({
        content: content.slice(0, 10000), // 限制大小
        version: draft.version
      })
    );
  }
}
```

**4.3 聊天模块适配器**

```jsx
// src/modules/chat/ChatAdapter.js
export class ChatAdapter {
  constructor(roomId, syncService) {
    this.roomId = roomId;
    this.syncService = syncService;
    
    this.messages = new Map(); // id -> message
    this.messageOrder = [];    // 消息顺序
    this.unreadCount = 0;
    this.lastRead = null;
    
    this.init();
  }
  
  async init() {
    // 订阅聊天事件
    this.unsubscribe = this.syncService.on(
      `room:${this.roomId}:chat`,
      this.handleChatEvent.bind(this)
    );
    
    // 加载历史消息
    await this.loadHistory();
    
    // 设置消息清理
    this.setupCleanup();
  }
  
  // 发送消息
  async sendMessage(content, options = {}) {
    const messageId = this.generateMessageId();
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    const message = {
      id: messageId,
      tempId,
      content,
      sender: this.syncService.userId,
      timestamp: Date.now(),
      roomId: this.roomId,
      status: 'sending',
      metadata: options
    };
    
    // 1. 立即添加到本地
    this.addMessage(message);
    
    // 2. 发送到同步服务
    await this.syncService.sendOperation('chat', this.roomId, {
      type: 'message',
      data: message
    }, {
      priority: 'high',
      requireAck: true
    });
    
    // 3. 广播到其他标签页
    this.broadcastToTabs({
      type: 'new-message',
      message,
      sourceTabId: this.syncService.tabId
    });
    
    return { messageId, tempId };
  }
  
  // 处理消息确认
  handleMessageAck(messageId, serverId) {
    const message = this.messages.get(messageId) || 
                   this.findByTempId(messageId);
    
    if (message) {
      // 更新消息状态
      message.id = serverId;
      message.status = 'sent';
      delete message.tempId;
      
      // 重新存储
      this.messages.set(serverId, message);
      if (messageId !== serverId) {
        this.messages.delete(messageId);
      }
      
      // 更新UI
      this.emit('message:updated', message);
      
      // 保存到本地
      this.saveToLocal();
    }
  }
  
  // 保存到本地存储
  saveToLocal() {
    // 只保存最近100条消息到localStorage
    const recentMessages = this.messageOrder
      .slice(-100)
      .map(id => this.messages.get(id))
      .filter(Boolean);
    
    localStorage.setItem(
      `chat-${this.roomId}`,
      JSON.stringify({
        messages: recentMessages,
        lastUpdated: Date.now()
      })
    );
    
    // 完整历史保存到IndexedDB
    this.saveToIndexedDB();
  }
  
  // 离线消息处理
  async handleOfflineMessage(message) {
    // 保存到待发送队列
    const db = await openDB('ChatQueue', 1);
    await db.put('pending', message, message.tempId);
    
    // 监听网络恢复
    window.addEventListener('online', async () => {
      const pendingMessages = await db.getAll('pending');
      for (const pending of pendingMessages) {
        await this.resendMessage(pending);
      }
      await db.clear('pending');
    }, { once: true });
  }
  
  // 未读消息计数
  updateUnreadCount() {
    if (!this.isTabActive()) {
      const unread = this.messageOrder.reduce((count, id) => {
        const msg = this.messages.get(id);
        if (msg && msg.timestamp > this.lastRead) {
          return count + 1;
        }
        return count;
      }, 0);
      
      this.unreadCount = unread;
      
      // 更新标签页标题
      if (unread > 0) {
        document.title = `(${unread}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
      }
      
      // 广播未读状态到其他标签页
      this.broadcastUnreadStatus();
    }
  }
}
```

**🏷 5. 标签页管理器**

```jsx
// src/services/TabManager.js
export class TabManager {
  constructor(syncService) {
    this.syncService = syncService;
    this.tabId = this.generateTabId();
    this.isMaster = false;
    this.otherTabs = new Map(); // tabId -> { lastSeen, capabilities }
    this.responsibilities = new Set();
    
    this.init();
  }
  
  init() {
    // 1. 设置BroadcastChannel
    this.setupChannels();
    
    // 2. 选举主标签页
    this.electMaster();
    
    // 3. 设置心跳
    this.setupHeartbeat();
    
    // 4. 设置卸载处理
    this.setupUnloadHandler();
    
    // 5. 分工协作
    this.divideResponsibilities();
  }
  
  setupChannels() {
    // 主通道用于控制消息
    this.controlChannel = new BroadcastChannel('tab-control');
    
    // 数据通道用于大数据传输
    this.dataChannel = new BroadcastChannel('tab-data');
    
    // 消息处理
    this.controlChannel.onmessage = (event) => {
      this.handleControlMessage(event.data);
    };
    
    this.dataChannel.onmessage = (event) => {
      this.handleDataMessage(event.data);
    };
  }
  
  // 选举主标签页
  async electMaster() {
    // 获取所有活跃标签页
    const activeTabs = await this.getActiveTabs();
    
    if (activeTabs.length === 0) {
      // 第一个标签页成为主标签页
      this.isMaster = true;
      this.becomeMaster();
    } else {
      // 检查是否有主标签页
      const masterTab = localStorage.getItem('master-tab');
      
      if (!masterTab || !activeTabs.includes(masterTab)) {
        // 没有主标签页或主标签页已失效
        // 选择最旧的标签页作为主标签页
        const oldestTab = activeTabs.sort()[0];
        if (oldestTab === this.tabId) {
          this.isMaster = true;
          this.becomeMaster();
        }
      } else if (masterTab === this.tabId) {
        this.isMaster = true;
      }
    }
    
    // 广播自己的存在
    this.announcePresence();
  }
  
  becomeMaster() {
    console.log(`标签页 ${this.tabId} 成为主标签页`);
    
    localStorage.setItem('master-tab', this.tabId);
    localStorage.setItem('master-election', Date.now());
    
    // 承担主标签页职责
    this.responsibilities.add('websocket');
    this.responsibilities.add('heartbeat');
    this.responsibilities.add('data-coordination');
    
    // 通知其他标签页
    this.broadcast({
      type: 'master-elected',
      masterTabId: this.tabId,
      timestamp: Date.now()
    });
    
    // 开始执行主标签页任务
    this.startMasterTasks();
  }
  
  // 分工协作
  divideResponsibilities() {
    if (this.isMaster) {
      // 主标签页负责核心连接
      return;
    }
    
    // 从标签页分担其他职责
    const availableResponsibilities = [
      'data-persistence',
      'memory-cleanup',
      'ui-update',
      'offline-queue'
    ];
    
    // 根据标签页索引分配职责
    const tabIndex = Array.from(this.otherTabs.keys())
      .sort()
      .indexOf(this.tabId);
    
    const responsibility = availableResponsibilities[
      tabIndex % availableResponsibilities.length
    ];
    
    this.responsibilities.add(responsibility);
    console.log(`标签页 ${this.tabId} 负责: ${responsibility}`);
  }
  
  // 数据加载协调
  async coordinateDataLoad(roomId, module) {
    if (this.isMaster) {
      // 主标签页从服务器加载
      const data = await this.loadFromServer(roomId, module);
      
      // 存储到共享位置
      this.cache.set(`room-${roomId}-${module}`, data);
      
      // 广播给其他标签页
      this.broadcastData({
        type: 'room-data',
        roomId,
        module,
        data,
        source: 'master'
      });
      
      return data;
    } else {
      // 从主标签页获取或等待
      return this.requestDataFromMaster(roomId, module);
    }
  }
  
  // 标签页间同步状态
  syncStateAcrossTabs(stateKey, stateValue) {
    this.broadcast({
      type: 'state-sync',
      key: stateKey,
      value: stateValue,
      sourceTabId: this.tabId
    });
    
    // 也更新本地存储
    localStorage.setItem(`tab-state-${stateKey}`, JSON.stringify({
      value: stateValue,
      updatedBy: this.tabId,
      timestamp: Date.now()
    }));
  }
  
  // 处理标签页卸载
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      // 1. 保存所有未保存的数据
      this.saveAllData();
      
      // 2. 通知其他标签页
      this.broadcast({
        type: 'tab-leaving',
        tabId: this.tabId,
        timestamp: Date.now()
      });
      
      // 3. 如果是主标签页，转移责任
      if (this.isMaster) {
        this.transferMasterRole();
      }
      
      // 4. 清理本地状态
      this.cleanup();
    });
    
    // 防止重复触发
    window.addEventListener('unload', () => {
      // 最终清理
      localStorage.removeItem(`tab-${this.tabId}`);
    });
  }
  
  // 转移主标签页角色
  transferMasterRole() {
    const otherTabs = Array.from(this.otherTabs.keys());
    if (otherTabs.length > 0) {
      // 选择下一个最旧的标签页
      const newMaster = otherTabs.sort()[0];
      
      this.broadcast({
        type: 'master-transfer',
        newMaster,
        timestamp: Date.now()
      });
      
      localStorage.setItem('master-tab', newMaster);
    }
  }
  
  // 心跳机制
  setupHeartbeat() {
    // 每5秒发送心跳
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        tabId: this.tabId,
        timestamp: Date.now(),
        responsibilities: Array.from(this.responsibilities)
      });
      
      // 清理失效的标签页
      this.cleanupDeadTabs();
    }, 5000);
  }
  
  // 获取所有活跃标签页
  getActiveTabs() {
    const tabs = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('tab-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (now - data.lastSeen < 30000) { // 30秒内活跃
            tabs.push(key.replace('tab-', ''));
          }
        } catch (e) {
          // 清理无效数据
          localStorage.removeItem(key);
        }
      }
    }
    
    return tabs;
  }
}
```

**🔧 6. React Hooks 集成**

```jsx
// src/hooks/useRoom.js
import { useEffect, useCallback, useState, useRef } from 'react';
import { useSystemStore } from '../store/systemStore';
import { SyncService } from '../services/SyncService';
import { TabManager } from '../services/TabManager';

export const useRoom = (roomId) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const syncServiceRef = useRef(null);
  const tabManagerRef = useRef(null);
  
  const systemStore = useSystemStore();
  
  // 初始化房间
  useEffect(() => {
    let mounted = true;
    
    const initializeRoom = async () => {
      try {
        setIsLoading(true);
        
        // 1. 创建同步服务实例
        if (!syncServiceRef.current) {
          syncServiceRef.current = new SyncService();
          tabManagerRef.current = new TabManager(syncServiceRef.current);
        }
        
        // 2. 加入房间
        await syncServiceRef.current.joinRoom(roomId);
        
        // 3. 加载房间数据
        const roomData = await loadRoomData(roomId);
        
        // 4. 更新系统状态
        if (mounted) {
          systemStore.setActiveRoom(roomId);
          systemStore.updateRoomState(roomId, roomData);
          
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };
    
    initializeRoom();
    
    return () => {
      mounted = false;
      
      // 离开房间
      if (syncServiceRef.current) {
        syncServiceRef.current.leaveRoom(roomId);
        
        // 保存草稿
        systemStore.saveRoomDraft(roomId);
      }
    };
  }, [roomId]);
  
  // 白板操作
  const draw = useCallback(async (operation) => {
    if (!syncServiceRef.current) return;
    
    return syncServiceRef.current.sendOperation('whiteboard', roomId, {
      type: 'draw',
      data: operation
    });
  }, [roomId]);
  
  // 文档操作
  const editDocument = useCallback(async (delta) => {
    if (!syncServiceRef.current) return;
    
    return syncServiceRef.current.sendOperation('document', roomId, {
      type: 'edit',
      delta
    });
  }, [roomId]);
  
  // 发送消息
  const sendMessage = useCallback(async (content) => {
    if (!syncServiceRef.current) return;
    
    return syncServiceRef.current.sendOperation('chat', roomId, {
      type: 'message',
      content
    });
  }, [roomId]);
  
  // 保存草稿
  const saveDraft = useCallback(async () => {
    await systemStore.saveRoomDraft(roomId);
  }, [roomId, systemStore]);
  
  // 恢复数据
  const recoverData = useCallback(async (module) => {
    if (!syncServiceRef.current) return null;
    
    return syncServiceRef.current.recoverData(roomId, module);
  }, [roomId]);
  
  return {
    // 状态
    isLoading,
    error,
    
    // 操作
    draw,
    editDocument,
    sendMessage,
    saveDraft,
    recoverData,
    
    // 服务引用
    syncService: syncServiceRef.current,
    tabManager: tabManagerRef.current
  };
};

// src/hooks/usePersistence.js
export const usePersistence = (roomId, module) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const saveDebounced = useCallback(
    debounce(async (data) => {
      setIsSaving(true);
      
      try {
        // 保存到IndexedDB
        const db = await openDB('RoomData', 1);
        await db.put(module, data, roomId);
        
        // 保存到localStorage（快速访问）
        localStorage.setItem(
          `${module}-${roomId}`,
          JSON.stringify({
            data: compressData(data),
            timestamp: Date.now()
          })
        );
        
        setLastSaved(Date.now());
      } catch (error) {
        console.error('保存失败:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [roomId, module]
  );
  
  const load = useCallback(async () => {
    try {
      // 首先尝试localStorage
      const localData = localStorage.getItem(`${module}-${roomId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5分钟内
          return decompressData(parsed.data);
        }
      }
      
      // 然后尝试IndexedDB
      const db = await openDB('RoomData', 1);
      const data = await db.get(module, roomId);
      
      return data || null;
    } catch (error) {
      console.error('加载失败:', error);
      return null;
    }
  }, [roomId, module]);
  
  const clear = useCallback(async () => {
    try {
      localStorage.removeItem(`${module}-${roomId}`);
      
      const db = await openDB('RoomData', 1);
      await db.delete(module, roomId);
    } catch (error) {
      console.error('清理失败:', error);
    }
  }, [roomId, module]);
  
  return {
    save: saveDebounced,
    load,
    clear,
    isSaving,
    lastSaved
  };
};

// src/hooks/useSyncStatus.js
export const useSyncStatus = () => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    lastSynced: null
  });
  
  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const updateSyncStatus = useCallback((updates) => {
    setStatus(prev => ({ ...prev, ...updates }));
  }, []);
  
  return {
    ...status,
    updateSyncStatus
  };
};
```

**🎨 7. React 组件实现**

```jsx
// src/components/providers/RoomProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRoom } from '../../hooks/useRoom';
import { SyncStatus } from '../common/SyncStatus';
import { OfflineIndicator } from '../common/OfflineIndicator';

const RoomContext = createContext();

export const RoomProvider = ({ children, roomId }) => {
  const {
    isLoading,
    error,
    draw,
    editDocument,
    sendMessage,
    saveDraft,
    recoverData,
    syncService,
    tabManager
  } = useRoom(roomId);
  
  // 自动保存间隔
  useEffect(() => {
    if (!syncService) return;
    
    const interval = setInterval(() => {
      saveDraft();
    }, 30000); // 每30秒保存一次
    
    return () => clearInterval(interval);
  }, [syncService, saveDraft]);
  
  // 页面可见性变化处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见，检查更新
        syncService?.checkForUpdates();
      } else {
        // 页面隐藏，保存状态
        saveDraft();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncService, saveDraft]);
  
  const value = {
    roomId,
    isLoading,
    error,
    operations: {
      draw,
      editDocument,
      sendMessage
    },
    services: {
      syncService,
      tabManager
    },
    utils: {
      saveDraft,
      recoverData
    }
  };
  
  if (isLoading) {
    return <div className="room-loading">加载房间中...</div>;
  }
  
  if (error) {
    return (
      <div className="room-error">
        <h3>加载失败</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    );
  }
  
  return (
    <RoomContext.Provider value={value}>
      <SyncStatus />
      <OfflineIndicator />
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);

// src/components/Whiteboard.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useRoomContext } from './providers/RoomProvider';
import { usePersistence } from '../../hooks/usePersistence';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const { roomId, operations, services } = useRoomContext();
  const { save, load } = usePersistence(roomId, 'whiteboard');
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const savedData = await load();
      if (savedData) {
        setElements(savedData.elements || []);
      }
    };
    
    loadData();
  }, [roomId, load]);
  
  // 订阅白板更新
  useEffect(() => {
    if (!services.syncService) return;
    
    const unsubscribe = services.syncService.on(
      `room:${roomId}:whiteboard`,
      (event) => {
        if (event.type === 'operation') {
          handleRemoteOperation(event.payload);
        }
      }
    );
    
    return unsubscribe;
  }, [roomId, services.syncService]);
  
  const handleMouseDown = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setIsDrawing(true);
    
    // 开始新的路径
    const newElement = {
      type: 'path',
      points: [point],
      color: '#000000',
      width: 2,
      id: Date.now().toString()
    };
    
    setElements(prev => [...prev, newElement]);
    
    // 发送绘图操作
    operations.draw({
      type: 'start',
      element: newElement
    });
  };
  
  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setElements(prev => {
      const lastElement = prev[prev.length - 1];
      const updatedElement = {
        ...lastElement,
        points: [...lastElement.points, point]
      };
      
      // 发送更新操作
      operations.draw({
        type: 'continue',
        elementId: lastElement.id,
        point
      });
      
      return [...prev.slice(0, -1), updatedElement];
    });
  };
  
  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // 保存当前状态
    save({ elements, timestamp: Date.now() });
    
    // 发送结束操作
    operations.draw({
      type: 'end',
      timestamp: Date.now()
    });
  };
  
  const handleRemoteOperation = (operation) => {
    // 处理远程绘图操作
    switch (operation.type) {
      case 'start':
        setElements(prev => [...prev, operation.element]);
        break;
      case 'continue':
        setElements(prev => 
          prev.map(el => 
            el.id === operation.elementId
              ? { ...el, points: [...el.points, operation.point] }
              : el
          )
        );
        break;
    }
  };
  
  // 渲染元素
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    elements.forEach(element => {
      if (element.type === 'path' && element.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        
        element.points.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });
  }, [elements]);
  
  return (
    <div className="whiteboard-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          border: '1px solid #ccc',
          cursor: 'crosshair',
          background: 'white'
        }}
      />
      
      <div className="whiteboard-tools">
        <button onClick={() => setElements([])}>清空</button>
        <button onClick={() => save({ elements, timestamp: Date.now() })}>
          保存草稿
        </button>
      </div>
    </div>
  );
};
```

**⚙ 8. 服务端API设计**

```jsx
// 服务器端关键API端点
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { setupWSConnection } = require('y-websocket');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

// WebSocket连接
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // 身份验证
  socket.on('auth', async (data) => {
    const { token, roomId, userId } = data;
    
    try {
      // 验证用户
      const user = await verifyToken(token);
      
      // 加入房间
      socket.join(roomId);
      
      // 通知房间内其他用户
      socket.to(roomId).emit('presence', {
        type: 'user-joined',
        userId: user.id,
        timestamp: Date.now()
      });
      
      // 发送房间状态
      const roomState = await getRoomState(roomId);
      socket.emit('room-state', roomState);
      
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });
  
  // 处理操作
  socket.on('operation', async (data) => {
    const { roomId, module, operation, version, clientId } = data;
    
    try {
      // 验证操作版本
      const isValid = await validateOperationVersion(
        roomId,
        module,
        version
      );
      
      if (!isValid) {
        // 版本冲突，需要解决
        const serverState = await getModuleState(roomId, module);
        socket.emit('conflict', {
          roomId,
          module,
          serverState,
          clientVersion: version
        });
        return;
      }
      
      // 保存操作
      await saveOperation(roomId, module, {
        ...operation,
        clientId,
        timestamp: Date.now(),
        serverVersion: version + 1
      });
      
      // 广播给房间内其他用户
      socket.to(roomId).emit('operation', {
        roomId,
        module,
        operation,
        source: clientId
      });
      
      // 更新房间最后活动时间
      await updateRoomActivity(roomId);
      
    } catch (error) {
      console.error('Error handling operation:', error);
      socket.emit('error', { message: 'Operation failed' });
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // 通知房间内其他用户
    Object.keys(socket.rooms).forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('presence', {
          type: 'user-left',
          userId: socket.userId,
          timestamp: Date.now()
        });
      }
    });
  });
});

// Yjs WebSocket处理
const yjsHandler = (ws, req) => {
  setupWSConnection(ws, req, {
    // Yjs配置
    gc: true,
    // 自定义持久化
    async load(roomName) {
      const doc = await loadYjsDoc(roomName);
      return doc;
    },
    async save(roomName, doc) {
      await saveYjsDoc(roomName, doc);
    }
  });
};

// REST API端点
app.post('/api/rooms/:roomId/sync', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { operations, version, module } = req.body;
    
    // 批量保存操作
    const result = await saveOperationsBatch(roomId, module, operations);
    
    // 返回新的状态
    const currentState = await getModuleState(roomId, module);
    
    res.json({
      success: true,
      data: currentState,
      serverVersion: result.version
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:roomId/state', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { since, modules } = req.query;
    
    const state = await getRoomState(roomId, {
      since: parseInt(since) || 0,
      modules: modules ? modules.split(',') : ['whiteboard', 'document', 'chat']
    });
    
    res.json({
      success: true,
      data: state,
      timestamp: Date.now()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 离线操作同步
app.post('/api/rooms/:roomId/offline-sync', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { operations, lastSynced, clientId } = req.body;
    
    // 应用离线操作
    const result = await applyOfflineOperations(
      roomId,
      operations,
      lastSynced,
      clientId
    );
    
    res.json({
      success: true,
      data: {
        accepted: result.accepted,
        conflicts: result.conflicts,
        newVersion: result.version
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**🛡 9. 安全与优化**

```jsx
// 安全中间件
const securityMiddleware = {
  // 操作验证
  validateOperation: (operation) => {
    // 1. 验证数据大小
    if (JSON.stringify(operation).length > 10000) {
      throw new Error('Operation too large');
    }
    
    // 2. 验证操作类型
    const validTypes = ['draw', 'edit', 'message', 'delete', 'move'];
    if (!validTypes.includes(operation.type)) {
      throw new Error('Invalid operation type');
    }
    
    // 3. 验证数据格式
    switch (operation.type) {
      case 'draw':
        validateDrawOperation(operation.data);
        break;
      case 'edit':
        validateEditOperation(operation.delta);
        break;
      case 'message':
        validateMessage(operation.content);
        break;
    }
    
    return true;
  },
  
  // 频率限制
  rateLimit: (clientId) => {
    const now = Date.now();
    const windowMs = 60000; // 1分钟
    const maxRequests = 100; // 最大请求数
    
    // 获取客户端请求历史
    const requests = getClientRequests(clientId);
    
    // 清理过期请求
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    // 记录本次请求
    recordClientRequest(clientId, now);
    
    return true;
  },
  
  // 数据压缩
  compressData: (data) => {
    // 使用pako进行gzip压缩
    const compressed = pako.gzip(JSON.stringify(data));
    return Buffer.from(compressed).toString('base64');
  },
  
  // 数据解压
  decompressData: (compressed) => {
    try {
      const binaryString = atob(compressed);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decompressed = pako.ungzip(bytes, { to: 'string' });
      return JSON.parse(decompressed);
    } catch (error) {
      throw new Error('Decompression failed');
    }
  }
};

// 性能优化
const performanceOptimizer = {
  // 批量操作处理
  batchOperations: (operations, batchSize = 50) => {
    const batches = [];
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    return batches;
  },
  
  // 操作去重
  deduplicateOperations: (operations) => {
    const seen = new Set();
    return operations.filter(op => {
      const key = `${op.type}-${op.id || JSON.stringify(op.data)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  
  // 懒加载
  lazyLoadModule: async (module, roomId) => {
    // 仅加载可见区域或必要数据
    const viewport = getViewport();
    const neededData = await loadPartialData(roomId, module, viewport);
    
    // 预加载相邻区域
    const adjacentAreas = getAdjacentAreas(viewport);
    prefetchData(roomId, module, adjacentAreas);
    
    return neededData;
  },
  
  // 内存管理
  memoryManager: {
    cleanupOldData: () => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30分钟
      
      // 清理旧的操作日志
      cleanupOperationLog(maxAge);
      
      // 清理旧的缓存
      cleanupCache(maxAge);
      
      // 通知垃圾回收
      if (global.gc) global.gc();
    },
    
    monitorMemory: () => {
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        // 触发清理
        this.cleanupOldData();
      }
    }
  }
};
```

**🚀 10. 部署与监控**

```jsx
// 部署配置
const deploymentConfig = {
  // 前端配置
  frontend: {
    build: {
      output: 'dist',
      sourcemaps: true,
      compression: true
    },
    
    caching: {
      serviceWorker: true,
      cacheStrategy: 'network-first',
      version: process.env.APP_VERSION
    },
    
    monitoring: {
      sentry: true,
      googleAnalytics: true,
      errorTracking: true
    }
  },
  
  // 后端配置
  backend: {
    websocket: {
      maxConnections: 10000,
      pingInterval: 25000,
      pingTimeout: 5000,
      perMessageDeflate: true
    },
    
    redis: {
      url: process.env.REDIS_URL,
      prefix: 'collab:'
    },
    
    database: {
      main: process.env.DATABASE_URL,
      replica: process.env.REPLICA_URL,
      poolSize: 10
    }
  },
  
  // 监控配置
  monitoring: {
    metrics: {
      prometheus: true,
      collectDefaultMetrics: true,
      customMetrics: [
        'operations_per_second',
        'active_connections',
        'room_count',
        'user_count'
      ]
    },
    
    logging: {
      level: 'info',
      format: 'json',
      transports: ['console', 'file']
    },
    
    alerts: {
      // 高延迟警报
      highLatency: {
        threshold: 1000, // 1秒
        channels: ['slack', 'email']
      },
      
      // 高内存使用警报
      highMemory: {
        threshold: '80%',
        channels: ['pagerduty']
      },
      
      // 连接数异常警报
      connectionAnomaly: {
        threshold: '3sigma',
        channels: ['slack']
      }
    }
  }
};

// 健康检查端点
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: getConnectionCount(),
    rooms: getActiveRoomCount(),
    database: checkDatabaseHealth(),
    redis: checkRedisHealth()
  };
  
  // 检查所有组件
  const unhealthyComponents = Object.entries(health)
    .filter(([key, value]) => 
      typeof value === 'object' && value.status === 'unhealthy'
    )
    .map(([key]) => key);
  
  if (unhealthyComponents.length > 0) {
    health.status = 'unhealthy';
    health.unhealthyComponents = unhealthyComponents;
    res.status(503);
  }
  
  res.json(health);
});

// 性能监控中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  // 记录请求
  metrics.increment('http_requests_total', {
    method: req.method,
    route: req.path
  });
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    metrics.histogram('http_request_duration_ms', duration, {
      method: req.method,
      route: req.path,
      status_code: res.statusCode
    });
    
    // 记录慢请求
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        path: req.path,
        duration,
        userId: req.user?.id
      });
    }
  });
  
  next();
});
```

**📊 11. 测试策略**

```jsx
// 测试配置
const testConfig = {
  unit: {
    jest: {
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/tests/setup.js'],
      coverage: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    
    testFiles: [
      '**/*.test.js',
      '**/*.spec.js'
    ]
  },
  
  integration: {
    cypress: {
      baseUrl: 'http://localhost:3000',
      video: true,
      screenshotOnRunFailure: true
    },
    
    scenarios: [
      {
        name: '白板协作',
        steps: [
          '用户A绘制图形',
          '用户B查看更新',
          '用户B添加标注',
          '用户A查看更新',
          '刷新页面验证持久化'
        ]
      },
      {
        name: '多标签页同步',
        steps: [
          '在标签页1中编辑文档',
          '在标签页2中查看更新',
          '在标签页2中继续编辑',
          '关闭标签页1',
          '验证标签页2成为主标签页'
        ]
      },
      {
        name: '离线恢复',
        steps: [
          '断开网络连接',
          '进行编辑操作',
          '重新连接网络',
          '验证数据同步',
          '检查冲突解决'
        ]
      }
    ]
  },
  
  load: {
    k6: {
      vus: 100,
      duration: '5m',
      thresholds: {
        http_req_duration: ['p(95)<500'],
        websocket_ping: ['p(95)<100']
      }
    },
    
    scenarios: [
      {
        name: '高并发协作',
        script: 'tests/load/high-concurrency.js'
      },
      {
        name: '大数据量测试',
        script: 'tests/load/large-data.js'
      }
    ]
  }
};

// 单元测试示例
describe('SyncService', () => {
  let syncService;
  let mockWebSocket;
  
  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN
    };
    
    global.WebSocket = jest.fn(() => mockWebSocket);
    
    syncService = new SyncService();
  });
  
  test('发送操作到服务器', async () => {
    const operation = { type: 'draw', data: { x: 10, y: 20 } };
    
    await syncService.sendOperation('whiteboard', 'room-1', operation);
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('draw')
    );
  });
  
  test('处理操作冲突', async () => {
    const serverState = { version: 5, elements: [] };
    const clientOperations = [
      { type: 'add', element: { id: '1' } }
    ];
    
    const resolved = await syncService.handleConflict({
      roomId: 'room-1',
      module: 'whiteboard',
      serverState,
      clientOperations
    });
    
    expect(resolved.version).toBe(6);
    expect(resolved.elements).toHaveLength(1);
  });
  
  test('离线操作队列', async () => {
    // 模拟离线
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });
    
    const operation = { type: 'message', content: 'Hello' };
    await syncService.sendOperation('chat', 'room-1', operation);
    
    // 操作应该被暂存
    expect(syncService.pendingOperations.size).toBe(1);
    
    // 模拟恢复在线
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });
    
    window.dispatchEvent(new Event('online'));
    
    // 操作应该被发送
    expect(mockWebSocket.send).toHaveBeenCalled();
  });
});

// 集成测试示例
describe('多标签页同步', () => {
  let tab1, tab2;
  
  beforeAll(async () => {
    // 打开两个浏览器标签页
    tab1 = await browser.newPage();
    tab2 = await browser.newPage();
    
    await tab1.goto('http://localhost:3000/room/test');
    await tab2.goto('http://localhost:3000/room/test');
  });
  
  test('标签页间操作同步', async () => {
    // 在标签页1中绘制
    await tab1.click('.draw-tool');
    await tab1.mouse.move(100, 100);
    await tab1.mouse.down();
    await tab1.mouse.move(150, 150);
    await tab1.mouse.up();
    
    // 等待同步
    await tab2.waitForFunction(() => {
      return document.querySelectorAll('.whiteboard-element').length > 0;
    }, { timeout: 5000 });
    
    // 验证标签页2看到更新
    const elementsCount = await tab2.evaluate(() => {
      return document.querySelectorAll('.whiteboard-element').length;
    });
    
    expect(elementsCount).toBe(1);
  });
  
  test('主标签页故障转移', async () => {
    // 获取主标签页
    const masterTab = await getMasterTab();
    
    // 关闭主标签页
    await masterTab.close();
    
    // 等待故障转移
    await page.waitForFunction(() => {
      return localStorage.getItem('master-tab') !== null;
    }, { timeout: 5000 });
    
    // 验证新的主标签页
    const newMaster = await page.evaluate(() => {
      return localStorage.getItem('master-tab');
    });
    
    expect(newMaster).toBeTruthy();
  });
});
```

**✅ 核心特性**

1. **多模块统一管理**：白板、文档、聊天统一架构
2. **标签页间同步**：Broadcast Channel + 主从选举
3. **离线支持**：IndexedDB + 操作队列 + 自动重试
4. **冲突解决**：OT算法 + CRDT + 版本控制
5. **数据持久化**：多级存储 + 自动恢复
6. **性能优化**：懒加载 + 批量处理 + 内存管理

**🚀 部署建议**

1. **渐进式部署**：先实现核心功能，逐步添加模块
2. **监控告警**：实时监控系统状态和性能指标
3. **A/B测试**：新功能先小范围测试
4. **回滚机制**：确保有问题时可以快速回滚

**🔧 维护要点**

1. **定期清理**：清理过期数据和日志
2. **版本迁移**：数据结构变更时的迁移策略
3. **容量规划**：根据用户增长扩展资源
4. **安全更新**：定期更新依赖和修复漏洞