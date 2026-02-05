import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, IndianRupee, Search, Filter, MoreVertical, TrendingUp, Users, Clock, ArrowRight } from 'lucide-react';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: '',
        startDate: '',
        endDate: '',
        managerId: user?.id || '',
        memberIds: []
    });


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [projectsRes, usersRes] = await Promise.all([
                api.get('projects'),
                api.get('users')
            ]);
            setProjects(projectsRes.data);
            setUsers(usersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('projects', formData);
            setShowModal(false);
            fetchData();
            setFormData({
                name: '',
                description: '',
                budget: '',
                startDate: '',
                endDate: '',
                managerId: user?.id || '',
                memberIds: []
            });
        } catch {
            alert('Failed to create project');
        }
    };


    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/20';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-100 ring-blue-500/20';
            case 'ON_HOLD': return 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/20';
            default: return 'bg-gray-50 text-gray-700 border-gray-100 ring-gray-500/20';
        }
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
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Projects</h1>
                    <p className="text-gray-500 text-lg">Manage your portfolio and track progress.</p>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={20} />
                        New Project
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Active</p>
                        <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'IN_PROGRESS').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Team Members</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Avg. Duration</p>
                        <p className="text-2xl font-bold text-gray-900">45 Days</p>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ring-1 ${getStatusStyle(project.status)}`}>
                                    {project.status.replace('_', ' ')}
                                </div>
                                <button className="text-gray-300 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <Link to={`/projects/${project.id}`} className="block group-hover:text-primary transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{project.name}</h3>
                            </Link>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
                                {project.description || 'No description provided.'}
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{new Date(project.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-medium text-gray-700">
                                        <IndianRupee size={16} className="text-gray-400" />
                                        <span>{project.budget.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                    {project.manager.fullName.charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-gray-600">{project.manager.fullName}</span>
                            </div>
                            <Link
                                to={`/projects/${project.id}`}
                                className="text-sm font-semibold text-primary hover:text-indigo-700 flex items-center gap-1 group/link"
                            >
                                Details <ArrowRight size={16} className="group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Add New Project Card */}
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="group bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-blue-50/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">Create New Project</h3>
                            <p className="text-sm text-gray-500">Start a new initiative</p>
                        </div>
                    </button>
                )}
            </div>

            {/* Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create Project</h2>
                                <p className="text-sm text-gray-500">Launch a new project workspace</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Project Name</label>
                                    <input
                                        required
                                        className="input-field bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="e.g. Q4 Marketing Campaign"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Description</label>
                                    <textarea
                                        className="input-field min-h-[120px] bg-gray-50 focus:bg-white transition-colors resize-none"
                                        placeholder="What are the goals and deliverables?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field bg-gray-50 focus:bg-white"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">End Date (Goal)</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field bg-gray-50 focus:bg-white"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Budget</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-gray-400 font-medium">₹</span>
                                        <input
                                            type="number"
                                            className="input-field pl-8 bg-gray-50 focus:bg-white"
                                            placeholder="0.00"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Project Lead (Manager)</label>
                                        <select
                                            required
                                            className="input-field bg-gray-50 focus:bg-white transition-colors"
                                            value={formData.managerId}
                                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                        >
                                            <option value="">Select Manager</option>
                                            {users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Squad Members</label>
                                        <select
                                            multiple
                                            className="input-field bg-gray-50 focus:bg-white transition-colors h-32"
                                            value={formData.memberIds}
                                            onChange={(e) => setFormData({ ...formData, memberIds: Array.from(e.target.selectedOptions, o => o.value) })}
                                        >
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1 italic">Hold Ctrl (Cmd) to select multiple</p>
                                    </div>
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
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Projects;
