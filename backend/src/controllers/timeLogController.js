const prisma = require('../utils/prisma');
const { sendTimeLogEmail } = require('../services/emailService');

// Create Time Log
const createTimeLog = async (req, res) => {
    try {
        const { date, hours, description, projectId, taskId } = req.body;
        const userId = req.user.id;

        if (!date || !hours || !projectId) {
            return res.status(400).json({ message: 'Missing required fields: date, hours, and projectId are required.' });
        }

        const numericHours = parseFloat(hours);
        if (isNaN(numericHours) || numericHours <= 0) {
            return res.status(400).json({ message: 'Hours must be a valid positive number.' });
        }

        const timeLog = await prisma.timeLog.create({
            data: {
                date: new Date(date),
                hours: numericHours,
                description,
                userId,
                projectId,
                taskId: taskId || null,
            },
            include: {
                user: { select: { fullName: true, email: true } },
                project: { select: { name: true } },
                task: { select: { title: true } }
            }
        });

        // Notify all users via email (as requested by user)
        // Warning: This could be spammy, but following user request
        const allUsers = await prisma.user.findMany({ select: { email: true } });
        const emails = allUsers.map(u => u.email).filter(e => e);

        if (emails.length > 0) {
            await sendTimeLogEmail(
                emails,
                'New Time Entry Logged',
                {
                    userName: timeLog.user.fullName,
                    projectName: timeLog.project.name,
                    taskName: timeLog.task?.title,
                    hours: timeLog.hours.toString(),
                    date: timeLog.date,
                    description: timeLog.description
                }
            );
        }

        res.status(201).json(timeLog);
    } catch (error) {
        console.error('Error creating time log:', error);
        res.status(500).json({ message: 'Error logging hours', error: error.message });
    }
};

// Get Time Logs (Visible to all users as requested)
const getTimeLogs = async (req, res) => {
    try {
        const logs = await prisma.timeLog.findMany({
            include: {
                user: { select: { fullName: true } },
                project: { select: { name: true } },
                task: { select: { title: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching time logs', error: error.message });
    }
};

// Get Dashboard Stats for Time Logs
const getTimeStats = async (req, res) => {
    try {
        const totalHours = await prisma.timeLog.aggregate({
            _sum: { hours: true }
        });
        res.json({ totalHours: totalHours._sum.hours || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching time stats', error: error.message });
    }
};

module.exports = { createTimeLog, getTimeLogs, getTimeStats };
