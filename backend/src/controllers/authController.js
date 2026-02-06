const prisma = require('../utils/prisma');
const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../services/emailService');

const register = async (req, res) => {
    try {
        const { email, password, fullName, role, phoneNumber } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                phoneNumber,
                verificationToken,
                isVerified: true, // Auto-verify for now
                role: role || 'TEAM_MEMBER',
            },
        });

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            },
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const trimmedEmail = email ? email.trim().toLowerCase() : '';

        const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // if (!user.isVerified) {
        //     return res.status(403).json({ message: 'Please verify your email before logging in.' });
        // }

        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                campusAccess: user.campusAccess,
                profilePicture: user.profilePicture
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, fullName: true, department: true, phoneNumber: true, campusAccess: true, profilePicture: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send('<h1>Invalid Verification Link</h1>');
        }

        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).send('<h1>Invalid or Expired Link</h1>');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null
            }
        });

        res.send('<h1>Email Verified Successfully!</h1><p>You can now log in to the application.</p><a href="' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/login">Go to Login</a>');
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).send('<h1>Verification Failed</h1>');
    }
};

module.exports = {
    register,
    login,
    getMe,
    verifyEmail
};
