const prisma = require('../utils/prisma');
const { ROLES } = require('../utils/policies');
const { createNotification } = require('./notificationController');


// Create a new project
const createProject = async (req, res) => {
    try {
        const { name, description, startDate, endDate, budget, customerId, managerId: selectedManagerId, memberIds = [] } = req.body;
        const creatorId = req.user.id;
        const managerId = selectedManagerId || creatorId;

        // Combine all unique participants (manager, members, creator)
        const allMemberIds = Array.from(new Set([managerId, creatorId, ...memberIds]));

        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? parseFloat(budget) : 0,
                managerId,
                customerId,
                members: {
                    connect: allMemberIds.map(id => ({ id }))
                }
            },
        });

        // Create Project Group Chat
        const chatParticipants = allMemberIds.map(id => ({ userId: id }));
        if (customerId && !allMemberIds.includes(customerId)) {
            chatParticipants.push({ userId: customerId });
        }


        await prisma.chat.create({
            data: {
                type: 'PROJECT_GROUP',
                name: `${name} Group`,
                projectId: project.id,
                participants: {
                    create: chatParticipants
                }
            }
        });

        // Trigger notifications for participants
        allMemberIds.forEach(userId => {
            if (userId !== creatorId) {
                createNotification(
                    userId,
                    'PROJECT_INVITE',
                    'Added to New Project',
                    `You have been added to the project: "${name}"`,
                    `/projects/${project.id}`
                );
            }
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};


// Get all projects (Admin sees all, Manager sees theirs, Employee sees assigned)
const getProjects = async (req, res) => {
    try {
        const { role, id } = req.user;
        let where = {};

        if (role === ROLES.MANAGER) {
            where = { managerId: id };
        } else if (role === ROLES.EMPLOYEE) {
            // Employees see projects they are members of
            where = {
                members: {
                    some: {
                        id: id,
                    },
                },
            };
        } else if (role === ROLES.CUSTOMER) {
            where = { customerId: id };
        }
        // Admin sees all (empty where)

        const projects = await prisma.project.findMany({
            where,
            include: {
                manager: { select: { fullName: true, email: true } },
                customer: { select: { fullName: true, email: true } },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        startDate: true,
                        dueDate: true,
                        priority: true
                    }
                },
                _count: { select: { tasks: true } },
            },
        });


        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

// Get single project details
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                tasks: {
                    include: {
                        assignees: { select: { id: true, fullName: true } }
                    }
                },
                tickets: {
                    include: {
                        assignee: { select: { fullName: true } },
                        reporter: { select: { fullName: true } }
                    }
                },
                manager: { select: { fullName: true } },
                members: { select: { id: true, fullName: true, email: true, role: true } },
                chat: { select: { id: true } }
            },
        });


        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error: error.message });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Convert dates if present
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.budget) data.budget = parseFloat(data.budget);

        const project = await prisma.project.update({
            where: { id },
            data,
            include: { chat: true }
        });

        // If customer was updated, add them to the chat if it exists
        if (data.customerId && project.chat) {
            await prisma.chatParticipant.create({
                data: {
                    chatId: project.chat.id,
                    userId: data.customerId
                }
            }).catch(() => { }); // Ignore if already in chat
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.project.delete({ where: { id } });
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};

// Add member to project
const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const project = await prisma.project.update({
            where: { id },
            data: {
                members: {
                    connect: { id: userId }
                }
            },
            include: { chat: true }
        });

        // Add to project chat if exists
        if (project.chat) {
            await prisma.chatParticipant.create({
                data: {
                    chatId: project.chat.id,
                    userId
                }
            }).catch(() => { }); // Ignore if already in chat
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error adding member', error: error.message });
    }
};

// Remove member from project
const removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const project = await prisma.project.update({
            where: { id },
            data: {
                members: {
                    disconnect: { id: userId }
                }
            },
            include: { chat: true }
        });

        // Remove from project chat
        if (project.chat) {
            await prisma.chatParticipant.deleteMany({
                where: {
                    chatId: project.chat.id,
                    userId
                }
            });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error removing member', error: error.message });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember
};
