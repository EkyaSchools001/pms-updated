const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const usersRoutes = require('./routes/users');
const chatRoutes = require('./routes/chatRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const calendarAuthRoutes = require('./routes/calendarAuthRoutes');






const app = express();

const path = require('path');

// Middleware
// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            // For dev/testing, you might want to log this or be permissive
            console.log('CORS blocked origin:', origin);
            // Fallback for development convenience: allow all localhost
            if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());


// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/time-logs', timeLogRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/auth', calendarAuthRoutes); // Adding under auth for convenience




// Serve static files from the React app
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// The "catch-all" handler: for any request that doesn't
// match one of the API routes above, send back React's index.html file.
app.get('*', (req, res) => {
    // If it's an API request that wasn't caught by the routes above, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    // Otherwise, serve the frontend's index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const fs = require('fs');
    const logMessage = `\n[${new Date().toISOString()}] ${err.stack}\n`;
    fs.appendFileSync('error_log.txt', logMessage);
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error', error: err.message });
});

module.exports = app;
