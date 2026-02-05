import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { joinChat, subscribeToMessages, subscribeToMessageUpdates, subscribeToChatFeatures, emitTyping, emitStopTyping, emitMarkAsRead, emitAddReaction } from '../services/socketService';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, ArrowLeft, Edit2, Trash2, XCircle, CheckCircle, ChevronDown, MessageSquare, Reply, Smile, X } from 'lucide-react';
import { useCall } from '../context/CallContext';

const ChatWindow = ({ chat, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const userId = localStorage.getItem('userId');

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Voice Memo State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunks = useRef([]);

    // Message Management State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [showDeleteOptions, setShowDeleteOptions] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [localDeletedIds, setLocalDeletedIds] = useState([]); // For "Delete for me"

    // Advanced Features State
    const [typingUsers, setTypingUsers] = useState({});
    const [replyTo, setReplyTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null); // msgId
    const typingTimeoutRef = useRef(null);

    // WebRTC Logic from Global Context
    const { callUser } = useCall();

    useEffect(() => {
        if (chat) {
            fetchMessages();
            joinChat(chat.id);
        }
    }, [chat]);

    const handleVideoCall = async () => {
        callUser(chat.id, getChatName(), true);
    };

    const handleAudioCall = async () => {
        callUser(chat.id, getChatName(), false);
    };

    // ... existing useEffects ...

    useEffect(() => {
        subscribeToMessages((message) => {
            if (chat && message.chatId === chat.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
                // Mark as read immediately if chat is open
                emitMarkAsRead(chat.id);
            }
        });

        subscribeToMessageUpdates(
            (updatedMessage) => {
                if (chat && updatedMessage.chatId === chat.id) {
                    setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg));
                }
            },
            ({ messageId, chatId }) => {
                if (chat && chatId === chat.id) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === messageId
                            ? { ...msg, content: 'This message was deleted', deletedAt: new Date(), attachments: null }
                            : msg
                    ));
                }
            }
        );

        subscribeToChatFeatures({
            onTyping: ({ userId: tUserId, userName, chatId: tChatId }) => {
                if (chat && tChatId === chat.id && tUserId !== userId) {
                    setTypingUsers(prev => ({ ...prev, [tUserId]: userName }));
                }
            },
            onStopTyping: ({ userId: tUserId, chatId: tChatId }) => {
                if (chat && tChatId === chat.id) {
                    setTypingUsers(prev => {
                        const newUsers = { ...prev };
                        delete newUsers[tUserId];
                        return newUsers;
                    });
                }
            },
            onReaction: ({ messageId, reaction, chatId: rChatId }) => {
                if (chat && rChatId === chat.id) {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === messageId) {
                            const newReactions = [...(msg.reactions || [])];
                            const existingIndex = newReactions.findIndex(r => r.userId === reaction.userId && r.emoji === reaction.emoji);
                            if (existingIndex > -1) {
                                newReactions[existingIndex] = reaction;
                            } else {
                                newReactions.push(reaction);
                            }
                            return { ...msg, reactions: newReactions };
                        }
                        return msg;
                    }));
                }
            }
        });

        // Mark existing as read when opening chat
        if (chat) emitMarkAsRead(chat.id);
    }, [chat]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`chats/${chat.id}/messages`);
            setMessages(response.data);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !isUploading) return;

        const content = newMessage;
        const replyToId = replyTo?.id;

        setNewMessage('');
        setReplyTo(null);
        emitStopTyping(chat.id);

        try {
            await api.post('chats/message', {
                chatId: chat.id,
                content,
                replyToId
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        emitTyping(chat.id, currentUser.fullName);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(chat.id);
        }, 3000);
    };

    const handleAddReaction = (msgId, emoji) => {
        emitAddReaction(msgId, emoji, chat.id);
        setShowEmojiPicker(null);
    };

    const formatMessageContent = (content) => {
        if (!content) return '';
        // Escape HTML
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Bold: *text*
        // Italic: _text_
        // Strikethrough: ~text~
        return escaped
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~(.*?)~/g, '<del>$1</del>')
            .replace(/\n/g, '<br />');
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await api.post('chats/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Send message with attachment
            await api.post('chats/message', {
                chatId: chat.id,
                content: '', // No text content for now
                attachments: [uploadRes.data]
            });
        } catch (error) {
            console.error('Error uploading/sending file:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-memo-${Date.now()}.webm`, { type: 'audio/webm' });

                // Upload the recorded audio
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', audioFile);

                try {
                    const uploadRes = await api.post('chats/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    await api.post('chats/message', {
                        chatId: chat.id,
                        content: '',
                        attachments: [uploadRes.data]
                    });
                } catch (error) {
                    console.error('Error uploading voice memo:', error);
                    alert('Failed to send voice memo');
                } finally {
                    setIsUploading(false);
                }

                // Stop all tracks in the stream
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleEditMessage = async (msgId) => {
        if (!editContent.trim()) return;
        try {
            await api.put(`chats/message/${msgId}`, { content: editContent });
            setEditingMessageId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error editing message:', error);
            alert('Failed to edit message');
        }
    };

    const handleDeleteMessage = async (msgId, forEveryone = true) => {
        if (forEveryone) {
            try {
                await api.delete(`chats/message/${msgId}`);
            } catch (error) {
                console.error('Error deleting message:', error);
                alert('Failed to delete message for everyone');
            }
        } else {
            // Delete for me (local hide)
            setLocalDeletedIds(prev => [...prev, msgId]);
        }
        setShowDeleteOptions(false);
        setDeleteTargetId(null);
    };

    if (!chat) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="text-center space-y-4 max-w-sm px-6">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                    <MessageSquare size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Workspace Chat</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Select a conversation from the sidebar to start collaborating with your team in real-time.
                </p>
            </div>
        </div>
    );

    const getChatName = () => {
        if (chat.type === 'PRIVATE') {
            const other = chat.participants.find(p => p.user.id !== userId);
            return other ? other.user.fullName : 'Unknown User';
        }
        return chat.name;
    };

    const renderAttachment = (attachment) => {
        const isImage = attachment.mimetype.startsWith('image/');
        const isAudio = attachment.mimetype.startsWith('audio/');
        const fileUrl = `http://localhost:5000${attachment.url}`;

        if (isImage) {
            return (
                <div className="mb-2 overflow-hidden rounded-xl border border-gray-100">
                    <img
                        src={fileUrl}
                        alt={attachment.filename}
                        className="max-w-full rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        onClick={() => window.open(fileUrl, '_blank')}
                    />
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="mb-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                            <Phone size={14} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Voice Memo</span>
                    </div>
                    <audio src={fileUrl} controls className="w-full h-8 custom-audio-player" />
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600 shrink-0">
                    <Paperclip size={18} />
                </div>
                <div className="text-sm overflow-hidden flex-1">
                    <p className="truncate font-semibold text-gray-800">{attachment.filename}</p>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">Download File</a>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                    <button
                        onClick={onBack}
                        className="lg:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-2 ring-gray-50">
                            <img
                                src={`https://ui-avatars.com/api/?name=${getChatName()}&background=EEF2FF&color=4F46E5&bold=true`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-none mb-1">{getChatName()}</h2>
                        <div className="flex items-center gap-1.5">
                            {Object.keys(typingUsers).length > 0 ? (
                                <p className="text-[11px] text-indigo-600 font-bold animate-pulse">Typing...</p>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                                        {chat.type === 'PRIVATE' && chat.participants.find(p => p.userId !== userId)?.user?.lastSeen
                                            ? `Online` // Simplified for now, or use lastSeen date
                                            : 'Active Now'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleAudioCall} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Phone size={19} /></button>
                    <button onClick={handleVideoCall} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Video size={19} /></button>
                    <div className="w-[1px] h-4 bg-gray-200 mx-2"></div>
                    <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><MoreVertical size={19} /></button>
                </div>
            </div>


            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 custom-scrollbar bg-[#F8FAFC]">
                <div className="flex flex-col gap-4">
                    {messages.filter(m => !localDeletedIds.includes(m.id)).map((msg, index) => {
                        const isSelf = msg.senderId === userId;
                        const showSenderName = !isSelf && (index === 0 || messages[index - 1].senderId !== msg.senderId) && chat.type === 'GROUP';
                        const isMenuOpen = activeMenuId === msg.id;

                        let attachments = [];
                        try {
                            if (msg.attachments) {
                                attachments = typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments;
                            }
                        } catch (e) {
                            console.error('Failed to parse attachments', e);
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isSelf ? 'justify-end' : 'justify-start'} group items-end gap-2`}
                            >
                                {!isSelf && (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 mb-1">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${msg.sender.fullName}&background=F3F4F6&color=6B7280`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                                    {showSenderName && (
                                        <span className="text-[11px] font-bold text-gray-500 ml-1 mb-1">{msg.sender.fullName}</span>
                                    )}

                                    <div className={`
                                        group/bubble relative
                                        px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed
                                        ${isSelf
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 rounded-br-none'
                                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'}
                                        ${attachments.length > 0 ? 'p-1.5 pb-2.5' : ''}
                                    `}>
                                        {/* Reply Preview inside bubble */}
                                        {msg.replyTo && (
                                            <div className={`
                                                mb-2 p-2 rounded-lg border-l-4 text-xs
                                                ${isSelf ? 'bg-black/10 border-white/40 text-white' : 'bg-gray-50 border-indigo-500 text-gray-600'}
                                            `}>
                                                <p className="font-bold mb-0.5">{msg.replyTo.sender.fullName}</p>
                                                <p className="opacity-80 truncate">{msg.replyTo.content}</p>
                                            </div>
                                        )}

                                        {attachments.length > 0 && (
                                            <div className="mb-2">
                                                {attachments.map((att, i) => (
                                                    <div key={i}>{renderAttachment(att)}</div>
                                                ))}
                                            </div>
                                        )}

                                        {editingMessageId === msg.id ? (
                                            <div className="min-w-[200px]">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-inherit text-sm focus:outline-none resize-none"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={() => setEditingMessageId(null)} className="text-[11px] hover:underline font-bold">Cancel</button>
                                                    <button onClick={() => handleEditMessage(msg.id)} className="text-[11px] bg-white text-indigo-600 px-3 py-1 rounded-lg font-bold">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="break-words">
                                                {msg.deletedAt ? (
                                                    <span className="flex items-center gap-1.5 opacity-60 text-[13px] italic">
                                                        <XCircle size={14} /> This message was deleted
                                                    </span>
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }} />
                                                )}
                                                {msg.updatedAt && !msg.deletedAt && (
                                                    <span className={`text-[10px] ml-2 opacity-60 italic`}>(edited)</span>
                                                )}
                                            </div>
                                        )}

                                        <div className={`text-[9px] mt-1.5 flex justify-end items-center gap-1 font-bold uppercase tracking-wider ${isSelf ? 'text-white/60' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isSelf && !msg.deletedAt && (
                                                <CheckCircle size={10} className="text-white/80" />
                                            )}
                                        </div>

                                        {/* Reactions Display */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={`absolute -bottom-3 ${isSelf ? 'right-0' : 'left-0'} flex -space-x-1`}>
                                                {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                                    <div key={emoji} className="bg-white rounded-full px-1.5 py-0.5 text-[12px] shadow-sm border border-gray-100 animate-in zoom-in-50">
                                                        {emoji}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Buttons (Bubble Actions like Instagram) */}
                                        {!msg.deletedAt && (
                                            <div className={`
                                                absolute top-0 ${isSelf ? '-left-20' : '-right-20'} 
                                                flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity
                                            `}>
                                                <button
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                                >
                                                    <Smile size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setReplyTo(msg)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                                >
                                                    <Reply size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Emoji Picker Popover */}
                                        {showEmojiPicker === msg.id && (
                                            <div className={`absolute bottom-full mb-2 ${isSelf ? 'right-0' : 'left-0'} bg-white rounded-full shadow-2xl border border-gray-100 p-1.5 flex gap-1 z-[60] animate-in slide-in-from-bottom-2`}>
                                                {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleAddReaction(msg.id, emoji)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-transform hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Context Menu (Modified) */}
                                        {isMenuOpen && (
                                            <div className={`absolute ${isSelf ? 'right-0' : 'left-0'} top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 min-w-[140px] animate-in zoom-in-95`}>
                                                {isSelf && (
                                                    <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700 font-bold">
                                                        <Edit2 size={13} className="text-gray-400" /> Edit
                                                    </button>
                                                )}
                                                <button onClick={() => { setDeleteTargetId(msg.id); setShowDeleteOptions(true); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-red-600 font-bold">
                                                    <Trash2 size={13} className="text-red-400" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Delete Modal */}
            {showDeleteOptions && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-gray-100 animate-in zoom-in-95">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Message?</h3>
                            <p className="text-gray-500 text-sm mb-6">Are you sure you want to remove this message?</p>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleDeleteMessage(deleteTargetId, true)} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">Delete for everyone</button>
                                <button onClick={() => handleDeleteMessage(deleteTargetId, false)} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Delete for me</button>
                                <button onClick={() => { setShowDeleteOptions(false); setDeleteTargetId(null); }} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white px-4 py-4 sm:px-6 z-20 border-t border-gray-100 flex items-end gap-3">
                <button
                    onClick={handleFileSelect}
                    className={`p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all ${isUploading ? 'animate-pulse' : ''}`}
                >
                    <Paperclip size={20} />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </button>

                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden flex flex-col">
                    {/* Reply Bar */}
                    {replyTo && (
                        <div className="bg-white/50 border-b border-gray-100 px-4 py-2 flex items-center justify-between animate-in slide-in-from-bottom-2">
                            <div className="border-l-4 border-indigo-500 pl-3">
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">Replying to {replyTo.sender.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSend}>
                        <textarea
                            rows={1}
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-transparent py-3 px-4 text-sm text-gray-800 focus:outline-none resize-none max-h-32"
                        />
                    </form>
                </div>

                {newMessage.trim() ? (
                    <button
                        onClick={handleSend}
                        className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <Send size={20} />
                    </button>
                ) : (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    >
                        <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor"><path d="M11.999,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M18.237,11.412c0.552,0,1,0.448,1,1 c0,3.987-3.25,7.237-7.237,7.237s-7.238-3.25-7.238-7.237c0-0.552,0.448-1,1-1s1,0.448,1,1c0,2.885,2.353,5.238,5.238,5.238 s5.238-2.353,5.238-5.238C17.237,11.859,17.685,11.412,18.237,11.412z M12,21.054c-0.552,0-1,0.448-1,1v0.995c0,0.552,0.448,1,1,1 s1-0.448,1-1v-0.995C13,21.501,12.552,21.054,12,21.054z" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;

