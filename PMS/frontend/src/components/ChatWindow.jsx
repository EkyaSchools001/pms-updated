import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { joinChat, subscribeToMessages } from '../services/socketService';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, ArrowLeft } from 'lucide-react';
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
        isCalling
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
        // Prepend API Base URL if it's a relative path. Assuming local for now.
        // If production, might need full URL.
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

        return (
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded mb-2">
                <div className="bg-gray-200 p-2 rounded">
                    <Paperclip size={20} className="text-gray-500" />
                </div>
                <div className="text-sm overflow-hidden">
                    <p className="truncate font-medium text-gray-700 max-w-[150px]">{attachment.filename}</p>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">Download</a>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-[#E6F0FF] relative">
            {/* Background Pattern Overlay removed for cleaner look */}

            {/* Header */}
            <div className="h-16 bg-gray-100 flex items-center justify-between px-4 py-2 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4 cursor-pointer">
                    <button
                        onClick={onBack}
                        className="lg:hidden p-1 hover:bg-gray-200 rounded-lg text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                        <img
                            src={`https://ui-avatars.com/api/?name=${getChatName()}&background=random`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-gray-900 font-medium leading-tight">{getChatName()}</h2>
                        <p className="text-xs text-gray-500">click here for contact info</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 text-gray-500">
                    <Search size={20} className="cursor-pointer" />
                    <Phone size={20} className="cursor-pointer hover:text-green-600" onClick={handleAudioCall} />
                    <Video size={20} className="cursor-pointer hover:text-green-600" onClick={handleVideoCall} />
                    <MoreVertical size={20} className="cursor-pointer" />
                </div>
            </div>

            <CallModal
                receivingCall={call.isReceivingCall}
                callAccepted={callAccepted}
                callEnded={callEnded}
                name={call.name}
                answerCall={answerCall}
                leaveCall={leaveCall}
                myVideo={myVideo}
                userVideo={userVideo}
                stream={stream}
                isCalling={isCalling}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar space-y-2">
                {messages.map((msg, index) => {
                    const isSelf = msg.senderId === userId;
                    const showSenderName = !isSelf && (index === 0 || messages[index - 1].senderId !== msg.senderId) && chat.type === 'GROUP';

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
                            className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`
                                max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-sm relative group
                                ${isSelf ? 'bg-[#8AA0E5] text-white rounded-tr-none' : 'bg-[#2c3E50] text-white rounded-tl-none'}
                            `}>
                                {/* Tiny triangle for bubble tail */}
                                <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent 
                                    ${isSelf
                                        ? 'border-t-[#8AA0E5] border-l-[#8AA0E5]'
                                        : 'border-t-[#2c3E50] border-r-[#2c3E50]'}
                                `}></div>

                                {showSenderName && (
                                    <div className="text-xs font-bold text-orange-400 mb-0.5 capitalize">
                                        {msg.sender.fullName}
                                    </div>
                                )}

                                {attachments.length > 0 && (
                                    <div className="mb-1">
                                        {attachments.map((att, i) => (
                                            <div key={i}>{renderAttachment(att)}</div>
                                        ))}
                                    </div>
                                )}

                                <div className="text-white leading-relaxed pr-6 break-words">
                                    {msg.content}
                                </div>

                                <span className={`text-[10px] float-right mt-1 ml-2 ${isSelf ? 'text-blue-100/70' : 'text-gray-300/60'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-4 z-10 shrink-0">
                <div className="flex gap-4 text-gray-500">
                    <div className="relative">
                        <Paperclip
                            size={24}
                            className={`cursor-pointer hover:text-gray-600 ${isUploading ? 'animate-pulse text-blue-500' : ''}`}
                            onClick={handleFileSelect}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <form onSubmit={handleSend} className="flex-1">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message"
                        className="w-full py-2 px-4 rounded-lg border-none focus:ring-0 text-sm bg-white placeholder-gray-500"
                    />
                </form>

                <div className="text-gray-500 cursor-pointer hover:text-gray-600">
                    {newMessage.trim() ? (
                        <button onClick={handleSend}><Send size={24} /></button>
                    ) : (
                        /* Microphone icon placeholder */
                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" version="1.1" x="0px" y="0px" enableBackground="new 0 0 24 24"><path fill="currentColor" d="M11.999,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M18.237,11.412c0.552,0,1,0.448,1,1 c0,3.987-3.25,7.237-7.237,7.237s-7.238-3.25-7.238-7.237c0-0.552,0.448-1,1-1s1,0.448,1,1c0,2.885,2.353,5.238,5.238,5.238 s5.238-2.353,5.238-5.238C17.237,11.859,17.685,11.412,18.237,11.412z M12,21.054c-0.552,0-1,0.448-1,1v0.995c0,0.552,0.448,1,1,1 s1-0.448,1-1v-0.995C13,21.501,12.552,21.054,12,21.054z"></path></svg>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;

