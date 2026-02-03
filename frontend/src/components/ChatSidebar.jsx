import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, MessageSquare, X, Search, MoreVertical } from 'lucide-react';

const ChatSidebar = ({ onSelectChat, activeChatId, onNewChat, initialChatId }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (chats.length > 0 && initialChatId) {
            const chatToSelect = chats.find(c => c.id === initialChatId);
            if (chatToSelect) {
                onSelectChat(chatToSelect);
            }
        }
    }, [chats, initialChatId]);

    const fetchChats = async () => {
        try {
            const response = await api.get('chats');
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        setError(null);
        try {
            const response = await api.get('users');
            console.log('Fetched users:', response.data);
            const currentUserId = localStorage.getItem('userId');
            // Filter out current user
            const otherUsers = response.data.filter(u => u.id !== currentUserId);
            setUsers(otherUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleNewChatClick = () => {
        setShowNewChatModal(true);
        fetchUsers();
    };

    const handleCreateChat = async (targetUserId) => {
        try {
            const response = await api.post('chats/private', { targetUserId });
            setShowNewChatModal(false);
            // Refresh chats
            await fetchChats();
            // Select the new/existing chat
            onSelectChat(response.data);
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Failed to create chat');
        }
    };

    const getChatName = (chat) => {
        if (chat.type === 'PRIVATE') {
            const other = chat.participants.find(p => p.user.id !== localStorage.getItem('userId'));
            return other ? other.user.fullName : 'Unknown User';
        }
        return chat.name;
    };

    const getChatRole = (chat) => {
        if (chat.type === 'PRIVATE') {
            const other = chat.participants.find(p => p.user.id !== localStorage.getItem('userId'));
            return other ? other.user.role : '';
        }
        return '';
    };

    const getLastMessage = (chat) => {
        if (chat.messages && chat.messages.length > 0) {
            const lastMsg = chat.messages[0];
            return {
                content: lastMsg.content,
                time: new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
        return { content: 'No messages yet', time: '' };
    };

    const filteredChats = chats.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="w-full bg-white h-full border-r flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full bg-white h-full border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="h-16 px-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-300">
                        {/* Placeholder for current user avatar */}
                        <img
                            src={`https://ui-avatars.com/api/?name=Me&background=random`}
                            alt="Profile"
                            className="w-full h-full rounded-full"
                        />
                    </div>
                    <div className="flex gap-4 text-gray-600">
                        <button
                            onClick={handleNewChatClick}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            title="New Chat"
                        >
                            <MessageSquare size={20} />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-2 bg-white border-b border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full pl-10 pr-4 py-1.5 bg-gray-100 border-none rounded-lg text-sm focus:ring-0 focus:bg-gray-50 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredChats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-sm">No chats found</p>
                        </div>
                    ) : (
                        <ul>
                            {filteredChats.map(chat => {
                                const lastMsg = getLastMessage(chat);
                                return (
                                    <li
                                        key={chat.id}
                                        onClick={() => onSelectChat(chat)}
                                        className={`group px-3 py-3 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${activeChatId === chat.id ? 'bg-gray-100' : ''
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gray-200 overflow-hidden">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${getChatName(chat)}&background=random`}
                                                alt={getChatName(chat)}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="text-[17px] font-normal text-gray-900 truncate">
                                                    {getChatName(chat)}
                                                </h3>
                                                <span className={`text-xs ${activeChatId === chat.id ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {lastMsg.time}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                                {/* Simulate 'read' ticks for now if needed, or just text */}
                                                <span>{lastMsg.content}</span>
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* New Chat Modal - Kept relatively simple but cleaner */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-emerald-600 px-4 py-4 flex items-center justify-between shrink-0">
                            <h3 className="text-white font-medium text-lg">New Chat</h3>
                            <button onClick={() => setShowNewChatModal(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            {loadingUsers ? (
                                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-500">
                                    <p>{error}</p>
                                    <button onClick={fetchUsers} className="text-sm underline mt-2">Retry</button>
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No contacts available</p>
                            ) : (
                                <div className="space-y-4">
                                    {['ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'].map(role => {
                                        const roleUsers = users.filter(u => u.role === role);
                                        if (roleUsers.length === 0) return null;
                                        return (
                                            <div key={role}>
                                                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 px-2">{role}</div>
                                                <div className="space-y-1">
                                                    {roleUsers.map(user => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => handleCreateChat(user.id)}
                                                            className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                                <img src={`https://ui-avatars.com/api/?name=${user.fullName}&background=random`} alt="" className="w-full h-full" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{user.fullName}</div>
                                                                <div className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatSidebar;

