/**
 * Agent Configuration Management Component
 * For teachers to manage AI agent personas and workflows
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Brain,
    Plus,
    Settings,
    Trash2,
    Copy,
    ToggleLeft,
    ToggleRight,
    Edit,
    Save,
    RefreshCw,
    Loader2,
    GraduationCap,
    Users,
    HelpCircle,
    Heart,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { agentService, AgentConfig, AgentConfigUpdate } from '../../../../services/api/agents';
import {
    Button,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../../../ui';

// Icon mapping
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'brain': Brain,
    'graduation-cap': GraduationCap,
    'users': Users,
    'help-circle': HelpCircle,
    'heart': Heart,
    'sparkles': Sparkles,
    'settings': Settings
};

// Color options
const COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316'
];

export default function AgentManager() {
    // State
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Edit state
    const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<AgentConfigUpdate>({});
    const [saving, setSaving] = useState(false);

    // Create state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        display_name: '',
        description: '',
        system_prompt: '',
        icon: 'brain',
        color: '#6366f1',
        temperature: 0.7,
        max_tokens: 2000,
        role_type: 'specialist'
    });

    // Expanded prompts
    const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

    // Fetch agents
    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await agentService.listAgents();
            setAgents(data.agents);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    // Refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAgents();
        setRefreshing(false);
    };

    // Toggle agent
    const handleToggle = async (agent: AgentConfig) => {
        if (agent.name === 'supervisor' && agent.enabled) {
            alert('无法禁用首席引导员');
            return;
        }
        try {
            const updated = await agentService.toggleAgent(agent.id);
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
        } catch (error) {
            console.error('Failed to toggle agent:', error);
        }
    };

    // Edit agent
    const openEditDialog = (agent: AgentConfig) => {
        setEditingAgent(agent);
        setEditForm({
            display_name: agent.display_name,
            description: agent.description,
            system_prompt: agent.system_prompt,
            icon: agent.icon,
            color: agent.color,
            temperature: agent.temperature,
            max_tokens: agent.max_tokens,
            role_type: agent.role_type,
            can_be_router_target: agent.can_be_router_target
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingAgent) return;
        try {
            setSaving(true);
            const updated = await agentService.updateAgent(editingAgent.id, editForm);
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
            setIsEditDialogOpen(false);
            setEditingAgent(null);
        } catch (error) {
            console.error('Failed to update agent:', error);
        } finally {
            setSaving(false);
        }
    };

    // Create agent
    const handleCreate = async () => {
        if (!createForm.name || !createForm.display_name || !createForm.system_prompt) {
            alert('请填写必填字段');
            return;
        }
        try {
            setSaving(true);
            const created = await agentService.createAgent(createForm);
            setAgents(prev => [...prev, created]);
            setIsCreateDialogOpen(false);
            setCreateForm({
                name: '',
                display_name: '',
                description: '',
                system_prompt: '',
                icon: 'brain',
                color: '#6366f1',
                temperature: 0.7,
                max_tokens: 2000,
                role_type: 'specialist'
            });
        } catch (error) {
            console.error('Failed to create agent:', error);
        } finally {
            setSaving(false);
        }
    };

    // Delete agent
    const handleDelete = async (agent: AgentConfig) => {
        if (agent.is_system) {
            alert('无法删除系统智能体');
            return;
        }
        if (!confirm(`确定要删除智能体 "${agent.display_name}" 吗？`)) return;

        try {
            await agentService.deleteAgent(agent.id);
            setAgents(prev => prev.filter(a => a.id !== agent.id));
        } catch (error) {
            console.error('Failed to delete agent:', error);
        }
    };

    // Duplicate agent
    const handleDuplicate = async (agent: AgentConfig) => {
        const newName = prompt('请输入新智能体的标识名称（英文）：', `${agent.name}_copy`);
        if (!newName) return;

        try {
            const duplicated = await agentService.duplicateAgent(agent.id, newName);
            setAgents(prev => [...prev, duplicated]);
        } catch (error) {
            console.error('Failed to duplicate agent:', error);
        }
    };

    // Toggle prompt expansion
    const togglePromptExpansion = (id: string) => {
        setExpandedPrompts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Get icon component
    const getIcon = (iconName: string) => {
        return ICONS[iconName] || Brain;
    };

    // Get role badge
    const getRoleBadge = (roleType: string) => {
        switch (roleType) {
            case 'supervisor':
                return <Badge className="bg-purple-100 text-purple-700 border-0">首席引导员</Badge>;
            case 'specialist':
                return <Badge className="bg-blue-100 text-blue-700 border-0">专业智能体</Badge>;
            case 'critic':
                return <Badge className="bg-amber-100 text-amber-700 border-0">评审智能体</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-600 border-0">{roleType}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-500">加载智能体配置...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Brain className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">智能体配置</h2>
                            <p className="text-violet-100 mt-1">管理 AI 助教的角色、行为和工作流程</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            刷新
                        </Button>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            创建智能体
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold">{agents.length}</p>
                        <p className="text-sm text-violet-200">总智能体数</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold">{agents.filter(a => a.enabled).length}</p>
                        <p className="text-sm text-violet-200">已启用</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <p className="text-3xl font-bold">{agents.filter(a => a.is_system).length}</p>
                        <p className="text-sm text-violet-200">系统智能体</p>
                    </div>
                </div>
            </div>

            {/* Agent List */}
            <div className="space-y-4">
                {agents.map(agent => {
                    const IconComponent = getIcon(agent.icon);
                    const isExpanded = expandedPrompts.has(agent.id);

                    return (
                        <div
                            key={agent.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${agent.enabled ? 'border-gray-100' : 'border-gray-200 opacity-60'
                                }`}
                        >
                            {/* Agent Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
                                            style={{ backgroundColor: agent.color }}
                                        >
                                            <IconComponent className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-slate-800">{agent.display_name}</h3>
                                                {getRoleBadge(agent.role_type)}
                                                {agent.is_system && (
                                                    <Badge className="bg-slate-100 text-slate-500 border-0 gap-1">
                                                        <Settings className="w-3 h-3" />
                                                        系统
                                                    </Badge>
                                                )}
                                                {!agent.enabled && (
                                                    <Badge className="bg-red-100 text-red-600 border-0">已禁用</Badge>
                                                )}
                                            </div>
                                            <p className="text-slate-500 mt-1">{agent.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                                <span>ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{agent.name}</code></span>
                                                <span>温度: {agent.temperature}</span>
                                                <span>最大 Token: {agent.max_tokens}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggle(agent)}
                                            className={`h-9 ${agent.enabled ? 'text-emerald-600' : 'text-slate-400'}`}
                                        >
                                            {agent.enabled ? (
                                                <ToggleRight className="w-5 h-5" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(agent)}
                                            className="h-9 text-slate-600 hover:text-indigo-600"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDuplicate(agent)}
                                            className="h-9 text-slate-600 hover:text-blue-600"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        {!agent.is_system && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(agent)}
                                                className="h-9 text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Expandable Prompt */}
                                <button
                                    onClick={() => togglePromptExpansion(agent.id)}
                                    className="flex items-center gap-2 mt-4 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {isExpanded ? '收起' : '展开'} System Prompt
                                </button>
                            </div>

                            {/* Prompt Content */}
                            {isExpanded && (
                                <div className="px-6 pb-6">
                                    <pre className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                                        {agent.system_prompt}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Edit className="w-5 h-5 text-indigo-600" />
                            编辑智能体 - {editingAgent?.display_name}
                        </DialogTitle>
                        <DialogDescription>
                            修改智能体的行为配置和 System Prompt
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">显示名称</label>
                                <input
                                    type="text"
                                    value={editForm.display_name || ''}
                                    onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">角色类型</label>
                                <select
                                    value={editForm.role_type || 'specialist'}
                                    onChange={e => setEditForm({ ...editForm, role_type: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="supervisor">首席引导员</option>
                                    <option value="specialist">专业智能体</option>
                                    <option value="critic">评审智能体</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">描述</label>
                            <input
                                type="text"
                                value={editForm.description || ''}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">温度 (0-2)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={editForm.temperature || 0.7}
                                    onChange={e => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">最大 Token</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="8000"
                                    value={editForm.max_tokens || 2000}
                                    onChange={e => setEditForm({ ...editForm, max_tokens: parseInt(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">颜色</label>
                            <div className="flex gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditForm({ ...editForm, color })}
                                        className={`w-8 h-8 rounded-lg transition-transform ${editForm.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">System Prompt</label>
                            <textarea
                                value={editForm.system_prompt || ''}
                                onChange={e => setEditForm({ ...editForm, system_prompt: e.target.value })}
                                placeholder="定义智能体的行为规则和角色设定..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[200px] resize-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    保存中...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    保存更改
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-violet-600" />
                            创建新智能体
                        </DialogTitle>
                        <DialogDescription>
                            定义新的 AI 角色及其行为规则
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">标识名称 (英文) *</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value.replace(/[^a-z0-9_]/g, '') })}
                                    placeholder="my_agent"
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">显示名称 *</label>
                                <input
                                    type="text"
                                    value={createForm.display_name}
                                    onChange={e => setCreateForm({ ...createForm, display_name: e.target.value })}
                                    placeholder="我的智能体"
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">描述</label>
                            <input
                                type="text"
                                value={createForm.description}
                                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                placeholder="简要描述智能体的职责..."
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">颜色</label>
                            <div className="flex gap-2">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCreateForm({ ...createForm, color })}
                                        className={`w-8 h-8 rounded-lg transition-transform ${createForm.color === color ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">System Prompt *</label>
                            <textarea
                                value={createForm.system_prompt}
                                onChange={e => setCreateForm({ ...createForm, system_prompt: e.target.value })}
                                placeholder="定义智能体的行为规则和角色设定..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none min-h-[200px] resize-none font-mono text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={saving || !createForm.name || !createForm.display_name || !createForm.system_prompt}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    创建中...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    创建智能体
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
