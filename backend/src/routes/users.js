const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { hashPassword } = require('../utils/password');
const upload = require('../middlewares/profileUploadMiddleware');
const fs = require('fs');
const path = require('path');

router.use(authenticate);

// Create new user (Admin only)
router.post('/', authorize(['ADMIN']), async (req, res) => {
    try {
        const { fullName, email, password, role, department, managerId, dateOfBirth, campusAccess } = req.body;

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
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                campusAccess: campusAccess || null
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                campusAccess: true,
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
        const currentUserRole = req.user.role;
        let whereClause = {};

        // Role-based visibility: Customers can only see Admins and Managers
        if (currentUserRole === 'CUSTOMER') {
            whereClause = {
                role: {
                    in: ['ADMIN', 'MANAGER']
                }
            };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                dateOfBirth: true,
                profilePicture: true,
                campusAccess: true,

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
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// Update user profile
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, role, department, managerId, dateOfBirth, campusAccess } = req.body;
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

        if (campusAccess !== undefined) {
            updateData.campusAccess = campusAccess;
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
                campusAccess: true,
                createdAt: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user profile' });
    }
});

// Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;

        // Get current user to check for old profile picture
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePicture: true }
        });

        // Delete old profile picture if it exists and is not the default
        if (user && user.profilePicture) {
            try {
                // profilePicture stores something like "/uploads/profiles/filename.jpg"
                const oldPath = path.join(__dirname, '../..', user.profilePicture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log(`Deleted old profile picture: ${oldPath}`);
                }
            } catch (err) {
                console.warn('Failed to delete old profile picture:', err.message);
            }
        }

        // The URL path to store in DB
        const relativePath = `/uploads/profiles/${req.file.filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { profilePicture: relativePath },
            select: {
                id: true,
                fullName: true,
                email: true,
                profilePicture: true,
                role: true
            }
        });

        res.json({
            message: 'Profile picture updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Failed to upload profile picture', error: error.message });
    }
});

module.exports = router;
