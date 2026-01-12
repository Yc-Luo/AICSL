// =============================================================================
// MongoDB 初始化脚本
// =============================================================================
// 此脚本在 MongoDB 容器首次启动时自动执行
// 用于创建应用数据库和用户
// =============================================================================

// 切换到 admin 数据库进行用户管理
db = db.getSiblingDB('admin');

// 获取环境变量
const appUsername = process.env.MONGO_APP_USERNAME || 'aicsl_app';
const appPassword = process.env.MONGO_APP_PASSWORD || 'change_me_in_production';
const dbName = process.env.MONGODB_DB_NAME || 'aicsl';

// 切换到应用数据库
db = db.getSiblingDB(dbName);

// 创建应用用户
db.createUser({
    user: appUsername,
    pwd: appPassword,
    roles: [
        {
            role: 'readWrite',
            db: dbName
        },
        {
            role: 'dbAdmin',
            db: dbName
        }
    ]
});

print('✅ Application user created: ' + appUsername);
print('✅ Database initialized: ' + dbName);

// =============================================================================
// 创建必要的索引
// =============================================================================

// 用户集合索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ created_at: -1 });
print('✅ Users collection indexes created');

// 项目集合索引
db.projects.createIndex({ owner_id: 1 });
db.projects.createIndex({ created_at: -1 });
db.projects.createIndex({ 'members.user_id': 1 });
print('✅ Projects collection indexes created');

// 活动日志索引 (带 TTL)
db.activity_logs.createIndex({ user_id: 1 });
db.activity_logs.createIndex({ project_id: 1 });
db.activity_logs.createIndex({ action_type: 1 });
db.activity_logs.createIndex(
    { created_at: 1 },
    { expireAfterSeconds: 365 * 24 * 60 * 60 }  // 1年后自动删除
);
print('✅ Activity logs collection indexes created (with 1-year TTL)');

// 刷新令牌索引 (带 TTL)
db.refresh_tokens.createIndex({ user_id: 1 });
db.refresh_tokens.createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0 }  // 到期自动删除
);
print('✅ Refresh tokens collection indexes created');

// AI 对话索引
db.ai_conversations.createIndex({ user_id: 1 });
db.ai_conversations.createIndex({ created_at: -1 });
print('✅ AI conversations collection indexes created');

// 白板数据索引
db.whiteboard_documents.createIndex({ room_id: 1 }, { unique: true });
db.whiteboard_documents.createIndex({ updated_at: -1 });
print('✅ Whiteboard documents collection indexes created');

// 聊天消息索引
db.chat_messages.createIndex({ room_id: 1, created_at: -1 });
db.chat_messages.createIndex({ sender_id: 1 });
print('✅ Chat messages collection indexes created');

// 系统配置索引
db.system_configs.createIndex({ key: 1 }, { unique: true });
print('✅ System configs collection indexes created');

// =============================================================================
// RAG 知识库索引
// =============================================================================

// 资源嵌入索引
db.resource_embeddings.createIndex({ resource_id: 1 });
db.resource_embeddings.createIndex({ project_id: 1 });
db.resource_embeddings.createIndex({ created_at: -1 });
print('✅ Resource embeddings collection indexes created');

// =============================================================================
// 智能体配置索引
// =============================================================================

// 智能体配置索引
db.agent_configs.createIndex({ name: 1, project_id: 1 }, { unique: true });
db.agent_configs.createIndex({ is_system: 1 });
db.agent_configs.createIndex({ enabled: 1 });
print('✅ Agent configs collection indexes created');

// =============================================================================
// 探究学习快照索引
// =============================================================================

// 探究快照索引
db.inquiry_snapshots.createIndex({ project_id: 1 }, { unique: true });
db.inquiry_snapshots.createIndex({ updated_at: -1 });
print('✅ Inquiry snapshots collection indexes created');

// 仪表板快照索引
db.dashboard_snapshots.createIndex({ project_id: 1 }, { unique: true });
db.dashboard_snapshots.createIndex({ updated_at: -1 });
print('✅ Dashboard snapshots collection indexes created');

print('');
print('🎉 MongoDB initialization completed successfully!');
