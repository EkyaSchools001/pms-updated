import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { joinChat, subscribeToMessages, subscribeToMessageUpdates } from '../services/socketService';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, ArrowLeft, Edit2, Trash2, XCircle, CheckCircle, ChevronDown } from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';
import CallModal from './CallModal';

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

    // WebRTC Logic
    const {
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        answerCall,
        leaveCall,
        enableStream,
        isCalling,
        isAudioMuted,
        isVideoOff,
        toggleAudio,
        toggleVideo
    } = useWebRTC();

    useEffect(() => {
        if (chat) {
            fetchMessages();
            joinChat(chat.id);
            setName(currentUser.fullName || userId); // Set name for call
        }
    }, [chat]);

    const handleVideoCall = async () => {
        await enableStream(true, true); // Video + Audio
        callUser(chat.id);
    };

    const handleAudioCall = async () => {
        await enableStream(false, true); // Audio only (Video=false)
        callUser(chat.id);
    };

    // ... existing useEffects ...

    useEffect(() => {
        subscribeToMessages((message) => {
            if (chat && message.chatId === chat.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
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
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('chats/message', {
                chatId: chat.id,
                content: newMessage
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
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
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] border-b-8 border-emerald-500">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-light text-gray-500">Project Chat</h1>
                <p className="text-gray-500 text-sm">Select a chat to start messaging.</p>
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
                <div className="mb-2">
                    <img
                        src={fileUrl}
                        alt={attachment.filename}
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(fileUrl, '_blank')}
                    />
                </div>
            );
        }

        if (isAudio) {
            return (
                <div className="mb-2 bg-white/10 p-2 rounded-xl border border-white/20 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                            <svg viewBox="0 0 24 24" height="16" width="16"><path fill="currentColor" d="M12,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M12,21.054c-0.552,0-1,0.448-1,1v0.995c0,0.552,0.448,1,1,1 s1-0.448,1-1v-0.995C13,21.501,12.552,21.054,12,21.054z"></path></svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Voice Memo</span>
                    </div>
                    <audio src={fileUrl} controls className="w-full h-8 custom-audio-player" />
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded mb-2">
                <div className="bg-gray-200 p-2 rounded">
                    <Paperclip size={20} className="text-gray-500" />
                </div>
                <div className="text-sm overflow-hidden text-gray-800">
                    <p className="truncate font-medium max-w-[150px]">{attachment.filename}</p>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs text-right block">Download</a>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F0F2F5] relative overflow-hidden">
            {/* Sophisticated Subtle Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1E3A8A 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {/* Header */}
            <div className="h-16 bg-white flex items-center justify-between px-6 py-2 shadow-sm z-20 shrink-0 border-b border-gray-200">
                <div className="flex items-center gap-4 cursor-pointer">
                    <button
                        onClick={onBack}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 p-[1px] shadow-sm border border-gray-200">
                        <img
                            src={`https://ui-avatars.com/api/?name=${getChatName()}&background=F0F2F5&color=1E3A8A&bold=true`}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>
                    <div>
                        <h2 className="text-navy-900 font-bold leading-tight tracking-tight text-[#1E3A8A]">{getChatName()}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">Online</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-5 text-gray-400 font-semibold">
                    <button className="p-2 hover:bg-gray-100 rounded-xl hover:text-[#1E3A8A] transition-all"><Search size={20} /></button>
                    <button onClick={handleAudioCall} className="p-2 hover:bg-gray-100 rounded-xl hover:text-emerald-600 transition-all text-gray-500"><Phone size={20} /></button>
                    <button onClick={handleVideoCall} className="p-2 hover:bg-gray-100 rounded-xl hover:text-blue-600 transition-all text-gray-500"><Video size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-xl hover:text-[#1E3A8A] transition-all"><MoreVertical size={20} /></button>
                </div>
            </div>

            <CallModal
                receivingCall={call.isReceivingCall}
                callAccepted={callAccepted}
                callEnded={callEnded}
                name={getChatName()}
                answerCall={answerCall}
                leaveCall={leaveCall}
                myVideo={myVideo}
                userVideo={userVideo}
                stream={stream}
                isCalling={isCalling}
                isAudioMuted={isAudioMuted}
                isVideoOff={isVideoOff}
                toggleAudio={toggleAudio}
                toggleVideo={toggleVideo}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 z-10 custom-scrollbar space-y-4">
                {messages.filter(m => !localDeletedIds.includes(m.id)).map((msg, index) => {
                    const isSelf = msg.senderId === userId;
                    const showSenderName = !isSelf && (index === 0 || messages[index - 1].senderId !== msg.senderId) && chat.type === 'GROUP';
                    const isMenuOpen = activeMenuId === msg.id;

                    let attachments = [];
                    try {
                        if (msg.attachments) {
                            attachments = JSON.parse(msg.attachments);
                        }
                    } catch (e) {
                        console.error('Failed to parse attachments', e);
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`
                                max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-sm text-sm relative group transition-all duration-200
                                ${isSelf
                                    ? 'bg-[#E0E7FF] text-[#1E3A8A] rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                                mb-2
                            `}>
                                {/* Tiny triangle for bubble tail */}
                                <div className={`absolute top-0 w-0 h-0 border-[8px] border-transparent
                                    ${isSelf
                                        ? 'border-t-[#E0E7FF] border-l-[#E0E7FF] -right-2'
                                        : 'border-t-white border-r-white -left-2'}
                                `}></div>

                                {showSenderName && (
                                    <div className="text-[11px] font-bold text-[#1E3A8A] mb-1 capitalize flex items-center gap-1 opacity-80 uppercase tracking-widest">
                                        {msg.sender.fullName}
                                    </div>
                                )}

                                {isSelf && !msg.deletedAt && editingMessageId !== msg.id && (
                                    <div className={`absolute top-1 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 ${isMenuOpen ? 'opacity-100 translate-x-0' : ''}`}>
                                        <button
                                            onClick={() => setActiveMenuId(isMenuOpen ? null : msg.id)}
                                            className="text-gray-400 hover:text-[#1E3A8A] focus:outline-none p-1.5 rounded-xl hover:bg-gray-100 transition-all"
                                        >
                                            <ChevronDown size={14} />
                                        </button>

                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-8 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                <button
                                                    onClick={() => {
                                                        setEditingMessageId(msg.id);
                                                        setEditContent(msg.content);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-[#1E3A8A] text-xs font-bold transition-colors"
                                                >
                                                    <Edit2 size={13} className="text-blue-500" /> Edit Message
                                                </button>
                                                <div className="h-[1px] bg-gray-100 mx-2 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setDeleteTargetId(msg.id);
                                                        setShowDeleteOptions(true);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-red-500 text-xs font-bold transition-colors"
                                                >
                                                    <Trash2 size={13} className="text-red-500" /> Delete Message
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Non-self messages only show "Delete for me" option */}
                                {!isSelf && !msg.deletedAt && (
                                    <div className={`absolute top-1 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 ${isMenuOpen ? 'opacity-100 translate-x-0' : ''}`}>
                                        <button
                                            onClick={() => setActiveMenuId(isMenuOpen ? null : msg.id)}
                                            className="text-gray-400 hover:text-[#1E3A8A] focus:outline-none p-1.5 rounded-xl hover:bg-gray-100 transition-all"
                                        >
                                            <ChevronDown size={14} />
                                        </button>

                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                                <button
                                                    onClick={() => {
                                                        setLocalDeletedIds(prev => [...prev, msg.id]);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-800 text-xs font-bold transition-colors"
                                                >
                                                    <Trash2 size={13} className="text-gray-400" /> Delete for me
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {attachments.length > 0 && (
                                    <div className="mb-1">
                                        {attachments.map((att, i) => (
                                            <div key={i}>{renderAttachment(att)}</div>
                                        ))}
                                    </div>
                                )}

                                {editingMessageId === msg.id ? (
                                    <div className="flex flex-col gap-3 min-w-[240px] py-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 text-sm focus:ring-2 focus:ring-[#1E3A8A]/20 focus:outline-none resize-none shadow-inner placeholder-gray-400"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 px-1">
                                            <button
                                                onClick={() => setEditingMessageId(null)}
                                                className="p-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-all text-xs font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleEditMessage(msg.id)}
                                                className="p-2 px-5 bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-xl text-white shadow-md shadow-[#1E3A8A]/20 transition-all text-xs font-bold active:scale-95"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`leading-relaxed break-words pr-8 relative ${msg.deletedAt ? 'italic text-gray-400 text-[13px] flex items-center gap-2' : 'text-inherit'}`}>
                                        {msg.deletedAt && <XCircle size={14} className="opacity-50" />}
                                        {msg.content}
                                        {msg.updatedAt && !msg.deletedAt && (
                                            <span className="text-[9px] text-gray-400 ml-2 italic font-normal tracking-wide">(edited)</span>
                                        )}
                                    </div>
                                )}

                                <span className={`text-[10px] float-right mt-1.5 ml-2 font-bold tracking-tight uppercase ${isSelf ? 'text-[#1E3A8A]/40' : 'text-gray-400/60'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteOptions && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-sm border border-red-100">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-[#1E3A8A] mb-3 tracking-tight">Delete message?</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed font-medium">This action cannot be undone. Choose how you'd like to remove this message.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleDeleteMessage(deleteTargetId, true)}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-red-600/10 active:scale-[0.98] text-sm uppercase tracking-widest"
                                >
                                    Delete for everyone
                                </button>
                                <button
                                    onClick={() => handleDeleteMessage(deleteTargetId, false)}
                                    className="w-full py-4 bg-white hover:bg-gray-50 text-gray-600 font-bold rounded-2xl transition-all border border-gray-200 active:scale-[0.98] text-sm uppercase tracking-widest"
                                >
                                    Delete for me
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteOptions(false);
                                        setDeleteTargetId(null);
                                    }}
                                    className="w-full py-4 text-gray-400 font-bold hover:text-[#1E3A8A] transition-colors text-xs uppercase tracking-[0.2em] mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white px-6 py-5 flex items-center gap-5 z-20 shrink-0 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <div className="flex gap-4 text-gray-400">
                    <div className="relative group">
                        <button
                            onClick={handleFileSelect}
                            className={`p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:text-[#1E3A8A] transition-all transform group-active:scale-90 border border-gray-100 ${isUploading ? 'animate-pulse text-blue-500' : ''}`}
                        >
                            <Paperclip size={22} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <form onSubmit={handleSend} className="flex-1 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full py-3.5 px-6 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#1E3A8A]/10 bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none transition-all shadow-sm"
                    />
                </form>

                <div className="relative">
                    {newMessage.trim() ? (
                        <button
                            onClick={handleSend}
                            className="p-3.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-2xl shadow-lg shadow-[#1E3A8A]/10 hover:shadow-[#1E3A8A]/20 hover:-translate-y-0.5 transition-all active:scale-90"
                        >
                            <Send size={22} />
                        </button>
                    ) : (
                        <button
                            className={`p-3.5 rounded-2xl transition-all shadow-sm group flex items-center justify-center border border-gray-100 ${isRecording ? 'bg-red-500 text-white shadow-red-200 animate-pulse border-red-400' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1E3A8A]'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" className="transition-transform group-active:scale-90"><path fill="currentColor" d="M11.999,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M18.237,11.412c0.552,0,1,0.448,1,1 c0,3.987-3.25,7.237-7.237,7.237s-7.238-3.25-7.238-7.237c0-0.552,0.448-1,1-1s1,0.448,1,1c0,2.885,2.353,5.238,5.238,5.238 s5.238-2.353,5.238-5.238C17.237,11.859,17.685,11.412,18.237,11.412z M12,21.054c-0.552,0-1,0.448-1,1v0.995c0,0.552,0.448,1,1,1 s1-0.448,1-1v-0.995C13,21.501,12.552,21.054,12,21.054z"></path></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;

