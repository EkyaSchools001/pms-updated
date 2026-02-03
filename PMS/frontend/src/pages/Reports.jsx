import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Calendar, CheckCircle, AlertCircle, ChevronRight, LayoutGrid, List, Plus, Edit2, X, Save, MessageSquare } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import { format, differenceInDays, eachDayOfInterval, isSameDay, addDays, startOfWeek } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('DASHBOARD'); // DASHBOARD, GANTT, LOGS
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        startDate: '',
        dueDate: '',
        assigneeIds: []
    });


    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const [projectsRes, usersRes, logsRes] = await Promise.all([
                api.get('projects'),
                api.get('users'),
                api.get('time-logs')
            ]);
            setProjects(projectsRes.data);
            setUsers(usersRes.data);
            setTimeLogs(logsRes.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
            setError(error.response?.data?.message || 'Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('tasks', { ...newTask, projectId: selectedProjectId });
            setShowTaskModal(false);
            fetchReports();
            setNewTask({ title: '', description: '', priority: 'MEDIUM', startDate: '', dueDate: '', assigneeIds: [] });
        } catch (error) {
            alert('Failed to create task');
        }
    };

    const handleAddTask = (projectId) => {
        setSelectedProjectId(projectId);
        setShowTaskModal(true);
    };


    const calculateProgress = (project) => {
        const totalTasks = project.tasks?.length || 0;
        if (totalTasks === 0) return project.status === 'COMPLETED' ? 100 : 0;
        const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
        return Math.round((completedTasks / totalTasks) * 100);
    };

    const totalLoggedHours = timeLogs.reduce((acc, log) => acc + parseFloat(log.hours), 0);

    const overallStats = {
        totalProjects: projects.length,
        avgProgress: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + calculateProgress(p), 0) / projects.length) : 0,
        activeUsers: users.length,
        completedTasks: projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'DONE').length || 0), 0),
        totalTasks: projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0),
        totalHours: totalLoggedHours
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                        <BarChart3 className="text-primary" size={36} />
                        Analytics Hub
                    </h1>
                    <p className="text-gray-500 text-lg">Intelligent insights and project performance tracking</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <button
                        onClick={() => setViewMode('DASHBOARD')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            viewMode === 'DASHBOARD' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('GANTT')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            viewMode === 'GANTT' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Calendar size={18} /> Gantt
                    </button>
                    <button
                        onClick={() => setViewMode('LOGS')}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            viewMode === 'LOGS' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Clock size={18} /> Squad Logs
                    </button>
                </div>
            </div>

            {viewMode === 'DASHBOARD' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={BarChart3} label="Total Projects" value={overallStats.totalProjects} color="blue" trend="+4% from last month" />
                        <StatCard icon={TrendingUp} label="Avg. Progress" value={`${overallStats.avgProgress}%`} color="emerald" trend="+12 points" />
                        <StatCard icon={Clock} label="Hours Logged" value={`${overallStats.totalHours}h`} color="amber" subValue="Collective effort" />
                        <StatCard icon={Users} label="Squad Size" value={overallStats.activeUsers} color="purple" trend="Stable" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Project Progress Tracker */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-between">
                                Project Completion
                                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Live Tracking</span>
                            </h2>
                            <div className="space-y-8">
                                {projects.map(project => {
                                    const progress = calculateProgress(project);
                                    return (
                                        <div key={project.id} className="group">
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                                                    <p className="text-xs text-gray-500 font-medium">{project.tasks?.length || 0} tasks • {project.status.replace('_', ' ')}</p>
                                                </div>
                                                <span className="text-xl font-black text-gray-900">{progress}%</span>
                                            </div>
                                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                                                <div
                                                    className={clsx(
                                                        "h-full transition-all duration-1000 ease-out relative",
                                                        progress === 100 ? "bg-emerald-500" : progress > 60 ? "bg-primary" : progress > 30 ? "bg-amber-500" : "bg-rose-500"
                                                    )}
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute top-0 right-0 h-full w-8 bg-white/20 skew-x-[30deg] animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Distribution */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8">Work Distribution</h2>
                            <div className="space-y-6">
                                {['DONE', 'IN_PROGRESS', 'TODO', 'IN_REVIEW'].map(status => {
                                    const count = projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === status).length || 0), 0);
                                    const percentage = overallStats.totalTasks > 0 ? Math.round((count / overallStats.totalTasks) * 100) : 0;
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                                    <div className={clsx("w-2 h-2 rounded-full", status === 'DONE' ? "bg-emerald-500" : status === 'IN_PROGRESS' ? "bg-primary" : status === 'IN_REVIEW' ? "bg-amber-500" : "bg-gray-400")}></div>
                                                    {status.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs font-bold text-gray-500">{count} ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                                <div className={clsx("h-full bg-current", status === 'DONE' ? "text-emerald-500" : status === 'IN_PROGRESS' ? "text-primary" : status === 'IN_REVIEW' ? "text-amber-500" : "text-gray-400")} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {viewMode === 'GANTT' && (
                <GanttChartView projects={projects} user={user} onRefresh={fetchReports} onAddTask={handleAddTask} />
            )}


            {viewMode === 'LOGS' && (
                <WorkLogsView timeLogs={timeLogs} />
            )}

            {showTaskModal && (
                <TaskModal
                    onClose={() => setShowTaskModal(false)}
                    onSubmit={handleCreateTask}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    members={users}
                />
            )}
        </div>

    );
};

const StatCard = ({ icon: Icon, label, value, color, trend, subValue }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="relative z-10">
                <div className={clsx("p-4 rounded-2xl inline-flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colorClasses[color])}>
                    <Icon size={24} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-gray-900">{value}</p>
                    {subValue && <span className="text-xs font-bold text-gray-400">{subValue}</span>}
                </div>
                {trend && <p className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={12} /> {trend}</p>}
            </div>
        </div>
    );
};

const WorkLogsView = ({ timeLogs }) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <Clock className="text-amber-500" size={28} />
                Squad Work Logs
            </h2>
            <p className="text-gray-500 font-medium">Historical record of performance hours logged by the team</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-4 border-b">Member</th>
                        <th className="px-8 py-4 border-b">Project / Task</th>
                        <th className="px-8 py-4 border-b text-center">Duration</th>
                        <th className="px-8 py-4 border-b">Description</th>
                        <th className="px-8 py-4 border-b">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {timeLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase">
                                        {log.user.fullName.charAt(0)}
                                    </div>
                                    <span className="font-bold text-gray-900">{log.user.fullName}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-primary uppercase tracking-tighter">{log.project.name}</span>
                                    {log.task && <span className="text-xs text-gray-500 font-medium">{log.task.title}</span>}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-black text-xs">
                                    {log.hours}h
                                </span>
                            </td>
                            <td className="px-8 py-5">
                                <p className="text-xs text-gray-600 font-medium line-clamp-1 max-w-xs">{log.description || 'No notes'}</p>
                            </td>
                            <td className="px-8 py-5">
                                <span className="text-xs font-bold text-gray-400">
                                    {format(new Date(log.date), 'MMM dd, yyyy')}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {timeLogs.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold italic">
                                No hours logged yet. Performance metrics will appear here.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const GanttChartView = ({ projects, user, onRefresh, onAddTask }) => {

    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const today = new Date();

    // Calculate global range based on all projects
    const allStarts = projects.map(p => p.startDate ? new Date(p.startDate).getTime() : today.getTime());
    const allEnds = projects.map(p => p.endDate ? new Date(p.endDate).getTime() : today.getTime());
    const minStart = allStarts.length > 0 ? new Date(Math.min(...allStarts)) : addDays(today, -7);
    const maxEnd = allEnds.length > 0 ? new Date(Math.max(...allEnds)) : addDays(today, 60);


    const days = eachDayOfInterval({
        start: startOfWeek(addDays(minStart, -7)),
        end: addDays(maxEnd, 14)
    });
    const [editingTask, setEditingTask] = useState(null);
    const [editData, setEditData] = useState({ title: '', startDate: '', dueDate: '' });

    const startEditing = (task) => {
        if (!isAuthorized) return;
        setEditingTask(task);
        setEditData({
            title: task.title,
            startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
            dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`tasks/${editingTask.id}`, editData);
            setEditingTask(null);
            onRefresh();
        } catch (error) {
            alert('Failed to update task');
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col relative">
            {editingTask && (
                <div className="absolute inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">Edit Work Item</h2>
                            <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Work Name</label>
                                <input className="input-field font-bold" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Start Date</label>
                                    <input type="date" className="input-field" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Due Date</label>
                                    <input type="date" className="input-field" value={editData.dueDate} onChange={e => setEditData({ ...editData, dueDate: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2">
                                <Save size={18} /> Update Timeline
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Global Project Roadmap
                        {!isAuthorized && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">View Only</span>}
                    </h2>
                    <p className="text-sm text-gray-500">Cross-project timeline and resource allocation</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-3 h-3 bg-primary rounded-sm"></div> Ongoing</div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Completed</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <div className="w-64 shrink-0 p-4 border-r font-black text-[10px] text-gray-400 uppercase tracking-widest">Project / Resources</div>
                        <div className="flex-1 flex">
                            {days.map(day => (
                                <div key={day.toISOString()} className={clsx("flex-1 border-r border-gray-50 p-2 text-center", isSameDay(day, today) && "bg-primary/5")}>
                                    <p className="text-[10px] font-bold text-gray-400">{format(day, 'EEE')}</p>
                                    <p className={clsx("text-xs font-black", isSameDay(day, today) ? "text-primary scale-110" : "text-gray-900")}>{format(day, 'dd')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {projects.map(project => (
                            <div key={project.id}>
                                <div className="flex bg-gray-50/30">
                                    <div className="w-64 shrink-0 p-4 border-r font-bold text-sm text-gray-900 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></div>
                                            <span className="truncate">{project.name}</span>
                                        </div>
                                        {isAuthorized && (
                                            <button
                                                onClick={() => onAddTask(project.id)}
                                                className="p-1.5 hover:bg-white rounded-lg transition-all text-primary shadow-sm hover:shadow-md border border-transparent hover:border-blue-50"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 relative h-16">
                                        {project.startDate && project.endDate && (
                                            <div
                                                className="absolute top-4 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-[10px] font-black text-primary px-4 truncate"
                                                style={{
                                                    left: `${Math.max(0, differenceInDays(new Date(project.startDate), days[0]) * (100 / days.length))}%`,
                                                    width: `${Math.max(2, differenceInDays(new Date(project.endDate), new Date(project.startDate)) * (100 / days.length))}%`
                                                }}
                                            >
                                                {project.name} Scope
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {project.tasks?.filter(t => t.startDate && t.dueDate).map(task => (
                                    <div key={task.id} className="flex group hover:bg-blue-50/30 transition-colors">
                                        <div className="w-64 shrink-0 p-3 pl-8 border-r text-xs font-bold text-gray-600 flex items-center justify-between">
                                            <span className="truncate">{task.title}</span>
                                            {isAuthorized && (
                                                <button onClick={() => startEditing(task)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg transition-all text-primary">
                                                    <Edit2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 relative h-10">
                                            <div
                                                onClick={() => isAuthorized && startEditing(task)}
                                                className={clsx(
                                                    "absolute top-2 h-6 rounded-lg shadow-sm border px-2 flex items-center text-[9px] font-extrabold text-white transition-all hover:scale-[1.02] cursor-pointer",
                                                    task.status === 'DONE' ? "bg-emerald-500 border-emerald-600" : task.priority === 'CRITICAL' ? "bg-rose-500 border-rose-600" : "bg-primary border-indigo-700"
                                                )}
                                                style={{
                                                    left: `${Math.max(0, differenceInDays(new Date(task.startDate), days[0]) * (100 / days.length))}%`,
                                                    width: `${Math.max(4, (differenceInDays(new Date(task.dueDate), new Date(task.startDate)) + 1) * (100 / days.length))}%`
                                                }}
                                            >
                                                <span className="truncate">{task.title}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Tasks without Dates (Backlog) */}
                                {project.tasks?.filter(t => !t.startDate || !t.dueDate).length > 0 && (
                                    <div className="bg-gray-50/20 italic">
                                        {project.tasks.filter(t => !t.startDate || !t.dueDate).map(task => (
                                            <div key={task.id} className="flex group hover:bg-white transition-colors">
                                                <div className="w-64 shrink-0 p-3 pl-8 border-r text-[10px] font-bold text-gray-400 flex items-center justify-between">
                                                    <span className="truncate">{task.title} (Undated)</span>
                                                    {isAuthorized && (
                                                        <button
                                                            onClick={() => startEditing(task)}
                                                            className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded border border-primary/20 opacity-0 group-hover:opacity-100 transition-all uppercase"
                                                        >
                                                            Set Date
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex items-center px-4 text-[9px] font-bold text-gray-400">
                                                    Click 'Set Date' to assign a timeline for this task.
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

const TaskModal = ({ onClose, onSubmit, newTask, setNewTask, members }) => (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 text-left">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Deploy Global Task</h2>
                    <p className="text-sm text-gray-500 font-medium">Add a new work item to the selected project</p>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400">
                    <Plus className="rotate-45" size={24} />
                </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-6">
                <input required className="input-field py-4 font-bold text-lg" placeholder="Task Headline" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                <textarea className="input-field min-h-[120px] font-medium" placeholder="Technical description / Context..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Start Point</label>
                        <input type="date" required className="input-field" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Due Date</label>
                        <input type="date" required className="input-field" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                    </div>
                </div>
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Squad Assignees</label>
                    <select multiple className="input-field h-32" value={newTask.assigneeIds} onChange={e => setNewTask({ ...newTask, assigneeIds: Array.from(e.target.selectedOptions, o => o.value) })}>
                        {members.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.role})</option>)}
                    </select>
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-black text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">Abort</button>
                    <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all uppercase tracking-widest text-xs">Launch Task</button>
                </div>
            </form>
        </div>
    </div>
);

export default Reports;

