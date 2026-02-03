const express = require('express');
const {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember
} = require('../controllers/projectController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRole, validateProjectAccess } = require('../middlewares/rbacMiddleware');
const { POLICIES } = require('../utils/policies');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create: Roles defined in policy
router.post('/', authorizeRole(POLICIES.PROJECTS.CREATE), createProject);

// Read: All authenticated users (getProjects filters list, getProjectById needs ownership check)
router.get('/', getProjects);
router.get('/:id', validateProjectAccess, getProjectById);

// Update/Delete: Role check + Ownership check
router.put('/:id', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, updateProject);
router.delete('/:id', authorizeRole(POLICIES.PROJECTS.DELETE), deleteProject); // Admin only policy usually

// Team Management: Only Admin and Manager (Manager must own project)
router.post('/:id/members', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, addMember);
router.delete('/:id/members', authorizeRole(POLICIES.PROJECTS.UPDATE), validateProjectAccess, removeMember);

module.exports = router;
