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

export const sendMessage = () => {
    if (socket) {
        // We are sending via API, but we could also emit here if we wanted optimistic UI
        // socket.emit('send_message', { chatId: _chatId, content: _content });
    }
};

export const getSocket = () => socket;
