const prisma = require('../utils/prisma');
const { sendChatMessageEmail } = require('../services/emailService');
const { sendChatMessageSMS } = require('../services/smsService');

// Create a private chat (1-on-1)
exports.createPrivateChat = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id; // Assumes auth middleware populates req.user

        if (!targetUserId) {
            return res.status(400).json({ error: 'Target user ID is required' });
        }

        // Role-based restriction: Customers can only chat with Admins and Managers
        if (req.user.role === 'CUSTOMER') {
            const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { role: true }
            });

            if (!targetUser) {
                return res.status(404).json({ error: 'Target user not found' });
            }

            if (!['ADMIN', 'MANAGER'].includes(targetUser.role)) {
                return res.status(403).json({ error: 'Customers can only message Support Team (Admins and Managers)' });
            }
        }

        // Check if chat already exists
        const existingChat = await prisma.chat.findFirst({
            where: {
                type: 'PRIVATE',
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: targetUserId } } },
                ],
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
                }
            }
        });

        if (existingChat) {
            return res.json(existingChat);
        }

        // Create new chat
        const newChat = await prisma.chat.create({
            data: {
                type: 'PRIVATE',
                participants: {
                    create: [
                        { userId: currentUserId },
                        { userId: targetUserId },
                    ],
                },
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
                }
            }
        });

        res.status(201).json(newChat);
    } catch (error) {
        console.error('Error creating private chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Upload file
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the file path (relative or absolute URL depending on requirement)
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.originalname, mimetype: req.file.mimetype });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content, attachments, replyToId } = req.body;
        const senderId = req.user.id;

        if (!chatId || (!content && !attachments)) {
            return res.status(400).json({ error: 'Chat ID and content/attachments are required' });
        }

        // Verify user is participant
        const isParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId: senderId,
                },
            },
        });

        if (!isParticipant) {
            return res.status(403).json({ error: 'You are not a participant of this chat' });
        }

        // UN-DELETE chat for all participants (so it reappears if they deleted it)
        await prisma.chatParticipant.updateMany({
            where: { chatId },
            data: { isDeleted: false }
        });

        const message = await prisma.message.create({
            data: {
                chatId,
                senderId,
                content: content || '', // Allow empty content if there's an attachment
                attachments: attachments ? JSON.stringify(attachments) : null,
                replyToId: replyToId || null,
            },
            include: {
                sender: { select: { id: true, fullName: true, profilePicture: true } },
                replyTo: {
                    include: {
                        sender: { select: { id: true, fullName: true } }
                    }
                },
                reactions: {
                    include: { user: { select: { id: true, fullName: true } } }
                }
            },
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(chatId).emit('receive_message', message);

        // Send Email notifications to other participants
        const otherParticipants = await prisma.chatParticipant.findMany({
            where: {
                chatId,
                userId: { not: senderId }
            },
            include: { user: true }
        });

        // Get chat details (for group name if applicable)
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });

        otherParticipants.forEach(participant => {
            if (participant.user.email) {
                sendChatMessageEmail(participant.user.email, {
                    senderName: req.user.fullName,
                    content: content || 'Sent an attachment',
                    chatName: chat.name || 'Private Chat',
                    isGroup: chat.type !== 'PRIVATE'
                });
            }

            if (participant.user.phoneNumber) {
                sendChatMessageSMS(participant.user.phoneNumber, {
                    senderName: req.user.fullName,
                    content: content || 'Sent an attachment'
                });
            }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;

        // Verify access
        const isParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId,
                },
            },
        });

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const messages = await prisma.message.findMany({
            where: {
                chatId,
                createdAt: {
                    gt: isParticipant.clearedAt || new Date(0) // Only show messages after cleared date
                }
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, fullName: true, profilePicture: true } },
                replyTo: {
                    include: {
                        sender: { select: { id: true, fullName: true } }
                    }
                },
                reactions: {
                    include: { user: { select: { id: true, fullName: true } } }
                }
            },
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Clear chat history (hide messages for user)
// Clear chat history (hide messages for user or everyone)
exports.clearChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { forEveryone } = req.body;
        const userId = req.user.id;

        if (forEveryone) {
            // Soft delete all messages in the chat
            await prisma.message.updateMany({
                where: { chatId },
                data: {
                    deletedAt: new Date(),
                    content: 'This message was deleted',
                    attachments: null
                }
            });

            // Emit socket event to clear UI for everyone
            const io = req.app.get('io');
            io.to(chatId).emit('chat_cleared', { chatId });

            res.json({ message: 'Chat cleared for everyone' });
        } else {
            // Clear for me only
            await prisma.chatParticipant.update({
                where: {
                    chatId_userId: { chatId, userId }
                },
                data: {
                    clearedAt: new Date()
                }
            });
            res.json({ message: 'Chat cleared for you' });
        }
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete chat (hide from list)
// Delete chat (hide from list or delete permanently)
exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { forEveryone } = req.body;
        const userId = req.user.id;

        if (forEveryone) {
            // Delete the chat entirely (Cascading delete will remove participants and messages if configured, 
            // but Prisma might need manual cleanup if relations aren't cascade-delete in DB. 
            // Assuming schema handles relations or we should delete manually to be safe. 
            // Let's rely on Prisma `cancel/delete` or manual cleanup if needed. 
            // For safety, let's delete messages first then chat.)

            await prisma.message.deleteMany({ where: { chatId } });
            await prisma.chatParticipant.deleteMany({ where: { chatId } });
            await prisma.chat.delete({ where: { id: chatId } });

            // Emit socket event
            const io = req.app.get('io');
            io.to(chatId).emit('chat_deleted', { chatId });

            res.json({ message: 'Chat deleted for everyone' });
        } else {
            // Delete for me
            await prisma.chatParticipant.update({
                where: {
                    chatId_userId: { chatId, userId }
                },
                data: {
                    isDeleted: true
                }
            });
            res.json({ message: 'Chat deleted for you' });
        }
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await prisma.chat.findMany({
            where: {
                participants: {
                    some: {
                        userId,
                        isDeleted: false
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, fullName: true, role: true, profilePicture: true, lastSeen: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(chats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Edit a message
exports.editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this message' });
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { content, updatedAt: new Date() },
            include: {
                sender: { select: { id: true, fullName: true } },
            },
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(message.chatId).emit('message_edited', updatedMessage);

        res.json(updatedMessage);
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a message (for everyone)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (message.senderId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this message' });
        }

        // Soft delete: Keep record but clear content and mark as deleted
        await prisma.message.update({
            where: { id: messageId },
            data: {
                deletedAt: new Date(),
                content: 'This message was deleted',
                attachments: null
            }
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(message.chatId).emit('message_deleted', { messageId, chatId: message.chatId });

        res.json({ message: 'Message deleted for everyone' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
