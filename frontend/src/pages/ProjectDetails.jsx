import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar as CalendarIcon, User, CheckCircle, Clock, MoreHorizontal, AlertCircle, ArrowUpRight, ChevronRight, LayoutGrid, List, Ticket, BarChart3, TrendingUp, Users, Edit2, Save } from 'lucide-react';

import clsx from 'clsx';
import { format, eachDayOfInterval, isSameDay, addDays, startOfWeek, differenceInDays } from 'date-fns';

const ProjectDetails = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeTab, setActiveTab] = useState('BOARD'); // BOARD, TIMELINE, TICKETS
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        startDate: '',
        dueDate: '',
        assigneeIds: []
    });
    const [members, setMembers] = useState([]);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const { data } = await api.get(`projects/${id}`);
            setProject(data);
            setMembers(data.members || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch project details', error);
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('tasks', { ...newTask, projectId: id });
            setShowTaskModal(false);
            fetchProjectDetails();
            setNewTask({ title: '', description: '', priority: 'MEDIUM', startDate: '', dueDate: '', assigneeIds: [] });
        } catch (error) {
            alert('Failed to create task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`tasks/${taskId}/status`, { status: newStatus });
            fetchProjectDetails();
        } catch (error) {
            alert('Failed to update task status');
        }
    };

    const calculateProgress = () => {
        if (!project || !project.tasks || project.tasks.length === 0) return 0;
        const completed = project.tasks.filter(t => t.status === 'DONE').length;
        return Math.round((completed / project.tasks.length) * 100);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
        </div>
    );

    if (!project) return <div className="text-center py-20 text-gray-500 font-bold">Project not found</div>;

    const tasksByStatus = {
        TODO: project.tasks.filter(t => t.status === 'TODO'),
        IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS'),
        IN_REVIEW: project.tasks.filter(t => t.status === 'IN_REVIEW'),
        DONE: project.tasks.filter(t => t.status === 'DONE'),
    };

    const progress = calculateProgress();

    return (
        <div className="space-y-8 pb-10">
            {/* Project Header with Live Track */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-600"></div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{project.name}</h1>
                                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-gray-500 max-w-2xl text-lg font-medium leading-relaxed mb-6">{project.description}</p>

                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <User size={16} className="text-primary" />
                                    <span className="text-sm font-bold text-gray-700">{project.manager.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <CalendarIcon size={16} className="text-purple-500" />
                                    <span className="text-sm font-bold text-gray-700">{format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    <span className="text-sm font-bold text-gray-700">${project.budget.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Progress Tracker */}
                        <div className="w-full lg:w-72 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-inner text-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Project Health</p>
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * progress) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-gray-900">{progress}%</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Done</span>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-600">{project.tasks.length} Total Tasks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-2">
                    <TabButton active={activeTab === 'BOARD'} onClick={() => setActiveTab('BOARD')} icon={LayoutGrid} label="Kanban Board" />
                    <TabButton active={activeTab === 'TIMELINE'} onClick={() => setActiveTab('TIMELINE')} icon={CalendarIcon} label="Sprint Cycle" />
                    <TabButton active={activeTab === 'TICKETS'} onClick={() => setActiveTab('TICKETS')} icon={Ticket} label="Project Tickets" />
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn btn-primary px-6 py-2.5 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    >
                        <Plus size={18} /> New Task
                    </button>
                )}
            </div>

            {/* Dynamic Content Based on Tab */}
            <div className="min-h-[60vh]">
                {activeTab === 'BOARD' && <KanbanView tasksByStatus={tasksByStatus} handleStatusChange={handleStatusChange} />}
                {activeTab === 'TIMELINE' && <TimelineView tasks={project.tasks} project={project} user={user} onRefresh={fetchProjectDetails} onAddTask={() => setShowTaskModal(true)} />}

                {activeTab === 'TICKETS' && <TicketsView tickets={project.tickets} />}
            </div>



            {/* Task Modal remains the same structure but with Start Date */}
            {showTaskModal && (
                <TaskModal
                    onClose={() => setShowTaskModal(false)}
                    onSubmit={handleCreateTask}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    members={members}
                />
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
            active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        )}
    >
        <Icon size={18} />
        {label}
    </button>
);

