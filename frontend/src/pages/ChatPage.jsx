import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { initiateSocketConnection, disconnectSocket } from '../services/socketService';

const ChatPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialChatId = searchParams.get('chatId');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            initiateSocketConnection(token);
        }
        return () => {
            disconnectSocket();
        };
    }, []);

    // Clear search param and local selection
    const handleBack = () => {
        setSelectedChat(null);
        setSearchParams({});
    };

    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl">
            <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-96 h-full border-r border-gray-100`}>
                <ChatSidebar
                    onSelectChat={setSelectedChat}
                    activeChatId={selectedChat?.id}
                    initialChatId={initialChatId}
                />
            </div>

            <div className={`${selectedChat ? 'block' : 'hidden lg:flex'} flex-1 h-full`}>
                <ChatWindow
                    chat={selectedChat}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
};

export default ChatPage;
