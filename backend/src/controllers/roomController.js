const prisma = require('../utils/prisma');

/**
 * @desc    Get all meeting rooms
 * @route   GET /api/v1/rooms
 * @access  Private
 */
const getRooms = async (req, res) => {
    console.log(`[API] GET /rooms - User: ${req.user.email} (${req.user.role})`); // Added this line
    const { startTime, endTime } = req.query;
    console.log(`[API] GET /rooms - User: ${req.user.email} - Time: ${startTime} to ${endTime}`);

    try {
        let where = { isActive: true };

        const rooms = await prisma.meetingRoom.findMany({
            where,
            include: {
                availability: true,
                blockedSlots: true,
                meetings: {
                    where: {
                        status: 'SCHEDULED'
                    }
                }
            }
        });
        console.log(`[API] Found ${rooms.length} rooms in DB`);

        // If time is provided, filter available rooms
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);

            const availableRooms = rooms.filter(room => {
                // 1. Check if room is blocked
                const isBlocked = room.blockedSlots.some(slot =>
                    new Date(slot.startTime) < end && new Date(slot.endTime) > start
                );
                if (isBlocked) return false;

                // 2. Check if room is already booked
                const isBooked = room.meetings.some(meeting =>
                    new Date(meeting.startTime) < end && new Date(meeting.endTime) > start
                );
                if (isBooked) return false;

                return true;
            });

            return res.status(200).json(availableRooms);
        }

        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
};

/**
 * @desc    Create a meeting room
 * @route   POST /api/v1/rooms
 * @access  Private/Admin
 */
const createRoom = async (req, res) => {
    const { name, capacity, location } = req.body;
    try {
        const room = await prisma.meetingRoom.create({
            data: { name, capacity: parseInt(capacity), location }
        });
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
};

/**
 * @desc    Update a meeting room
 * @route   PUT /api/v1/rooms/:id
 * @access  Private/Admin
 */
const updateRoom = async (req, res) => {
    const { id } = req.params;
    const { name, capacity, location, isActive } = req.body;
    try {
        const room = await prisma.meetingRoom.update({
            where: { id },
            data: {
                name,
                capacity: capacity ? parseInt(capacity) : undefined,
                location,
                isActive
            }
        });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
};

/**
 * @desc    Add availability slot to room
 * @route   POST /api/v1/rooms/:id/availability
 * @access  Private/Admin
 */
const addAvailability = async (req, res) => {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;
    try {
        const slot = await prisma.roomAvailabilitySlot.create({
            data: {
                roomId: id,
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime
            }
        });
        res.status(201).json(slot);
    } catch (error) {
        res.status(500).json({ message: 'Error adding availability', error: error.message });
    }
};

/**
 * @desc    Block room for maintenance or event
 * @route   POST /api/v1/rooms/:id/block
 * @access  Private/Admin
 */
const blockRoom = async (req, res) => {
    const { id } = req.params;
    const { startTime, endTime, reason } = req.body;
    try {
        const slot = await prisma.roomBlockedSlot.create({
            data: {
                roomId: id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                reason
            }
        });
        res.status(201).json(slot);
    } catch (error) {
        res.status(500).json({ message: 'Error blocking room', error: error.message });
    }
};

module.exports = {
    getRooms,
    createRoom,
    updateRoom,
    addAvailability,
    blockRoom
};
