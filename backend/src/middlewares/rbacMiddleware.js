const prisma = require('../utils/prisma');
const { ROLES } = require('../utils/policies');

/**
 * Higher-order middleware to check if user has the required role(s).
 */
const authorizeRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        console.log(`[RBAC] User: ${req.user.email}`);
        console.log(`[RBAC] Role: "${req.user.role}" (type: ${typeof req.user.role})`);
        console.log(`[RBAC] Allowed: ${JSON.stringify(roles)}`);
        console.log(`[RBAC] Match: ${roles.includes(req.user.role)}`);

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Middleware to check project ownership/access.
 * - ADMIN: Access all
 * - MANAGER: Must be project manager
 * - EMPLOYEE: Must be a member of the project
 * - CUSTOMER: Must be the client of the project
 */
const validateProjectAccess = async (req, res, next) => {
    const userId = req.user.id;
    const role = req.user.role;
    const projectId = req.params.projectId || req.params.id || req.body.projectId;

    if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
    }

    if (role === ROLES.ADMIN) return next();

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true } }
            }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isManager = project.managerId === userId;
        const isCustomer = project.customerId === userId;
        const isMember = project.members.some(m => m.id === userId);

        if (role === ROLES.MANAGER && isManager) return next();
        if (role === ROLES.EMPLOYEE && isMember) return next();
        if (role === ROLES.CUSTOMER && isCustomer) return next();

        return res.status(403).json({ message: 'Access denied: You are not assigned to this project' });
    } catch (error) {
        console.error('RBAC Error:', error);
        res.status(500).json({ message: 'Internal server error during authorization' });
    }
};

/**
 * Middleware to check task ownership/access.
 */
const validateTaskAccess = async (req, res, next) => {
    const userId = req.user.id;
    const role = req.user.role;
    const taskId = req.params.taskId || req.params.id || req.body.taskId;

    if (!taskId) return next(); // Probably a create request, handled by project access

    if (role === ROLES.ADMIN) return next();

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
                assignees: { select: { id: true } }
            }
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const isProjectManager = task.project.managerId === userId;
        const isAssignee = task.assignees.some(a => a.id === userId);

        if (role === ROLES.MANAGER && isProjectManager) return next();
        if (role === ROLES.EMPLOYEE && isAssignee) return next();

        return res.status(403).json({ message: 'Access denied: You are not assigned to this task' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error during task authorization' });
    }
};

const validateChatAccess = async (req, res, next) => {
    const userId = req.user.id;
    const chatId = req.params.chatId || req.body.chatId;

    if (!chatId) return next();

    if (req.user.role === ROLES.ADMIN) return next();

    try {
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: { chatId, userId }
            }
        });

        if (!participant) {
            return res.status(403).json({ message: 'Access denied: You are not a participant in this chat' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating chat access' });
    }
};

module.exports = {
    authorizeRole,
    validateProjectAccess,
    validateTaskAccess,
    validateChatAccess,
};
