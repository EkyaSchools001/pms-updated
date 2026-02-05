const prisma = require('../utils/prisma');
const { sendMeetingEmail } = require('../services/emailService');
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require('../services/googleCalendarService');

/**
 * @desc    Get meetings for current user
 * @route   GET /api/v1/meetings
 * @access  Private
 */
const getMeetings = async (req, res) => {
    try {
        let whereClause = {
            OR: [
                { organizerId: req.user.id },
                { participants: { some: { userId: req.user.id } } }
            ]
        };

        // Role-based visibility: Customers only see meetings for their projects where they are participants
        if (req.user.role === 'CUSTOMER') {
            whereClause = {
                AND: [
                    { participants: { some: { userId: req.user.id } } },
                    { project: { customerId: req.user.id } }
                ]
            };
        }

        const meetings = await prisma.meeting.findMany({
            where: whereClause,
            include: {
                organizer: { select: { id: true, fullName: true, email: true } },
                participants: {
                    include: {
                        user: { select: { id: true, fullName: true, email: true } }
                    }
                },
                room: true,
                project: { select: { id: true, name: true } }
            },
            orderBy: { startTime: 'asc' }
        });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meetings', error: error.message });
    }
};

/**
 * @desc    Schedule a meeting
 * @route   POST /api/v1/meetings
 * @access  Private
 */
