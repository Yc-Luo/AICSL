import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserPlus,
    Search,
    Trash2,
    Calendar,
    BookOpen,
    GraduationCap,
    Copy,
    Settings,
    Check
} from 'lucide-react';
import {
    Button,
    Input,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../../../ui';
import { courseService, Course } from '../../../../services/api/course';

export default function ClassManagement() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [semester, setSemester] = useState('2026 春季');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const data = await courseService.getCourses();
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleCopyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await courseService.createCourse({ name, semester, description });
            setIsCreateOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            console.error('Create course failed:', error);
            alert('创建失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        try {
            setSubmitting(true);
            await courseService.updateCourse(selectedCourse.id, { name, description });
            setIsEditOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            console.error('Update course failed:', error);
            alert('更新失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`确定要删除班级 "${name}" 吗？此操作不可撤销。`)) {
            try {
                await courseService.deleteCourse(id);
                fetchCourses();
            } catch (error) {
                console.error('Delete course failed:', error);
                alert('删除失败，该班级可能仍有关联数据');
            }
        }
    };

    const resetForm = () => {
        setName('');
        setSemester('2026 春季');
        setDescription('');
        setSelectedCourse(null);
    };

    const openEdit = (course: Course) => {
        setSelectedCourse(course);
        setName(course.name);
        setSemester(course.semester);
        setDescription(course.description || '');
        setIsEditOpen(true);
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.semester.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && courses.length === 0) {
        return <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-500 font-medium">加载班级中...</span>
        </div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">班级管理</h1>
                    <p className="text-sm text-slate-500 mt-1">创建和维护您的教学班级，学生通过邀请码加入协作空间。</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsCreateOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md shadow-indigo-100 rounded-xl px-5"
                >
                    <UserPlus className="w-4 h-4" />
                    创建新班级
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">总班级数</p>
                            <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">学生总数</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {courses.reduce((acc, c) => acc + (c.students?.length || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">当前学期</p>
                            <p className="text-2xl font-bold text-slate-900">2026 春季</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        placeholder="搜索班级名称或学期..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all rounded-xl"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">班级信息</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">学期</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">人数</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">邀请码</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <Users className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{course.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{course.description || '暂无描述'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                            {course.semester}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => navigate(`/teacher/student-list?courseId=${course.id}`)}
                                            className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                                        >
                                            {course.students?.length || 0} 名学生
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <code className="bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-mono text-sm font-bold tracking-tight">
                                                {course.invite_code}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm"
                                                onClick={() => handleCopyCode(course.invite_code, course.id)}
                                            >
                                                {copiedId === course.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-indigo-600"
                                                onClick={() => openEdit(course)}
                                            >
                                                <Settings className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600"
                                                onClick={() => handleDelete(course.id, course.name)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium">未找到相关班级数据</p>
                                            <Button variant="link" className="text-indigo-600 mt-2" onClick={() => { setSearchQuery(''); fetchCourses(); }}>刷新列表</Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">创建新班级</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2">
                            班级创建后，您将获得唯一的邀请码，学生凭此加入系统。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800">班级名称</label>
                            <Input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="例如：2026级软件工程1班"
                                className="rounded-xl bg-slate-50 border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800">所属学期</label>
                            <select
                                value={semester}
                                onChange={e => setSemester(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option>2026 春季</option>
                                <option>2025 秋季</option>
                                <option>2025 春季</option>
                                <option>2024 秋季</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800">描述（可选）</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                placeholder="班级简介或备注信息..."
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl">取消</Button>
                            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100">
                                {submitting ? '创建中...' : '确认创建'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">修改班级信息</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2">
                            更新班级的名称或备注，这些更改对所有成员即时生效。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800">班级名称</label>
                            <Input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="rounded-xl bg-slate-50 border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-800">描述</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl">取消</Button>
                            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-100">
                                {submitting ? '保存修改' : '确认修改'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
