import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, Search, Filter, ArrowUpRight, CheckSquare, Plus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import clsx from 'clsx';
import { format } from 'date-fns';

const Tasks = () => {
    const { user } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        startDate: '',
        dueDate: '',
        projectId: '',
        assigneeIds: []
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                api.get('tasks/my-tasks'),
                api.get('projects'),
                api.get('users')
            ]);
            setTasks(tasksRes.data);
            setProjects(projectsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`tasks/${taskId}/status`, { status: newStatus });
            // Update local state for immediate feedback
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('tasks', formData);
            setShowModal(false);
            fetchTasks();
            setFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                startDate: '',
                dueDate: '',
                projectId: '',
                assigneeIds: []
            });
        } catch (error) {
            console.error('Failed to create task', error);
            alert('Failed to create task. Please try again.');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'LOW': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DONE': return 'bg-emerald-100 text-emerald-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'IN_REVIEW': return 'bg-purple-100 text-purple-700';
            case 'TODO': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        todo: tasks.filter(t => t.status === 'TODO').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        done: tasks.filter(t => t.status === 'DONE').length
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
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My Sandbox</h1>
                    <p className="text-gray-500 text-lg font-medium">Clear your desk. Execute your assigned tasks.</p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={20} />
                        Add Task
                    </button>
                )}
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Backlog', count: stats.todo, icon: CheckSquare, color: 'gray' },
                    { label: 'Active Sprint', count: stats.inProgress, icon: Clock, color: 'blue' },
                    { label: 'Completed', count: stats.done, icon: CheckCircle2, color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-gray-900">{stat.count}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Workplace Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for tasks or project context..."
                        className="input-field pl-12 py-3.5 bg-white shadow-sm border-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                statusFilter === status ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {status === 'ALL' ? 'Everything' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tasks Deck */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Context / Task Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Priority</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Timeline</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Current State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="group hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{task.project?.name}</span>
                                            <span className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">{task.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border",
                                            getPriorityColor(task.priority)
                                        )}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                            <Clock size={14} className="text-gray-400" />
                                            {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No Date Set'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none cursor-pointer transition-all",
                                                getStatusColor(task.status)
                                            )}
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        >
                                            <option value="TODO">Backlog</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="IN_REVIEW">In Review</option>
                                            <option value="DONE">Completed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckSquare size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Your desk is clear</h3>
                            <p className="text-gray-500">No tasks found matching your current filter.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
                                <p className="text-sm text-gray-500">Add a new task to your project</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Task Title *</label>
                                    <input
                                        required
                                        className="input-field bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="e.g. Design landing page mockup"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Description</label>
                                    <textarea
                                        className="input-field min-h-[100px] bg-gray-50 focus:bg-white transition-colors resize-none"
                                        placeholder="Describe the task requirements and deliverables..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Project *</label>
                                    <select
                                        required
                                        className="input-field bg-gray-50 focus:bg-white transition-colors"
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Priority</label>
                                        <select
                                            className="input-field bg-gray-50 focus:bg-white transition-colors"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="input-field bg-gray-50 focus:bg-white"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="input-field bg-gray-50 focus:bg-white"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Assign To</label>
                                    <select
                                        multiple
                                        className="input-field bg-gray-50 focus:bg-white transition-colors h-32"
                                        value={formData.assigneeIds}
                                        onChange={(e) => setFormData({ ...formData, assigneeIds: Array.from(e.target.selectedOptions, o => o.value) })}
                                    >
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1 italic">Hold Ctrl (Cmd) to select multiple assignees</p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary py-3"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn btn-primary py-3 shadow-lg shadow-primary/25 hover:shadow-primary/40">
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
