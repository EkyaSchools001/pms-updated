import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.notification-dropdown-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);


    const markAsRead = async (id, link) => {
        try {
            await api.put(`notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            if (link) {
                navigate(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative notification-dropdown-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[var(--text-secondary)] hover:text-primary hover:bg-[var(--bg-background)] rounded-xl transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-[var(--bg-card)] rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-[var(--text-primary)]">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Check size={14} />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-sm text-[var(--text-secondary)]">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border-color)]">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markAsRead(n.id, n.link)}
                                        className={clsx(
                                            "p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group",
                                            !n.isRead && "bg-primary/5"
                                        )}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                        )}
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={clsx("text-sm font-bold", !n.isRead ? "text-primary" : "text-[var(--text-primary)]")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>
                                        {n.link && (
                                            <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink size={10} />
                                                View Details
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-[var(--border-color)] text-center bg-gray-50/30">
                        <button className="text-xs text-[var(--text-secondary)] hover:text-primary transition-colors font-medium">
                            View All History
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
