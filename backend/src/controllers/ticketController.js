const prisma = require('../utils/prisma');
const { sendTicketEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create a new ticket
 */
const createTicket = async (req, res) => {
    try {
        let { title, description, priority, projectId, assigneeId, campus, category } = req.body;
        const reporterId = req.user.id;

        // Ensure a projectId exists (for chatbot compatibility)
        if (!projectId) {
            const firstProject = await prisma.project.findFirst();
            projectId = firstProject?.id;
        }

        if (!projectId) {
            return res.status(400).json({ message: 'No project found to associate ticket with.' });
        }

        // Set SLA Deadline based on priority
        let slaDeadline = new Date();
        if (priority === 'CRITICAL') slaDeadline.setHours(slaDeadline.getHours() + 4);
        else if (priority === 'HIGH') slaDeadline.setHours(slaDeadline.getHours() + 12);
        else if (priority === 'MEDIUM') slaDeadline.setHours(slaDeadline.getHours() + 48);
        else slaDeadline.setHours(slaDeadline.getHours() + 120); // 5 days for LOW

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority,
                projectId,
                reporterId,
                assigneeId,
                campus,
                category,
                slaDeadline,
                lastReminderSentAt: new Date()
            },
            include: {
                assignee: true,
                reporter: true,
                project: { select: { name: true } }
            }
        });

        // Notify Managers of the campus
        const managers = await prisma.user.findMany({
            where: {
                role: 'MANAGER',
                campusAccess: { contains: campus }
            }
        });

        managers.forEach(mgr => {
            createNotification(
                mgr.id,
                'REMINDER',
                'New Ticket Raised',
                `A new ${priority} priority ticket has been raised for ${campus} campus.`,
                `/manager-dashboard`
            );
        });

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'CREATED',
                entityType: 'TICKET',
                entityId: ticket.id,
                userId: reporterId,
                details: `Ticket created with priority ${priority}`
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ message: 'Server error creating ticket' });
    }
};

/**
 * @desc    Get all tickets (filtered by user role and campus)
 */
const getTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const campusAccess = req.user.campusAccess ? req.user.campusAccess.split(',') : [];

        let where = {};

        if (userRole === 'ADMIN') {
            // See everything
        } else if (userRole === 'MANAGER') {
            // See tickets in assigned campuses
            where = {
                campus: { in: campusAccess }
            };
        } else {
            // Employee/Customer see their own
            where = {
                OR: [
                    { reporterId: userId },
                    { assigneeId: userId }
                ]
            };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                reporter: { select: { id: true, fullName: true, email: true } },
                project: { select: { id: true, name: true } },
                comments: {
                    include: { author: { select: { fullName: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tickets);
    } catch (error) {
        console.error('Get Tickets Error:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
};

/**
 * @desc    Update ticket status, priority, or assignment
 */
const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, description, assigneeId } = req.body;

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status, priority, description, assigneeId },
            include: { assignee: true, reporter: true, project: true }
        });

        if (assigneeId) {
            createNotification(
                assigneeId,
                'TICKET_ASSIGNED',
                'Ticket Assigned',
                `You have been assigned to ticket: "${ticket.title}"`,
                `/manager-dashboard`
            );
        }

        if (status && status !== ticket.status) {
            // Notify managers of the campus
            const managers = await prisma.user.findMany({
                where: {
                    role: 'MANAGER',
                    campusAccess: { contains: ticket.campus }
                }
            });

            managers.forEach(mgr => {
                createNotification(
                    mgr.id,
                    'SYSTEM',
                    'Ticket Status Updated',
                    `Ticket "${ticket.title}" status changed to ${status}`,
                    `/manager-dashboard`
                );
            });
        }

        // Create Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATED',
                entityType: 'TICKET',
                entityId: id,
                userId: req.user.id,
                details: JSON.stringify({ status, priority, assigneeId })
            }
        });

        res.json(ticket);

    } catch (error) {
        console.error('Update Ticket Error:', error);
        res.status(500).json({ message: 'Server error updating ticket' });
    }
};

const addTicketComment = async (req, res) => {
    try {
        const { id: ticketId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;

        const comment = await prisma.ticketComment.create({
            data: {
                content,
                ticketId,
                authorId
            },
            include: { author: { select: { fullName: true } } }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
};

const getTicketStatus = async (req, res) => {
    try {
        const { id: inputId } = req.params;
        const user = req.user;

        // Try direct lookup first
        let ticket = await prisma.ticket.findUnique({
            where: { id: inputId },
            include: {
                assignee: { select: { fullName: true } },
                reporter: { select: { fullName: true, id: true } }
            }
        });

        // If not found, try partial match (for truncated IDs shown in UI)
        if (!ticket) {
            ticket = await prisma.ticket.findFirst({
                where: {
                    id: { startsWith: inputId }
                },
                include: {
                    assignee: { select: { fullName: true } },
                    reporter: { select: { fullName: true, id: true } }
                }
            });
        }

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        // Access Control
        const isOwner = ticket.reporterId === user.id;
        const isAdmin = user.role === 'ADMIN';
        const campusAccessList = user.campusAccess ? user.campusAccess.split(',').map(c => c.trim()) : [];
        const isManager = user.role === 'MANAGER' && campusAccessList.includes(ticket.campus);

        if (!isOwner && !isAdmin && !isManager) {
            return res.status(403).json({ message: 'You don’t have permission to view this ticket.' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Unable to fetch ticket details.' });
    }
};

const getRecentTickets = async (req, res) => {
    try {
        const user = req.user;
        let where = { reporterId: user.id };

        if (user.role === 'ADMIN') {
            where = {};
        } else if (user.role === 'MANAGER') {
            const campusAccess = user.campusAccess ? user.campusAccess.split(',') : [];
            where = { campus: { in: campusAccess } };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: { select: { fullName: true } }
            }
        });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Unable to fetch recent tickets.' });
    }
};

const getTicketLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await prisma.auditLog.findMany({
            where: {
                entityType: 'TICKET',
                entityId: id
            },
            include: { user: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs' });
    }
};

module.exports = {
    createTicket,
    getTickets,
    updateTicket,
    addTicketComment,
    getTicketStatus,
    getRecentTickets,
    getTicketLogs,
    checkTicketReminders: require('../utils/ticketReminders')
};


