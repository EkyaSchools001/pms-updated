import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Adjust if deployed

let socket;

export const initiateSocketConnection = (token) => {
    socket = io(SOCKET_URL, {
        auth: {
            token,
        },
    });
    console.log('Connecting to socket...');
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};

export const joinChat = (chatId) => {
    if (socket && chatId) {
        socket.emit('join_chat', chatId);
    }
};

export const subscribeToMessages = (cb) => {
    if (!socket) return;
    socket.on('receive_message', (message) => {
        console.log('Message received:', message);
        cb(message);
    });
};

export const subscribeToMessageUpdates = (onEdit, onDelete) => {
    if (!socket) return;
    socket.on('message_edited', (message) => onEdit(message));
    socket.on('message_deleted', (data) => onDelete(data));
};

export const subscribeToChatFeatures = ({ onTyping, onStopTyping, onRead, onReaction }) => {
    if (!socket) return;
    socket.on('typing', (data) => onTyping && onTyping(data));
    socket.on('stop_typing', (data) => onStopTyping && onStopTyping(data));
    socket.on('user_read_messages', (data) => onRead && onRead(data));
    socket.on('reaction_added', (data) => onReaction && onReaction(data));
};

export const emitTyping = (chatId, userName) => {
    if (socket) socket.emit('typing', { chatId, userName });
};

export const emitStopTyping = (chatId) => {
    if (socket) socket.emit('stop_typing', { chatId });
};

export const emitMarkAsRead = (chatId) => {
    if (socket) socket.emit('mark_as_read', { chatId });
};

export const emitAddReaction = (messageId, emoji, chatId) => {
    if (socket) socket.emit('add_reaction', { messageId, emoji, chatId });
};

export const getSocket = () => socket;
