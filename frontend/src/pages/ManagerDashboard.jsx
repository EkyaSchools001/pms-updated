import { useState, useEffect } from 'react';
import {
    Ticket,
    Clock,
    AlertCircle,
    CheckCircle2,
    Filter,
    Search,
    User,
    MapPin,
    MessageSquare,
    History,
    ChevronRight,
    ArrowUpRight,
    Users,
    LayoutDashboard
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [itEmployees, setItEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCampus, setFilterCampus] = useState('ALL');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketLogs, setTicketLogs] = useState([]);
    const [commentText, setCommentText] = useState('');

    const campuses = user?.campusAccess ? user.campusAccess.split(',').map(c => c.trim()) : ['Campus A', 'Campus B', 'Campus C'];

    const fetchTicketLogs = async (ticketId) => {
        try {
            const res = await api.get(`tickets/${ticketId}/logs`);
            setTicketLogs(res.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleSelectTicket = (ticket) => {
        setSelectedTicket(ticket);
        fetchTicketLogs(ticket.id);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ticketsRes, usersRes] = await Promise.all([
                api.get('tickets'),
                api.get('users')
            ]);
            setTickets(ticketsRes.data);
            // Filter users with EMPLOYEE role for assignment
            setItEmployees(usersRes.data.filter(u => u.role === 'EMPLOYEE'));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (ticketId, assigneeId) => {
        try {
            await api.put(`tickets/${ticketId}`, { assigneeId });
            fetchData();
            fetchTicketLogs(ticketId);
            if (selectedTicket) {
                setSelectedTicket(prev => ({ ...prev, assigneeId }));
            }
            alert('Ticket assigned successfully!');
        } catch (error) {
            console.error('Error assigning ticket:', error);
        }
    };

    const handleUpdateStatus = async (ticketId, status) => {
        try {
            await api.put(`tickets/${ticketId}`, { status });
            fetchData();
            fetchTicketLogs(ticketId);
            if (selectedTicket) setSelectedTicket(prev => ({ ...prev, status }));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`tickets/${selectedTicket.id}/comments`, { content: commentText });
            setSelectedTicket(prev => ({
                ...prev,
                comments: [...(prev.comments || []), res.data]
            }));
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const filteredTickets = (tickets || []).filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        const matchesCampus = filterCampus === 'ALL' || t.campus === filterCampus;
        return matchesSearch && matchesStatus && matchesCampus;
    });

    const stats = [
        { label: 'Total Tickets', value: tickets.length, color: 'bg-blue-500', icon: Ticket },
        { label: 'Open Tickets', value: tickets.filter(t => t.status === 'OPEN').length, color: 'bg-orange-500', icon: Clock },
        { label: 'In-Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS').length, color: 'bg-indigo-500', icon: AlertCircle },
        { label: 'Closed', value: tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length, color: 'bg-emerald-500', icon: CheckCircle2 },
        { label: 'SLA Breached', value: tickets.filter(t => t.slaDeadline && new Date(t.slaDeadline) < new Date()).length, color: 'bg-red-500', icon: History },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ticket Manager Dashboard</h1>
                    <p className="text-gray-500 font-medium">Monitoring and assigning tickets for {user?.campusAccess || (user?.role === 'ADMIN' ? 'all' : 'unassigned')} campuses</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                        System Active
                    </span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={clsx("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Ticket ID or Title..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In-Progress</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <select
                            className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-600 outline-none"
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="ALL">All Campuses</option>
                            {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16">S.No</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket ID & Info</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Campus & Category</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority / SLA</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTickets.map((ticket, index) => {
                            const isOverdue = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() && ticket.status !== 'CLOSED';
                            return (
                                <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6 font-black text-gray-400 text-xs">{(index + 1).toString().padStart(2, '0')}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary mb-1">#{ticket.id.slice(0, 8)}</span>
                                            <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{ticket.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                <MapPin size={12} className="text-gray-400" />
                                                {ticket.campus || 'Not Set'}
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-medium uppercase">{ticket.category || 'Support'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className={clsx(
                                                "w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                ticket.priority === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-100" :
                                                    ticket.priority === 'HIGH' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                            )}>
                                                {ticket.priority}
                                            </span>
                                            <span className={clsx(
                                                "text-[10px] font-bold",
                                                isOverdue ? "text-red-600" : "text-gray-500"
                                            )}>
                                                {isOverdue ? 'SLA BREACHED' : ticket.slaDeadline ? `Ends ${formatDistanceToNow(new Date(ticket.slaDeadline), { addSuffix: true })}` : 'No SLA'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {ticket.assignee?.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900">{ticket.assignee?.fullName || 'Unassigned'}</span>
                                                <span className="text-[10px] text-gray-500 capitalize">{ticket.assignee?.role?.toLowerCase() || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            ticket.status === 'OPEN' ? "bg-blue-50 text-blue-600" :
                                                ticket.status === 'IN_PROGRESS' ? "bg-orange-50 text-orange-600" :
                                                    "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => handleSelectTicket(ticket)}
                                            className="p-2 bg-gray-50 text-gray-400 hover:bg-primary hover:text-white rounded-xl transition-all"
                                        >
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
                    <div className="w-full max-w-2xl h-full bg-white shadow-2xl relative animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ticket Details</h2>
                                <p className="text-primary font-bold text-sm">#{selectedTicket.id.slice(0, 16)}</p>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
                                <ChevronRight />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Main Info */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-6 rounded-2xl border border-gray-100 italic">
                                    "{selectedTicket.description}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Campus</p>
                                    <p className="font-bold text-[11px] truncate">{selectedTicket.campus || 'Not Provided'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Category</p>
                                    <p className="font-bold text-[11px] truncate">{selectedTicket.category || 'General'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Priority</p>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "w-2 h-2 rounded-full",
                                            selectedTicket.priority === 'CRITICAL' ? "bg-red-500" :
                                                selectedTicket.priority === 'HIGH' ? "bg-orange-500" : "bg-blue-500"
                                        )}></span>
                                        <p className="font-bold text-[11px]">{selectedTicket.priority}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Created By</p>
                                    <p className="font-bold text-[11px] truncate">{selectedTicket.reporter?.fullName || 'User'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">SLA Deadline</p>
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className={new Date(selectedTicket.slaDeadline) < new Date() ? "text-red-500" : "text-emerald-500"} />
                                        <p className={clsx(
                                            "font-bold text-[11px]",
                                            selectedTicket.slaDeadline && new Date(selectedTicket.slaDeadline) < new Date() ? "text-red-600" : "text-emerald-600"
                                        )}>
                                            {selectedTicket.slaDeadline
                                                ? format(new Date(selectedTicket.slaDeadline), 'MMM d, HH:mm')
                                                : 'No Deadline'}
                                            {selectedTicket.slaDeadline && new Date(selectedTicket.slaDeadline) < new Date() ? ' (OVERDUE)' :
                                                selectedTicket.slaDeadline ? ' (ON TRACK)' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Submission Date</p>
                                    <p className="font-bold text-[11px] text-gray-600">
                                        {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 px-1">Assign to Employee</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {itEmployees.map(emp => {
                                            const workload = tickets.filter(t => t.assigneeId === emp.id && t.status !== 'CLOSED').length;
                                            return (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => handleAssign(selectedTicket.id, emp.id)}
                                                    className={clsx(
                                                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                        selectedTicket.assigneeId === emp.id
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                            : "border-gray-100 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-bold">
                                                            {emp.fullName.charAt(0)}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-gray-900">{emp.fullName}</p>
                                                            <p className="text-[10px] text-gray-500">IT Specialist</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Workload</span>
                                                        <span className={clsx(
                                                            "px-2 py-0.5 rounded text-[8px] font-black border",
                                                            workload > 5 ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        )}>
                                                            {workload} ACTIVE
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 px-1">Update Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED', 'RESOLVED'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateStatus(selectedTicket.id, s)}
                                                className={clsx(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                                                    selectedTicket.status === s
                                                        ? "bg-primary text-white"
                                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="flex items-center gap-2 font-black text-gray-900 uppercase text-xs">
                                    <History size={16} className="text-primary" /> Activity Timeline
                                </h4>
                                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                    {ticketLogs.map((log, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-primary"></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{log.action}</span>
                                                <span className="text-[9px] text-gray-400">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">
                                                {log.action === 'CREATED' ? 'Ticket raised by ' : 'Updated by '}
                                                <span className="text-primary font-bold">{log.user?.fullName}</span>
                                            </p>
                                            {log.details && log.details.startsWith('{') && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded-lg text-[9px] text-gray-400 font-mono">
                                                    {Object.entries(JSON.parse(log.details))
                                                        .filter(([_, v]) => v)
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(' | ')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="flex items-center gap-2 font-black text-gray-900 uppercase text-xs">
                                    <MessageSquare size={16} className="text-primary" /> Internal Comments
                                </h4>
                                <div className="space-y-4">
                                    {(selectedTicket.comments || []).map((comm, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-black text-primary">{comm.author?.fullName}</span>
                                                <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}</span>
                                            </div>
                                            <p className="text-xs text-gray-600">{comm.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddComment} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a note for the IT team..."
                                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                    />
                                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Add</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
