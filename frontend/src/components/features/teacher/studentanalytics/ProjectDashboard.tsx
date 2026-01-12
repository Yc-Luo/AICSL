import { useState, useEffect } from 'react';
import { TrendingUp, Download, Users, Clock, Target, FolderOpen, Brain } from 'lucide-react';
import { Button, Badge } from '../../../ui';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { projectService } from '../../../../services/api/project';
import { analyticsService } from '../../../../services/api/analytics';
import { Project } from '../../../../types';

export default function ProjectDashboard() {
    // Basic States
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fetchingAnalytics, setFetchingAnalytics] = useState(false);

    // Feature States
    const [activeTab, setActiveTab] = useState<'dashboard' | 'behavior'>('dashboard');
    const [behaviorLogs, setBehaviorLogs] = useState<any[]>([]);
    const [fetchingLogs, setFetchingLogs] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const data = await projectService.getProjects();
                setProjects(data.projects);
                if (data.projects.length > 0) {
                    setSelectedProjectId(data.projects[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch projects for analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedProjectId) return;
            try {
                setFetchingAnalytics(true);
                const data = await analyticsService.getDashboardData(selectedProjectId);
                setAnalyticsData(data);
            } catch (error) {
                console.error('Failed to fetch analytics data:', error);
            } finally {
                setFetchingAnalytics(false);
            }
        };

        if (activeTab === 'dashboard' && selectedProjectId) {
            fetchAnalytics();
        }
    }, [selectedProjectId, activeTab]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!selectedProjectId) return;
            try {
                setFetchingLogs(true);
                const data = await analyticsService.getActivityLogs(selectedProjectId);
                setBehaviorLogs(data);
            } catch (error) {
                console.error('Failed to fetch behavior logs:', error);
            } finally {
                setFetchingLogs(false);
            }
        };

        if (activeTab === 'behavior' && selectedProjectId) {
            fetchLogs();
        }
    }, [selectedProjectId, activeTab]);

    const handleExport = async (format: 'csv' | 'json') => {
        if (!selectedProjectId) return;
        try {
            const data = await analyticsService.exportData(selectedProjectId, format);
            const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
                type: format === 'json' ? 'application/json' : 'text/csv'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project_analytics_${selectedProjectId}.${format}`;
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-500">加载中...</span>
        </div>;
    }

    // Data Transformation for Charts
    const fourCData = analyticsData ? [
        { name: '沟通', value: analyticsData.four_c.communication, color: '#3b82f6' },
        { name: '协作', value: analyticsData.four_c.collaboration, color: '#22c55e' },
        { name: '批判思维', value: analyticsData.four_c.critical_thinking, color: '#f59e0b' },
        { name: '创造力', value: analyticsData.four_c.creativity, color: '#a855f7' },
    ] : [];

    const activityTrend = analyticsData?.activity_trend?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        score: item.activity_score,
        minutes: item.active_minutes
    })) || [];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">项目仪表盘</h1>
                    <p className="text-sm text-slate-500 mt-1">可视化监控项目进度、团队表现与原始行为日志</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FolderOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    学情分析看板
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'behavior' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    行为流记录 (Logs)
                </button>
            </div>

            {activeTab === 'dashboard' ? (
                fetchingAnalytics ? (
                    <div className="flex items-center justify-center h-96 bg-white rounded-2xl border border-gray-100">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : analyticsData ? (
                    <>
                        {/* Summary Section */}
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-slate-800">核心指标摘要</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-2 rounded-lg">
                                    <Download className="w-4 h-4" /> 导出 CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleExport('json')} className="gap-2 rounded-lg">
                                    <Download className="w-4 h-4" /> 导出 JSON
                                </Button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: '综合能力评分', value: `${((Object.values(analyticsData.four_c).reduce((a: any, b: any) => a + b, 0) as number) / 4).toFixed(1)}%`, icon: Target, color: 'blue' },
                                { label: '学习时长累计', value: `${analyticsData.summary.total_active_minutes} min`, icon: Clock, color: 'green' },
                                { label: '活跃度指数', value: analyticsData.summary.total_activity_score.toFixed(0), icon: TrendingUp, color: 'purple' },
                                { label: '团队成员参与', value: `${analyticsData.summary.member_count} 人`, icon: Users, color: 'amber' }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center mb-4`}>
                                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-800">4C 能力雷达/分布</h3>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-0">能力基准</Badge>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={fourCData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                            {fourCData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-800">团队活跃趋势</h3>
                                    <Badge variant="secondary" className="bg-green-50 text-green-600 border-0">实时更新</Badge>
                                </div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={activityTrend}>
                                        <defs>
                                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fill="url(#trendGradient)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* AI Insights */}
                        <div className="bg-white p-8 rounded-2xl border border-indigo-100 mt-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                学习行为分析建议
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {analyticsData.learning_suggestions.map((s: any) => (
                                    <div key={s.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors border-l-4 border-l-indigo-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className={s.type === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}>
                                                {s.type === 'critical' ? '紧急干预' : '教学建议'}
                                            </Badge>
                                            <h4 className="font-bold text-slate-800">{s.title}</h4>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{s.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-slate-400">选择一个项目开始分析</p>
                    </div>
                )
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800">详细行为流记录</h2>
                        <span className="text-xs text-slate-400">实时捕捉项目成员的每一项关键操作</span>
                    </div>
                    {fetchingLogs ? (
                        <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">用户</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">操作时间</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">操作内容</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">所属模块</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">持续时长</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {behaviorLogs.length > 0 ? behaviorLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-indigo-600">User_{log.user_id.slice(-4)}</td>
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="rounded-md font-medium px-2 py-0.5">{log.action}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{log.module} <span className="text-slate-300 mx-1">/</span> {log.resource_id ? <span className="text-xs opacity-70 italic">{log.resource_id.slice(-8)}</span> : '-'}</td>
                                            <td className="px-6 py-4">
                                                {log.duration ? (
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {log.duration}s
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="px-6 py-24 text-center text-slate-400 font-medium">暂无行为轨迹数据</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
