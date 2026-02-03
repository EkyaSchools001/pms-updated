import { useState, useEffect } from 'react';
import { X, Clock, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

const LogHoursModal = ({ isOpen, onClose, onSuccess }) => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        description: '',
        projectId: '',
        taskId: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('projects');
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    const fetchTasks = async (projectId) => {
        try {
            const { data } = await api.get(`tasks/project/${projectId}`);
            setTasks(data);
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        }
    };

    const handleProjectChange = (e) => {
        const pId = e.target.value;
        setFormData({ ...formData, projectId: pId, taskId: '' });
        if (pId) {
            fetchTasks(pId);
        } else {
            setTasks([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('time-logs', formData);
            setLoading(false);
            onSuccess();
            onClose();
            setFormData({
                date: new Date().toISOString().split('T')[0],
                hours: '',
                description: '',
                projectId: '',
                taskId: ''
            });
        } catch (error) {
            setLoading(false);
            alert('Failed to log hours. Please check your input.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Clock className="text-amber-500" /> Log Performance Hours
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">Record work duration and notify the team</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Date</label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hours Spent</label>
                            <input
                                type="number"
                                step="0.5"
                                required
                                placeholder="e.g. 4.5"
                                className="input-field"
                                value={formData.hours}
                                onChange={e => setFormData({ ...formData, hours: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Project</label>
                        <select
                            required
                            className="input-field"
                            value={formData.projectId}
                            onChange={handleProjectChange}
                        >
                            <option value="">Choose a project...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Task (Optional)</label>
                        <select
                            className="input-field"
                            value={formData.taskId}
                            onChange={e => setFormData({ ...formData, taskId: e.target.value })}
                        >
                            <option value="">General Project Work</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Narrative / Summary</label>
                        <textarea
                            className="input-field min-h-[100px] resize-none"
                            placeholder="What did you achieve during these hours?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            Logging these hours will notify all team members via email and update the collective project performance metrics.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 uppercase text-xs tracking-widest">Discard</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:shadow-amber-400 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
                        >
                            <Save size={18} /> {loading ? 'Logging...' : 'Confirm Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogHoursModal;
