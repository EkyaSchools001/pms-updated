const prisma = require('../utils/prisma');
const { ROLES } = require('../utils/policies');
const { createNotification } = require('./notificationController');


// Create Task
const createTask = async (req, res) => {
    try {
        const { title, description, priority, startDate, dueDate, projectId, assigneeIds } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                startDate: (startDate && startDate !== "") ? new Date(startDate) : null,
                dueDate: (dueDate && dueDate !== "") ? new Date(dueDate) : null,
                projectId,
                assignees: assigneeIds ? {
                    connect: assigneeIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                project: { select: { name: true } },
                assignees: { select: { id: true, fullName: true, email: true } }
            }
        });

        // Trigger notifications for each assignee
        if (assigneeIds && assigneeIds.length > 0) {
            assigneeIds.forEach(userId => {
                createNotification(
                    userId,
                    'TASK_ASSIGNED',
                    'New Task Assigned',
                    `You have been assigned to task: "${title}" in project "${task.project.name}"`,
                    `/tasks`
                );
            });
        }

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
};


// Get Tasks for a Project
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { role, id: userId } = req.user;

        let whereClause = { projectId };

        // Visibility Rules
        if (role === ROLES.TEAM_MEMBER) {
            // Employee sees only tasks assigned to them
            whereClause.assignees = {
                some: { id: userId }
            };
        } else if (role === ROLES.CUSTOMER) {
            // Customer sees NO internal tasks
            return res.json([]);
        }
        // ADMIN and MANAGER see all tasks

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                assignees: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// Update Task Title and Dates (Manager/Admin only)
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, startDate, dueDate } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                title,
                startDate: (startDate && startDate !== "") ? new Date(startDate) : undefined,
                dueDate: (dueDate && dueDate !== "") ? new Date(dueDate) : undefined,
            },

        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

// Update Task Status
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: { status },
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task status', error: error.message });
    }
};

// Get tasks assigned to the current user
const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const tasks = await prisma.task.findMany({
            where: {
                assignees: {
                    some: { id: userId }
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignees: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assigned tasks', error: error.message });
    }
};

module.exports = { createTask, getProjectTasks, updateTaskStatus, updateTask, getMyTasks };
