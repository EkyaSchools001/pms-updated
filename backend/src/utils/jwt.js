const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    if (!process.env.JWT_SECRET) {
        console.error('❌ CRITICAL: JWT_SECRET is not defined!');
        throw new Error('JWT_SECRET is missing');
    }
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
