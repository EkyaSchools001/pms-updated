require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const prisma = require('./src/utils/prisma');
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to Database');

        const server = http.createServer(app);

        // Initialize Socket.IO with Auth
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Socket Auth Middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error"));

            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) return next(new Error("Authentication error"));
                socket.userId = decoded.userId; // Fixed: Use decoded.userId instead of decoded.id
                next();
            });
        });

        // Store io instance in app for use in controllers
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log('🔌 New client connected:', socket.id, 'User:', socket.userId);

            // Join personal room for individual signaling
            socket.join(socket.userId);

            socket.on('join_chat', (chatId) => {
                socket.join(chatId);
                console.log(`User ${socket.userId} joined chat: ${chatId}`);
            });

            socket.on('disconnect', async () => {
                console.log('❌ Client disconnected:', socket.id);
                // Update lastSeen
                try {
                    await prisma.user.update({
                        where: { id: socket.userId },
                        data: { lastSeen: new Date() }
                    });
                } catch (e) {
                    console.error('Error updating lastSeen:', e);
                }
            });

            // --- Chat Features ---
            socket.on('typing', (data) => {
                // data: { chatId, userName }
                socket.to(data.chatId).emit('typing', {
                    userId: socket.userId,
                    userName: data.userName,
                    chatId: data.chatId
                });
            });

            socket.on('stop_typing', (data) => {
                // data: { chatId }
                socket.to(data.chatId).emit('stop_typing', {
                    userId: socket.userId,
                    chatId: data.chatId
                });
            });

            socket.on('mark_as_read', async (data) => {
                // data: { chatId }
                try {
                    await prisma.chatParticipant.update({
                        where: { chatId_userId: { chatId: data.chatId, userId: socket.userId } },
                        data: { lastReadAt: new Date() }
                    });
                    socket.to(data.chatId).emit('user_read_messages', {
                        userId: socket.userId,
                        chatId: data.chatId,
                        readAt: new Date()
                    });
                } catch (e) {
                    console.error('Error marking as read:', e);
                }
            });

            socket.on('add_reaction', async (data) => {
                // data: { messageId, emoji, chatId }
                try {
                    const reaction = await prisma.messageReaction.upsert({
                        where: {
                            messageId_userId_emoji: {
                                messageId: data.messageId,
                                userId: socket.userId,
                                emoji: data.emoji
                            }
                        },
                        update: { createdAt: new Date() },
                        create: {
                            messageId: data.messageId,
                            userId: socket.userId,
                            emoji: data.emoji
                        },
                        include: { user: { select: { id: true, fullName: true } } }
                    });
                    io.to(data.chatId).emit('reaction_added', {
                        messageId: data.messageId,
                        reaction,
                        chatId: data.chatId
                    });
                } catch (e) {
                    console.error('Error adding reaction:', e);
                }
            });

            // --- WebRTC Signaling ---
            socket.on('call_user', async (data) => {
                console.log(`📞 Call Initiated: from ${socket.userId} (${socket.id}) for chat ${data.chatId}`);
                try {
                    const chat = await prisma.chat.findUnique({
                        where: { id: data.chatId },
                        include: { participants: { include: { user: true } } }
                    });

                    if (chat) {
                        console.log(`👥 Found ${chat.participants.length} participants for chat ${data.chatId}`);
                        chat.participants.forEach(p => {
                            if (p.userId !== socket.userId) {
                                console.log(`📡 Relaying call to User ${p.userId} in room ${p.userId}`);
                                io.to(p.userId).emit('call_user', {
                                    signal: data.signalData,
                                    from: socket.id,
                                    name: data.name
                                });
                            }
                        });
                    } else {
                        console.warn(`⚠️ Chat ${data.chatId} not found for call`);
                    }
                } catch (error) {
                    console.error('❌ Error in call_user signaling:', error);
                }
            });

            socket.on('answer_call', (data) => {
                console.log(`✅ Call Answered: Relay signal to ${data.to}`);
                io.to(data.to).emit('call_accepted', {
                    signal: data.signal,
                    from: socket.id
                });
            });

            socket.on('ice_candidate', (data) => {
                console.log(`❄️ ICE Candidate: Relay to ${data.to}`);
                io.to(data.to).emit('ice_candidate', { candidate: data.candidate });
            });

            socket.on('end_call', async (data) => {
                // data: { to, chatId }
                if (data.to) {
                    console.log(`🔴 Call Ended: Notify User ${data.to}`);
                    io.to(data.to).emit('call_ended');
                }

                if (data.chatId) {
                    console.log(`🔴 Call Cancelled: Notify participants of chat ${data.chatId}`);
                    try {
                        const chat = await prisma.chat.findUnique({
                            where: { id: data.chatId },
                            include: { participants: true }
                        });
                        if (chat) {
                            chat.participants.forEach(p => {
                                if (p.userId !== socket.userId) {
                                    io.to(p.userId).emit('call_ended');
                                }
                            });
                        }
                    } catch (error) {
                        console.error('❌ Error broadcasting end_call:', error);
                    }
                }
            });

            socket.on('ringing', (data) => {
                console.log(`🔔 Ringing: Notify caller ${data.to}`);
                io.to(data.to).emit('ringing');
            });
        });

        const { checkTicketReminders } = require('./src/controllers/ticketController');

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);

            // Start ticket reminder checker (runs every 15 minutes)
            setInterval(() => {
                console.log('⏰ Running ticket reminder check...');
                checkTicketReminders();
            }, 15 * 60 * 1000);
        });

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();