const KanbanView = ({ tasksByStatus, handleStatusChange }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4 items-start">
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <div key={status} className="flex flex-col h-full min-w-[280px]">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${status === 'TODO' ? 'bg-gray-400' : status === 'IN_PROGRESS' ? 'bg-primary' : status === 'IN_REVIEW' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {status.replace('_', ' ')}
                    </h3>
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-black">{tasks.length}</span>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100/80 space-y-4 min-h-[500px]">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all group cursor-pointer">
                            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{task.title}</h4>
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                <div className="flex -space-x-2">
                                    {task.assignees?.map(a => (
                                        <div key={a.id} className="w-6 h-6 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[8px] font-black text-primary" title={a.fullName}>
                                            {a.fullName.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                <select
                                    className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-none rounded-lg p-1 outline-none cursor-pointer"
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                >
                                    <option value="TODO">TODO</option>
                                    <option value="IN_PROGRESS">PROGRESS</option>
                                    <option value="IN_REVIEW">REVIEW</option>
                                    <option value="DONE">DONE</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const TimelineView = ({ tasks, project, user, onRefresh, onAddTask }) => {

    const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const today = new Date();
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

    const projectStart = project.startDate ? new Date(project.startDate) : startOfWeek(today);
    const projectEnd = project.endDate ? new Date(project.endDate) : addDays(projectStart, 30);
    const days = eachDayOfInterval({ start: startOfWeek(projectStart), end: addDays(projectEnd, 7) });

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col relative">
            {editingTask && (
                <div className="absolute inset-0 z-[110] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900">Modify Sprint Item</h2>
                            <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-gray-100 rounded-xl"><Plus className="rotate-45" size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Work Name</label>
                                <input className="input-field font-bold" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Start Point</label>
                                    <input type="date" className="input-field" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">New Deadline</label>
                                    <input type="date" className="input-field" value={editData.dueDate} onChange={e => setEditData({ ...editData, dueDate: e.target.value })} required />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2">
                                <Save size={18} /> Apply Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-gray-50/80 p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        Sprint Cycle Timeline
                        {!isAuthorized && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">View Only</span>}
                    </h3>
                    <p className="text-sm text-gray-500">Visual mapping of tasks and project milestones</p>
                </div>
                {isAuthorized && (
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <Plus size={16} /> Deploy New Task
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
                    <div className="flex border-b border-gray-100 bg-gray-50/30">
                        <div className="w-64 p-4 font-black text-[10px] text-gray-400 uppercase tracking-widest border-r">Work Allocation</div>
                        <div className="flex-1 flex">
                            {days.map(d => (
                                <div key={d.toISOString()} className={clsx("flex-1 p-2 text-center border-r border-gray-100/50 min-w-[40px]", isSameDay(d, today) && "bg-primary/5")}>
                                    <p className="text-[10px] font-bold text-gray-400">{format(d, 'EEE')}</p>
                                    <p className={clsx("text-xs font-black", isSameDay(d, today) ? "text-primary bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center mx-auto" : "text-gray-900")}>{format(d, 'dd')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {/* Project Range visualization row */}
                        <div className="flex h-14 bg-primary/[0.02] border-b border-primary/5 group">
                            <div className="w-64 p-3 px-6 border-r text-xs font-black text-primary flex items-center gap-2">
                                <TrendingUp size={14} /> Total Project Scope
                            </div>
                            <div className="flex-1 relative">
                                <div
                                    className="absolute top-3 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary px-8 shadow-inner"
                                    style={{
                                        left: `${Math.max(0, differenceInDays(new Date(project.startDate), days[0]) * (100 / days.length))}%`,
                                        width: `${Math.max(5, (differenceInDays(new Date(project.endDate || new Date()), new Date(project.startDate || new Date())) + 1) * (100 / days.length))}%`
                                    }}
                                >
                                    {project.name} (Official Duration)
                                </div>
                            </div>
                        </div>

                        {/* Tasks with Dates */}
                        {tasks.filter(t => t.startDate && t.dueDate).map(task => (
                            <div key={task.id} className="flex h-12 hover:bg-blue-50/30 transition-colors group">
                                <div className="w-64 p-3 px-6 border-r text-xs font-bold text-gray-700 truncate flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", task.status === 'DONE' ? "bg-emerald-500" : "bg-primary")}></div>
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                    {isAuthorized && (
                                        <button onClick={() => startEditing(task)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white rounded-lg transition-all text-primary shrink-0">
                                            <Edit2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <div
                                        onClick={() => isAuthorized && startEditing(task)}
                                        className={clsx(
                                            "absolute top-2 h-8 rounded-xl border flex items-center justify-center px-4 text-[9px] font-black text-white shadow-sm transition-transform group-hover:scale-[1.01] cursor-pointer",
                                            task.status === 'DONE' ? "bg-emerald-500 border-emerald-600" : "bg-primary border-indigo-700"
                                        )}
                                        style={{
                                            left: `${Math.max(0, differenceInDays(new Date(task.startDate), days[0]) * (100 / days.length))}%`,
                                            width: `${Math.max(5, (differenceInDays(new Date(task.dueDate), new Date(task.startDate)) + 1) * (100 / days.length))}%`
                                        }}
                                    >
                                        {task.status === 'DONE' && <CheckCircle size={10} className="mr-1" />}
                                        <span className="truncate">{task.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Tasks without Dates (Backlog) */}
                        {tasks.filter(t => !t.startDate || !t.dueDate).length > 0 && (
                            <div className="bg-gray-50/50">
                                <div className="flex h-10 items-center px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    Undated Backlog ({tasks.filter(t => !t.startDate || !t.dueDate).length})
                                </div>
                                {tasks.filter(t => !t.startDate || !t.dueDate).map(task => (
                                    <div key={task.id} className="flex h-12 hover:bg-white transition-colors group italic text-gray-400">
                                        <div className="w-64 p-3 px-6 border-r text-xs font-bold truncate flex items-center justify-between">
                                            <span className="truncate">{task.title}</span>
                                            {isAuthorized && (
                                                <button
                                                    onClick={() => startEditing(task)}
                                                    className="px-2 py-1 bg-primary text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all uppercase"
                                                >
                                                    Set Dates
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 flex items-center px-6 text-[10px] font-bold">
                                            Dates not specified. Click 'Set Dates' to place on timeline.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const TicketsView = ({ tickets }) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Associated Tickets</h3>
            <p className="text-sm text-gray-500">Support requests and issues for this project</p>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Query / Title</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assignee</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {tickets?.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[9px] font-black tracking-[0.1em] uppercase",
                                    ticket.priority === 'CRITICAL' ? "bg-rose-50 text-rose-600" : ticket.priority === 'HIGH' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    {ticket.priority}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-gray-900">{ticket.title}</p>
                                <p className="text-xs text-gray-400">{ticket.description}</p>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">
                                {ticket.assignee?.fullName || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={clsx(
                                    "text-[10px] font-black",
                                    ticket.status === 'RESOLVED' ? "text-emerald-500" : "text-primary"
                                )}>
                                    {ticket.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {(!tickets || tickets.length === 0) && (
                        <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium italic">No tickets reported for this project</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const TaskModal = ({ onClose, onSubmit, newTask, setNewTask, members }) => (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Deploy Task</h2>
                    <p className="text-sm text-gray-500 font-medium">Add a new work item to the project scope</p>
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
                <div className="space-y-2">
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

export default ProjectDetails;
