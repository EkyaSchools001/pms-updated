const { OAuth2Client } = require('google-auth-library');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google OAuth token and authenticate/register user
 */
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by Google' });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // If user doesn't exist, create a new one
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    fullName: name || email.split('@')[0],
                    passwordHash: '', // No password for OAuth users
                    role: 'TEAM_MEMBER', // Default role for new Google sign-ups
                    googleId: googleId,
                    profilePicture: picture
                }
            });
        } else {
            // Update Google ID and profile picture if not set
            if (!user.googleId || user.profilePicture !== picture) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        googleId: googleId,
                        profilePicture: picture
                    }
                });
            }
        }

        // Generate JWT token
        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Google authentication successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({
            message: 'Google authentication failed',
            error: error.message
        });
    }
};

module.exports = {
    googleAuth
};
