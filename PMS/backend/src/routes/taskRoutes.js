const express = require('express');
const {
    createTask,
    getProjectTasks,
    updateTaskStatus,
    updateTask,
    getMyTasks,
} = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRole, validateProjectAccess, validateTaskAccess } = require('../middlewares/rbacMiddleware');
const { POLICIES, ROLES } = require('../utils/policies');

const router = express.Router();

router.use(authenticate);

// Create Task: Admin, Manager (Must own project)
router.post('/', authorizeRole(POLICIES.TASKS.CREATE), validateProjectAccess, createTask);

// Update Task: Admin/Manager only
router.put('/:id', authorizeRole([ROLES.ADMIN, ROLES.MANAGER]), validateTaskAccess, updateTask);


// Get current user's tasks
router.get('/my-tasks', getMyTasks);

// Get Tasks: Project members only
router.get('/project/:projectId', validateProjectAccess, getProjectTasks);

// Update Status: Role check + Task membership check
router.patch('/:id/status', authorizeRole(POLICIES.TASKS.UPDATE), validateTaskAccess, updateTaskStatus);

module.exports = router;
