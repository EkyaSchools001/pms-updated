const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { hashPassword } = require('../utils/password');

router.use(authenticate);

// Create new user (Admin only)
router.post('/', authorize(['ADMIN']), async (req, res) => {
    try {
        const { fullName, email, password, role, department, managerId, dateOfBirth } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Full name, email and password are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.trim() }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: email.trim(),
                passwordHash: hashedPassword,
                role: role || 'TEAM_MEMBER',
                department: department || null,
                managerId: managerId || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                createdAt: true
            }
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Get all users (for team members page and chat)
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                dateOfBirth: true,
                profilePicture: true,

                createdAt: true,
                manager: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                managedProjects: {

                    select: {
                        id: true,
                        name: true,
                        status: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Update user profile
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, role, department, managerId, dateOfBirth } = req.body;
        const currentUser = req.user;



        // Check if user exists
        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Role-based access control
        const isAdmin = currentUser.role === 'ADMIN';
        const isManager = currentUser.role === 'MANAGER';
        const isOwnProfile = currentUser.id === id;

        // Only Admin and Manager can edit other users' profiles
        if (!isOwnProfile && !isAdmin && !isManager) {
            return res.status(403).json({
                message: 'You do not have permission to edit other users\' profiles'
            });
        }

        // Managers cannot edit Admin profiles
        if (isManager && !isAdmin && userToUpdate.role === 'ADMIN') {
            return res.status(403).json({
                message: 'Managers cannot edit administrator profiles'
            });
        }

        // Prepare update data
        const updateData = {};

        if (fullName !== undefined) {
            updateData.fullName = fullName.trim();
        }

        if (email !== undefined) {
            // Check if email is already taken by another user
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email.trim(),
                    NOT: { id }
                }
            });

            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use' });
            }

            updateData.email = email.trim();
        }

        // Only Admin can change roles
        if (role !== undefined) {
            if (!isAdmin) {
                return res.status(403).json({
                    message: 'Only Admins can change user roles'
                });
            }
            updateData.role = role;
        }

        if (req.body.profilePicture !== undefined) {
            updateData.profilePicture = req.body.profilePicture;
        }

        if (department !== undefined) {
            updateData.department = department;
        }

        if (managerId !== undefined) {
            // Only Admin can change or assign managers
            if (!isAdmin) {
                return res.status(403).json({
                    message: 'Only Admins can assign or change reporting managers'
                });
            }
            updateData.managerId = managerId || null; // Allow clearing manager
        }

        if (dateOfBirth !== undefined) {
            updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                profilePicture: true,
                createdAt: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
});

module.exports = router;
