/**
 * RAG Knowledge Base Management Component
 * For teachers to manage AI knowledge base documents
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Database,
    FileText,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Brain,
    Layers,
    FolderOpen,
    Zap,
    Filter,
    Plus
} from 'lucide-react';
import { ragService, RAGStats, RAGDocument, UnindexedResource } from '../../../../services/api/rag';
import { projectService } from '../../../../services/api/project';
import { Project } from '../../../../types';
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

export default function RAGKnowledgeBase() {
    // State
    const [stats, setStats] = useState<RAGStats | null>(null);
    const [documents, setDocuments] = useState<RAGDocument[]>([]);
    const [unindexedResources, setUnindexedResources] = useState<UnindexedResource[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [showUnindexed, setShowUnindexed] = useState(false);

    // Dialog states
    const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    // Query state
    const [queryText, setQueryText] = useState('');
    const [queryProjectId, setQueryProjectId] = useState('');
    const [queryResults, setQueryResults] = useState<any[]>([]);
    const [querying, setQuerying] = useState(false);

    // Batch indexing state
    const [isBatchIndexing, setIsBatchIndexing] = useState(false);

    // Fetch all data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch projects
            const projectsData = await projectService.getProjects();
            setProjects(projectsData.projects.filter(p => !p.is_archived));

            // Fetch RAG stats
            const statsData = await ragService.getStats();
            setStats(statsData);

            // Fetch indexed documents
            const docsData = await ragService.listDocuments({
                project_id: selectedProjectId || undefined,
                page_size: 100
            });
            setDocuments(docsData.documents);

            // Fetch unindexed resources
            const unindexedData = await ragService.getUnindexedResources(
                selectedProjectId || undefined
            );
            setUnindexedResources(unindexedData.resources);

        } catch (error) {
            console.error('Failed to fetch RAG data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refresh data
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // Add document to RAG
    const handleAddDocument = async (resourceId: string) => {
        try {
            setProcessingIds(prev => new Set(prev).add(resourceId));
            await ragService.addDocument({ resource_id: resourceId });

            // Refresh after a delay to allow background processing
            // PDF processing can take 5-10 seconds
            setTimeout(() => {
                fetchData();
                setProcessingIds(prev => {
                    const next = new Set(prev);
                    next.delete(resourceId);
                    return next;
                });
            }, 5000);
        } catch (error) {
            console.error('Failed to add document:', error);
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(resourceId);
                return next;
            });
        }
    };

    // Remove document from RAG
    const handleRemoveDocument = async (resourceId: string) => {
        if (!confirm('确定要从知识库中移除此文档吗？这将删除所有相关的向量数据。')) return;

        try {
            await ragService.removeDocument(resourceId);
            await fetchData();
        } catch (error) {
            console.error('Failed to remove document:', error);
        }
    };

    // Batch index all unindexed resources
    const handleBatchIndex = async () => {
        try {
            setIsBatchIndexing(true);
            const result = await ragService.batchIndex(selectedProjectId || undefined);
            alert(`已将 ${result.resources_queued} 个文档加入索引队列`);

            // Refresh after delay
            setTimeout(() => {
                fetchData();
                setIsBatchIndexing(false);
            }, 3000);
        } catch (error) {
            console.error('Batch index failed:', error);
            setIsBatchIndexing(false);
        }
    };

    // Query RAG
    const handleQuery = async () => {
        if (!queryText.trim() || !queryProjectId) return;

        try {
            setQuerying(true);
            const result = await ragService.query({
                query: queryText,
                project_id: queryProjectId,
                max_results: 5
            });
            setQueryResults(result.results);
        } catch (error) {
            console.error('Query failed:', error);
        } finally {
            setQuerying(false);
        }
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'indexed':
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已索引
                    </Badge>
                );
            case 'processing':
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        处理中
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-slate-100 text-slate-600 border-0 gap-1">
                        <Clock className="w-3 h-3" />
                        待处理
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                        <AlertCircle className="w-3 h-3" />
                        错误
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-500">加载知识库...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <Brain className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">RAG 知识库</h2>
                                <p className="text-indigo-100 mt-1">管理 AI 助教的知识来源，提升回答质量</p>
                            </div>
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
                            onClick={() => setIsQueryDialogOpen(true)}
                            className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            测试查询
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-4 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <Database className="w-8 h-8 text-indigo-200" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_documents}</p>
                                    <p className="text-xs text-indigo-200 font-medium">已索引文档</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <Layers className="w-8 h-8 text-indigo-200" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_chunks}</p>
                                    <p className="text-xs text-indigo-200 font-medium">文本块</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <FolderOpen className="w-8 h-8 text-indigo-200" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.projects_covered}</p>
                                    <p className="text-xs text-indigo-200 font-medium">覆盖项目</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <Zap className="w-8 h-8 text-indigo-200" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_vectors}</p>
                                    <p className="text-xs text-indigo-200 font-medium">向量数据</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters & Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">全部项目</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowUnindexed(false)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!showUnindexed
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                已索引 ({documents.length})
                            </button>
                            <button
                                onClick={() => setShowUnindexed(true)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${showUnindexed
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                待索引 ({unindexedResources.filter(r => r.supported).length})
                            </button>
                        </div>
                    </div>

                    {showUnindexed && unindexedResources.filter(r => r.supported).length > 0 && (
                        <Button
                            onClick={handleBatchIndex}
                            disabled={isBatchIndexing}
                            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                        >
                            {isBatchIndexing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    索引中...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    批量索引全部
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Documents List */}
            {!showUnindexed ? (
                // Indexed Documents
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    {documents.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">文档名称</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">所属项目</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">文本块</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">状态</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">索引时间</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-indigo-50 rounded-xl">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{doc.filename}</span>
                                                    {doc.size && (
                                                        <span className="text-xs text-slate-400">{formatSize(doc.size)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">
                                                {doc.project_name || '未知项目'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-800">{doc.chunk_count}</span>
                                            <span className="text-xs text-slate-400 ml-1">块</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAddDocument(doc.resource_id)}
                                                    disabled={processingIds.has(doc.resource_id)}
                                                    className="h-9 px-3 hover:bg-indigo-50 text-indigo-600"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${processingIds.has(doc.resource_id) ? 'animate-spin' : ''}`} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveDocument(doc.resource_id)}
                                                    className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Database className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">知识库为空</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                切换到"待索引"标签，将课程资源添加到 AI 知识库中
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                // Unindexed Resources
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    {unindexedResources.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">文件名称</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">所属项目</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">文件类型</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">大小</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">支持状态</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {unindexedResources.map((resource) => (
                                    <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${resource.supported ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                    <FileText className={`w-5 h-5 ${resource.supported ? 'text-amber-600' : 'text-slate-400'}`} />
                                                </div>
                                                <span className="font-bold text-slate-800">{resource.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">
                                                {resource.project_name || '未知项目'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {resource.mime_type.split('/').pop()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatSize(resource.size)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {resource.supported ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0">可索引</Badge>
                                            ) : (
                                                <Badge className="bg-slate-100 text-slate-500 border-0">不支持</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={() => handleAddDocument(resource.id)}
                                                    disabled={!resource.supported || processingIds.has(resource.id)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                                    size="sm"
                                                >
                                                    {processingIds.has(resource.id) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Plus className="w-4 h-4" />
                                                    )}
                                                    添加到知识库
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">全部已索引</h3>
                            <p className="text-gray-500 mt-2">所有可支持的课程资源都已添加到知识库</p>
                        </div>
                    )}
                </div>
            )}

            {/* Query Dialog */}
            <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
                <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Search className="w-5 h-5 text-indigo-600" />
                            测试知识库查询
                        </DialogTitle>
                        <DialogDescription>
                            输入问题测试 RAG 检索效果，查看 AI 助教可以获取到的相关知识
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">选择项目</label>
                            <select
                                value={queryProjectId}
                                onChange={(e) => setQueryProjectId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">选择一个项目</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">查询问题</label>
                            <textarea
                                value={queryText}
                                onChange={(e) => setQueryText(e.target.value)}
                                placeholder="输入你想测试的问题..."
                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleQuery}
                            disabled={!queryText.trim() || !queryProjectId || querying}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {querying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    查询中...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    执行查询
                                </>
                            )}
                        </Button>

                        {queryResults.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="font-bold text-slate-800">检索结果 ({queryResults.length})</h4>
                                {queryResults.map((result, index) => (
                                    <div key={index} className="p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {result.source_type}
                                            </Badge>
                                            <span className="text-xs text-slate-400">
                                                相似度: {(result.score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{result.content || '内容已索引'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setIsQueryDialogOpen(false)}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
