const prisma = require('../utils/prisma');

/**
 * @desc    Get all calendar events (meetings + tasks)
 * @route   GET /api/v1/calendar/events
 * @access  Private
 */
const getCalendarEvents = async (req, res) => {
    try {
        const { start, end, projects, users } = req.query;

        const dateFilter = {};
        if (start && end) {
            dateFilter.OR = [
                { startTime: { gte: new Date(start), lte: new Date(end) } },
                { endTime: { gte: new Date(start), lte: new Date(end) } }
            ];
        }

        // 1. Fetch Meetings
        let meetingWhere = {
            status: 'SCHEDULED',
            OR: [
                { organizerId: req.user.id },
                { participants: { some: { userId: req.user.id } } }
            ],
            ...dateFilter
        };

        // Role-based visibility for Customers
        if (req.user.role === 'CUSTOMER') {
            meetingWhere = {
                status: 'SCHEDULED',
                AND: [
                    { participants: { some: { userId: req.user.id } } },
                    { project: { customerId: req.user.id } }
                ],
                ...dateFilter
            };
        }

        const meetings = await prisma.meeting.findMany({
            where: meetingWhere,
            include: {
                organizer: { select: { fullName: true } },
                room: { select: { name: true } },
                participants: {
                    include: {
                        user: { select: { id: true, fullName: true } }
                    }
                }
            }
        });

        // 2. Fetch Tasks with dueDates
        const taskDateFilter = {};
        if (start && end) {
            taskDateFilter.OR = [
                { dueDate: { gte: new Date(start), lte: new Date(end) } },
                { startDate: { gte: new Date(start), lte: new Date(end) } }
            ];
        }

        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { assignees: { some: { id: req.user.id } } },
                    { project: { managerId: req.user.id } }
                ],
                ...taskDateFilter
            },
            include: {
                project: { select: { name: true } }
            }
        });

        // 3. Format into a unified Event format for FullCalendar
        const formattedMeetings = meetings.map(m => ({
            id: m.id,
            title: m.title,
            start: m.startTime,
            end: m.endTime,
            allDay: false,
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            extendedProps: {
                type: 'meeting',
                organizer: m.organizer.fullName,
                organizerId: m.organizerId,
                room: m.room?.name || 'Online',
                description: m.description,
                isOnline: m.isOnline,
                meetingLink: m.meetingLink,
                participants: m.participants.map(p => ({
                    userId: p.userId,
                    fullName: p.user.fullName,
                    status: p.status
                }))
            }
        }));

        const formattedTasks = tasks.map(t => ({
            id: t.id,
            title: `[Task] ${t.title}`,
            start: t.startDate || t.dueDate,
            end: t.dueDate,
            allDay: !t.startDate,
            backgroundColor: t.priority === 'CRITICAL' ? '#ef4444' : '#10b981',
            borderColor: t.priority === 'CRITICAL' ? '#dc2626' : '#059669',
            extendedProps: {
                type: 'task',
                project: t.project.name,
                priority: t.priority,
                status: t.status,
                description: t.description
            }
        }));

        res.status(200).json([...formattedMeetings, ...formattedTasks]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching calendar events', error: error.message });
    }
};

/**
 * @desc    Save a calendar view (filters/layers)
 * @route   POST /api/v1/calendar/views
 * @access  Private
 */
const saveCalendarView = async (req, res) => {
    const { name, type, filters, layers, isPublic } = req.body;
    try {
        const view = await prisma.calendarView.create({
            data: {
                name,
                type,
                filters: JSON.stringify(filters),
                layers: JSON.stringify(layers),
                isPublic,
                userId: req.user.id
            }
        });
        res.status(201).json(view);
    } catch (error) {
        res.status(500).json({ message: 'Error saving calendar view', error: error.message });
    }
};

module.exports = {
    getCalendarEvents,
    saveCalendarView
};