const scheduleMeeting = async (req, res) => {
    const { title, description, startTime, endTime, isOnline, meetingLink, roomId, projectId, participantIds } = req.body;

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        // 1. Validate Room Availability (if roomId provided)
        if (roomId) {
            const overlap = await prisma.meeting.findFirst({
                where: {
                    roomId,
                    status: 'SCHEDULED',
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (overlap && req.user.role !== 'ADMIN') {
                return res.status(400).json({ message: 'Room is already booked for this time slot.' });
            }

            // Check if room is blocked
            const blocked = await prisma.roomBlockedSlot.findFirst({
                where: {
                    roomId,
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (blocked && req.user.role !== 'ADMIN') {
                return res.status(400).json({ message: 'Room is blocked for maintenance or another event.' });
            }
        }

        // 2. Create Meeting
        const meeting = await prisma.meeting.create({
            data: {
                title,
                description,
                startTime: start,
                endTime: end,
                isOnline,
                meetingLink,
                roomId: roomId || null,
                projectId: projectId || null,
                organizerId: req.user.id,
                participants: {
                    create: [
                        { userId: req.user.id, role: 'ORGANIZER', status: 'ACCEPTED' },
                        ...(participantIds || [])
                            .filter(id => id !== req.user.id)
                            .map(id => ({ userId: id, role: 'ATTENDEE', status: 'PENDING' }))
                    ]
                }
            },
            include: {
                participants: true
            }
        });

        // 3. Log Activity
        await prisma.auditLog.create({
            data: {
                action: 'MEETING_CREATED',
                entityType: 'MEETING',
                entityId: meeting.id,
                userId: req.user.id,
                details: `Scheduled meeting: ${title}`
            }
        });

        // 4. Send Email Notifications (Async)
        const participants = await prisma.user.findMany({
            where: { id: { in: participantIds || [] } },
            select: { email: true }
        });

        const room = roomId ? await prisma.meetingRoom.findUnique({ where: { id: roomId } }) : null;

        participants.forEach(p => {
            sendMeetingEmail(p.email, 'New Meeting Invitation', {
                title,
                startTime: start,
                endTime: end,
                isOnline,
                meetingLink,
                roomName: room?.name,
                organizerName: req.user.fullName
            });
        });

        // 5. Sync with Google Calendar (if connected)
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            if (user.googleAccessToken && user.googleRefreshToken) {
                // Fetch room details if any
                const roomInfo = roomId ? await prisma.meetingRoom.findUnique({ where: { id: roomId } }) : null;
                const googleEvent = await createCalendarEvent(user, {
                    ...meeting,
                    room: roomInfo
                });

                if (googleEvent && googleEvent.id) {
                    await prisma.meeting.update({
                        where: { id: meeting.id },
                        data: { googleEventId: googleEvent.id }
                    });
                }
            }
        } catch (syncError) {
            console.error('Failed to sync with Google Calendar:', syncError);
            // We don't fail the request if sync fails
        }

        res.status(201).json(meeting);
    } catch (error) {
        res.status(500).json({ message: 'Error scheduling meeting', error: error.message });
    }
};

/**
 * @desc    RSVP to a meeting
 * @route   POST /api/v1/meetings/:id/rsvp
 * @access  Private
 */
const rsvpMeeting = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED, DECLINED, TENTATIVE

    try {
        const participant = await prisma.meetingParticipant.update({
            where: {
                meetingId_userId: {
                    meetingId: id,
                    userId: req.user.id
                }
            },
            data: { status }
        });

        res.status(200).json(participant);
    } catch (error) {
        res.status(500).json({ message: 'Error responding to invite', error: error.message });
    }
};

/**
 * @desc    Cancel a meeting
 * @route   DELETE /api/v1/meetings/:id
 * @access  Private
 */
const cancelMeeting = async (req, res) => {
    const { id } = req.params;

    try {
        const meeting = await prisma.meeting.findUnique({ where: { id } });

        if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

        // Check if user is organizer or Admin
        if (meeting.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only the organizer can cancel this meeting.' });
        }

        await prisma.meeting.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        // Sync with Google Calendar (if connected)
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            if (user.googleAccessToken && user.googleRefreshToken && meeting.googleEventId) {
                await deleteCalendarEvent(user, meeting.googleEventId);
            }
        } catch (syncError) {
            console.error('Failed to delete Google Calendar event:', syncError);
        }

        res.status(200).json({ message: 'Meeting cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling meeting', error: error.message });
    }
};

/**
 * @desc    Update a meeting
 * @route   PUT /api/v1/meetings/:id
 * @access  Private
 */
const updateMeeting = async (req, res) => {
    const { id } = req.params;
    const { title, description, startTime, endTime, isOnline, meetingLink, roomId, projectId, participantIds } = req.body;

    try {
        const existingMeeting = await prisma.meeting.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (!existingMeeting) return res.status(404).json({ message: 'Meeting not found' });

        // Check if user is organizer or Admin
        if (existingMeeting.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only the organizer can update this meeting.' });
        }

        const start = startTime ? new Date(startTime) : existingMeeting.startTime;
        const end = endTime ? new Date(endTime) : existingMeeting.endTime;

        // Validate Room Availability if roomId changed or time changed
        const effectiveRoomId = roomId !== undefined ? roomId : existingMeeting.roomId;
        if (effectiveRoomId) {
            const overlap = await prisma.meeting.findFirst({
                where: {
                    id: { not: id },
                    roomId: effectiveRoomId,
                    status: 'SCHEDULED',
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });

            if (overlap && req.user.role !== 'ADMIN') {
                return res.status(400).json({ message: 'Room is already booked for this time slot.' });
            }
        }

        // Update Meeting
        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existingMeeting.title,
                description: description !== undefined ? description : existingMeeting.description,
                startTime: start,
                endTime: end,
                isOnline: isOnline !== undefined ? isOnline : existingMeeting.isOnline,
                meetingLink: meetingLink !== undefined ? meetingLink : existingMeeting.meetingLink,
                roomId: roomId !== undefined ? (roomId || null) : existingMeeting.roomId,
                projectId: projectId !== undefined ? (projectId || null) : existingMeeting.projectId,
            },
            include: {
                participants: true
            }
        });

        // Handle Participants update if participantIds provided
        if (participantIds) {
            // This is a simple implementation: remove non-organizer and re-add
            // In a real app, you'd find diffs to send emails only to new ones
            await prisma.meetingParticipant.deleteMany({
                where: {
                    meetingId: id,
                    role: 'ATTENDEE'
                }
            });

            await prisma.meetingParticipant.createMany({
                data: participantIds
                    .filter(uid => uid !== existingMeeting.organizerId)
                    .map(uid => ({
                        meetingId: id,
                        userId: uid,
                        role: 'ATTENDEE',
                        status: 'PENDING'
                    }))
            });
        }

        // Sync with Google Calendar (if connected)
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            if (user.googleAccessToken && user.googleRefreshToken) {
                const roomInfo = meeting.roomId ? await prisma.meetingRoom.findUnique({ where: { id: meeting.roomId } }) : null;
                const meetingData = { ...meeting, room: roomInfo };

                if (meeting.googleEventId) {
                    await updateCalendarEvent(user, meeting.googleEventId, meetingData);
                } else {
                    const googleEvent = await createCalendarEvent(user, meetingData);
                    if (googleEvent && googleEvent.id) {
                        await prisma.meeting.update({
                            where: { id: meeting.id },
                            data: { googleEventId: googleEvent.id }
                        });
                    }
                }
            }
        } catch (syncError) {
            console.error('Failed to sync update with Google Calendar:', syncError);
        }

        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ message: 'Error updating meeting', error: error.message });
    }
};

module.exports = {
    getMeetings,
    scheduleMeeting,
    rsvpMeeting,
    cancelMeeting,
    updateMeeting
};
