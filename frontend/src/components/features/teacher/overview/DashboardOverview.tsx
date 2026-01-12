import { useState, useEffect } from 'react';
import {
    Users,
    Layers,
    CheckCircle2,
    FileText,
    TrendingUp,
    Clock,
    Plus,
    Upload,
    Bell,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';
import { projectService } from '../../../../services/api/project';
import { taskService } from '../../../../services/api/task';
import { storageService } from '../../../../services/api/storage';
import { Button } from '../../../ui';

export default function DashboardOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        classCount: 0,
        activeProjects: 0,
        pendingTasks: 0,
        resourceCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const projectsData = await projectService.getProjects();
                const activeProjects = projectsData.projects.filter(p => !p.is_archived);

                let totalTasks = 0;
                let totalResources = 0;

                await Promise.all(activeProjects.map(async (project) => {
                    try {
                        const tasksData = await taskService.getTasks(project.id);
                        totalTasks += tasksData.tasks.filter(t => t.column === 'done').length;

                        const resData = await storageService.getResources(project.id);
                        totalResources += resData.resources.length;
                    } catch (err) {
                        console.error(err);
                    }
                }));

                setStats({
                    classCount: 3, // Mocked for now
                    activeProjects: activeProjects.length,
                    pendingTasks: totalTasks,
                    resourceCount: totalResources
                });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: '活跃班级', value: stats.classCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: '正在进行的项目', value: stats.activeProjects, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: '待评审任务', value: stats.pendingTasks, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { label: '课程资源', value: stats.resourceCount, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header section with Welcome and Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">下午好，教师专家 👋</h1>
                    <p className="text-slate-500 mt-2 font-medium">这是您今天的教学概览，一切都在掌控之中。</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button onClick={() => navigate(ROUTES.TEACHER.PROJECT_MANAGER)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                        <Plus className="w-4 h-4" /> 发布新项目
                    </Button>
                    <Button variant="outline" onClick={() => navigate(ROUTES.TEACHER.COURSE_RESOURCES)} className="gap-2 border-slate-200">
                        <Upload className="w-4 h-4" /> 上传资源
                    </Button>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div className={`${card.bg} p-3 rounded-xl`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div className="flex items-center text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +12%
                            </div>
                        </div>
                        <div className="mt-5">
                            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-slate-900">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            最近动态
                        </h2>
                        <Button variant="ghost" size="sm" className="text-indigo-600 font-semibold" onClick={() => navigate(ROUTES.TEACHER.PROJECT_MONITOR)}>
                            查看全部 <ExternalLink className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="p-5 hover:bg-slate-50/50 transition-colors flex gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-slate-500">
                                    组
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        <span className="text-indigo-600">探究小组 B</span> 提交了任务 <span className="font-bold">“文献综述初稿”</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">10 分钟前</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                                    评审
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications/Tasks */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-slate-900">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-500" />
                            教学备忘
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <p className="text-sm font-bold text-orange-900 text-slate-900">今日有 3 个班级待巡查</p>
                            <p className="text-xs text-orange-700 mt-1">请重点关注“人工智能”项目的进度。</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-sm font-bold text-blue-900 text-slate-900">资源库更新提示</p>
                            <p className="text-xs text-blue-700 mt-1">您上传的“探究式学习手册”已被下载 45 次。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
