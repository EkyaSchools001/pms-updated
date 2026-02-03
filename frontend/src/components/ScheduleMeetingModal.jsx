import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, MapPin, Users, Info, AlertCircle } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

const ScheduleMeetingModal = ({ isOpen, onClose, onSuccess, initialDate, meetingData }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        isOnline: false,
        meetingLink: '',
        roomId: '',
        projectId: '',
        participantIds: []
    });

    const [rooms, setRooms] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (meetingData) {
                // Formatting dates for datetime-local input
                const start = new Date(meetingData.start || meetingData.startTime).toISOString().slice(0, 16);
                const end = new Date(meetingData.end || meetingData.endTime).toISOString().slice(0, 16);

                setFormData({
                    title: meetingData.title || '',
                    description: meetingData.extendedProps?.description || meetingData.description || '',
                    startTime: start,
                    endTime: end,
                    isOnline: meetingData.extendedProps?.isOnline || meetingData.isOnline || false,
                    meetingLink: meetingData.extendedProps?.meetingLink || meetingData.meetingLink || '',
                    roomId: meetingData.extendedProps?.roomId || meetingData.roomId || '',
                    projectId: meetingData.extendedProps?.projectId || meetingData.projectId || '',
                    participantIds: meetingData.extendedProps?.participantIds || meetingData.participants?.map(p => p.userId) || []
                });
            } else if (initialDate) {
                const date = new Date(initialDate);
                const startStr = date.toISOString().slice(0, 16);
                const endStr = new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
                setFormData({
                    title: '',
                    description: '',
                    startTime: startStr,
                    endTime: endStr,
                    isOnline: false,
                    meetingLink: '',
                    roomId: '',
                    projectId: '',
                    participantIds: []
                });
            }
        }
    }, [isOpen, initialDate, meetingData]);

    const fetchInitialData = async () => {
        try {
            const [roomsRes, projectsRes, usersRes] = await Promise.all([
                api.get('rooms'),
                api.get('projects'),
                api.get('users')
            ]);
            setRooms(roomsRes.data);
            setProjects(projectsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error('Failed to fetch data for modal:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (meetingData?.id) {
                await api.put(`meetings/${meetingData.id}`, formData);
            } else {
                await api.post('meetings', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${meetingData?.id ? 'update' : 'schedule'} meeting`);
        } finally {
            setLoading(false);
        }
    };

    const handleParticipantToggle = (userId) => {
        setFormData(prev => ({
            ...prev,
            participantIds: prev.participantIds.includes(userId)
                ? prev.participantIds.filter(id => id !== userId)
                : [...prev.participantIds, userId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{meetingData?.id ? 'Edit Meeting' : 'Schedule Meeting'}</h2>
                            <p className="text-white/70 text-sm">{meetingData?.id ? 'Update your meeting details' : 'Create a new internal or online session'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Title & Description */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Meeting Title"
                            required
                            className="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-gray-300 p-0"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Add description or agenda..."
                            className="w-full text-sm text-gray-600 border-none focus:ring-0 placeholder:text-gray-400 p-0 resize-none h-20"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={14} /> Start Time
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={14} /> End Time
                            </label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Video size={14} /> Meeting Type
                            </label>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isOnline: false })}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                        !formData.isOnline ? "bg-white text-primary shadow-sm" : "text-gray-500"
                                    )}
                                >
                                    In-Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isOnline: true })}
                                    className={clsx(
                                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                        formData.isOnline ? "bg-white text-primary shadow-sm" : "text-gray-500"
                                    )}
                                >
                                    Online
                                </button>
                            </div>
                        </div>

                        {/* Project Context */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Info size={14} /> Project (Optional)
                            </label>
                            <select
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">General Meeting</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Conditional: Room or Link */}
                    {formData.isOnline ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Video size={14} /> Meeting Link
                            </label>
                            <input
                                type="url"
                                placeholder="https://zoom.us/j/..."
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.meetingLink}
                                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={14} /> Meeting Room
                            </label>
                            <select
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={formData.roomId}
                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                            >
                                <option value="">Select a Room</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Users size={14} /> Invite Participants ({formData.participantIds.length})
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {users.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleParticipantToggle(u.id)}
                                    className={clsx(
                                        "flex items-center gap-2 p-2 rounded-xl border text-left transition-all",
                                        formData.participantIds.includes(u.id)
                                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary"
                                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                    )}
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                        {u.fullName.charAt(0)}
                                    </div>
                                    <span className="text-xs font-medium truncate">{u.fullName}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.title}
                        className="flex-[2] px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (meetingData?.id ? 'Update Meeting' : 'Confirm & Schedule')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
