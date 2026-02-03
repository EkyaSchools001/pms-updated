import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, FolderKanban, CheckCircle2, ArrowUpRight, Clock, Calendar, Video, MapPin, Plus, AlertCircle } from 'lucide-react';

import api from '../services/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import LogHoursModal from '../components/LogHoursModal';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState([]);
    const [stats, setStats] = useState([
        { label: 'Active Projects', value: '...', icon: FolderKanban, color: 'bg-blue-500', change: '+0%', path: '/projects' },
        { label: 'Total Tasks', value: '...', icon: CheckCircle2, color: 'bg-emerald-500', change: '+0%', path: '/tasks' },
        { label: 'Team Members', value: '...', icon: Users, color: 'bg-purple-500', change: '+0%', path: '/team' },
        { label: 'Hours Logged', value: '...', icon: Clock, color: 'bg-amber-500', change: '+0%', path: '/tasks' },
    ]);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isLogHoursOpen, setIsLogHoursOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Using separate try-catch blocks or Promise.allSettled to ensure dashboard loads even if one API fails
            const results = await Promise.allSettled([
                api.get('meetings'),
                api.get('projects'),
                api.get('users'),
                api.get('tasks'),
                api.get('time-logs/stats')
            ]);

            const [meetingsRes, projectsRes, usersRes, tasksRes, timeStatsRes] = results.map(r => r.status === 'fulfilled' ? r.value.data : null);

            if (meetingsRes) {
                setMeetings(meetingsRes.filter(m => new Date(m.startTime) >= new Date()).slice(0, 3));
            }

            setStats([
                {
                    label: 'Active Projects',
                    value: projectsRes ? projectsRes.length.toString() : '0',
                    icon: FolderKanban,
                    color: 'bg-blue-500',
                    change: '+12%',
                    path: '/projects'
                },
                {
                    label: 'Total Tasks',
                    value: tasksRes ? tasksRes.length.toString() : '0',
                    icon: CheckCircle2,
                    color: 'bg-emerald-500',
                    change: '+8%',
                    path: '/tasks'
                },
                {
                    label: 'Team Members',
                    value: usersRes ? usersRes.length.toString() : '0',
                    icon: Users,
                    color: 'bg-purple-500',
                    change: '+3%',
                    path: '/team'
                },
                {
                    label: 'Hours Logged',
                    value: timeStatsRes ? timeStatsRes.totalHours.toString() : '0',
                    icon: Clock,
                    color: 'bg-amber-500',
                    change: '+15%',
                    path: '/tasks'
                },
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/20">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
                        <p className="text-indigo-100 text-lg">Here's what's happening with your projects today.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 text-right">
                        <p className="text-sm text-indigo-100 uppercase tracking-widest font-bold">Role</p>
                        <p className="font-bold text-lg capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => navigate(stat.path)}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-${stat.color}/30 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} />
                                </div>
                                <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Meetings */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-primary cursor-pointer hover:scale-110 transition-transform" size={20} onClick={() => navigate('/calendar')} />
                            <h2 className="text-xl font-bold text-gray-900">Upcoming Meetings</h2>
                        </div>
                        <button onClick={() => setIsMeetingModalOpen(true)} className="text-primary text-sm font-semibold hover:text-indigo-700 flex items-center gap-1">
                            Schedule <Plus size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {meetings.length > 0 ? (
                            meetings.map((meeting) => (
                                <div key={meeting.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold text-primary uppercase">{format(new Date(meeting.startTime), 'MMM')}</span>
                                            <span className="text-lg font-bold text-gray-900 leading-none">{format(new Date(meeting.startTime), 'dd')}</span>
                                        </div>
                                        <div className="cursor-pointer" onClick={() => navigate('/calendar')}>
                                            <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{meeting.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock size={14} />
                                                    {format(new Date(meeting.startTime), 'hh:mm a')}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    {meeting.isOnline ? <Video size={14} /> : <MapPin size={14} />}
                                                    {meeting.isOnline ? 'Online' : meeting.room?.name || 'In-Person'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {meeting.meetingLink && (
                                            <a
                                                href={meeting.meetingLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                            >
                                                Join Now
                                            </a>
                                        )}
                                        <button
                                            onClick={() => navigate('/calendar')}
                                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                                        >
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                                <p className="text-gray-500 font-medium">No meetings scheduled for today.</p>
                                {isAdminOrManager && (
                                    <button onClick={() => setIsMeetingModalOpen(true)} className="mt-4 text-primary font-bold text-sm hover:underline">
                                        Schedule a new meeting
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 font-primary">Quick Actions</h2>
                    <div className="space-y-3">
                        {isAdminOrManager && (
                            <button
                                onClick={() => navigate('/projects')}
                                className="w-full btn btn-primary justify-start text-left py-4 px-6 hover:translate-x-1 uppercase text-[10px] tracking-widest font-black"
                            >
                                <Plus size={20} />
                                Create New Project
                            </button>
                        )}
                        <button onClick={() => setIsMeetingModalOpen(true)} className="w-full btn btn-secondary justify-start text-left py-4 px-6 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all uppercase text-[10px] tracking-widest font-black">
                            <Calendar size={20} />
                            Schedule Meeting
                        </button>
                        <button
                            onClick={() => setIsLogHoursOpen(true)}
                            className="w-full btn btn-secondary justify-start text-left py-4 px-6 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all uppercase text-[10px] tracking-widest font-black"
                        >
                            <Clock size={20} />
                            Log My Performance
                        </button>
                        {isAdminOrManager && (
                            <button
                                onClick={() => navigate('/team')}
                                className="w-full btn btn-secondary justify-start text-left py-4 px-6 uppercase text-[10px] tracking-widest font-black"
                            >
                                <Users size={20} />
                                Manage Team
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* Activity Feed */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 font-primary flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={24} /> Recent Squad Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { action: 'Task logic finalized', project: 'PMS Core Extension', time: '2 hours ago', color: 'bg-blue-500' },
                        { action: 'New time log entry', project: 'Mobile App Support', time: '5 hours ago', color: 'bg-amber-500' },
                        { action: 'Team member joined', project: 'Reporting Dashboard', time: '1 day ago', color: 'bg-purple-500' },
                        { action: 'Priority ticket resolved', project: 'Client Interface', time: 'Just now', color: 'bg-emerald-500' },
                    ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50">
                            <div className={`${activity.color} w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-lg shadow-current/20`}></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-sm">{activity.action}</p>
                                <p className="text-xs text-gray-500">{activity.project}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <ScheduleMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                onSuccess={fetchDashboardData}
            />

            <LogHoursModal
                isOpen={isLogHoursOpen}
                onClose={() => setIsLogHoursOpen(false)}
                onSuccess={fetchDashboardData}
            />
        </div>
    );
};

export default Dashboard;
