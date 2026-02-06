import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Settings, PieChart, Users, MessageSquare, Calendar, Ticket, Gift, Sun, Moon, X, Headset, BarChart3 } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';



const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Get API base URL for images
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Helper to get full image URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        // Clean up base URL
        let baseUrl = API_URL;
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
        if (baseUrl.toLowerCase().endsWith('/api/v1')) baseUrl = baseUrl.slice(0, -7);
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    };

    const navigate = useNavigate();
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [imgError, setImgError] = useState(false);


    useEffect(() => {
        const fetchBirthdays = async () => {
            try {
                const response = await api.get('users');
                const users = response.data;
                const today = new Date();

                // Helper to normalize date to check equality/diff easier
                const getBirthdayThisYear = (dob) => {
                    const birthday = new Date(today.getFullYear(), new Date(dob).getMonth(), new Date(dob).getDate());
                    // If birthday passed, check next year
                    if (birthday < new Date(today.setHours(0, 0, 0, 0))) {
                        birthday.setFullYear(today.getFullYear() + 1);
                    }
                    return birthday;
                };

                const upcoming = users
                    .filter(u => u.dateOfBirth) // Must have birthday
                    .map(u => ({
                        ...u,
                        nextBirthday: getBirthdayThisYear(u.dateOfBirth)
                    }))
                    .filter(u => {
                        const diffTime = u.nextBirthday - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= 30; // Upcoming in 30 days
                    })
                    .sort((a, b) => a.nextBirthday - b.nextBirthday)
                    .slice(0, 3); // Show top 3

                setUpcomingBirthdays(upcoming);
            } catch (error) {
                console.error("Failed to fetch birthdays", error);
            }
        };

        if (user) {
            fetchBirthdays();
        }
    }, [user]);


    const allNavItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CUSTOMER'] },
        { label: 'Ticket Manager', path: '/manager-dashboard', icon: Headset, roles: ['ADMIN', 'MANAGER'] },
        { label: 'Projects', path: '/projects', icon: FolderKanban, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CUSTOMER'] },
        { label: 'Team Members', path: '/team', icon: Users, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER'] },
        { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
        { label: 'Chat', path: '/chat', icon: MessageSquare, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CUSTOMER'] },
        { label: 'Calendar', path: '/calendar', icon: Calendar, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CUSTOMER'] },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'TEAM_MEMBER', 'CUSTOMER'] },
    ];


    // Filter nav items based on user role
    const navItems = allNavItems.filter(item =>
        !item.roles || item.roles.includes(user?.role)
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
                    onClick={onClose}
                ></div>
            )}

            <div className={clsx(
                "w-72 bg-[var(--bg-card)] h-screen fixed left-0 top-0 flex flex-col border-r border-[var(--border-color)] shadow-xl shadow-gray-200/50 dark:shadow-none z-50 transition-all duration-300 transform lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="p-8 pb-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                                <LayoutDashboard size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">PMS Pro</h1>
                                <p className="text-xs text-[var(--text-secondary)] font-medium tracking-wide text-nowrap">WORKSPACE</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User Profile Card */}
                    <div className="bg-[var(--bg-background)] rounded-2xl p-4 border border-[var(--border-color)] mb-2 group cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border-2 border-[var(--bg-card)] shadow-sm flex items-center justify-center text-sm font-bold text-primary relative overflow-hidden">
                                {user?.profilePicture && !imgError ? (
                                    <img
                                        src={`${getImageUrl(user.profilePicture)}?t=${new Date(user.updatedAt || Date.now()).getTime()}`}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span>{user?.fullName?.charAt(0) || 'U'}</span>
                                )}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-card)] rounded-full"></span>
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="font-semibold text-sm truncate text-[var(--text-primary)]">{user?.fullName}</p>
                                <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-2">
                    <p className="px-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Main Menu</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                    if (window.innerWidth < 1024) onClose();
                                }}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 font-medium'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-background)] hover:text-primary'
                                )}
                            >
                                <Icon size={20} className={clsx("transition-colors relative z-10", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                                <span className="relative z-10">{item.label}</span>
                                {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="px-4 pb-4 mt-auto space-y-3">
                    {/* Upcoming Birthdays (Fixed Height/Layout if needed) */}
                    {upcomingBirthdays.length > 0 && (
                        <div className="mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-2">
                                <Gift size={16} />
                                <p className="text-xs font-bold uppercase tracking-wider">Birthday</p>
                            </div>
                            <div className="space-y-3">
                                {upcomingBirthdays.map(u => (
                                    <div key={u.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border border-white/30">
                                            {u.fullName.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold truncate">{u.fullName}</p>
                                            <p className="text-[10px] text-indigo-100 text-nowrap">
                                                {new Date(u.nextBirthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="w-full">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 px-4 py-3 w-full text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-sm font-bold border border-transparent"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

};

export default Sidebar;
