const prisma = require('../utils/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const register = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                role: role || 'EMPLOYEE',
            },
        });

        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const trimmedEmail = email ? email.trim() : '';

        const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login };
