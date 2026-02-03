const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const getAuthUrl = () => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
};

const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

const getGoogleCalendar = (accessToken, refreshToken) => {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth });
};

const createCalendarEvent = async (user, meeting) => {
    if (!user.googleAccessToken || !user.googleRefreshToken) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    const event = {
        summary: meeting.title,
        description: meeting.description || '',
        start: {
            dateTime: new Date(meeting.startTime).toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(meeting.endTime).toISOString(),
            timeZone: 'UTC',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    if (meeting.isOnline && meeting.meetingLink) {
        event.location = meeting.meetingLink;
    } else if (meeting.room) {
        event.location = meeting.room.name || meeting.room.location;
    }

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        throw error;
    }
};

const updateCalendarEvent = async (user, googleEventId, meeting) => {
    if (!user.googleAccessToken || !user.googleRefreshToken || !googleEventId) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    const event = {
        summary: meeting.title,
        description: meeting.description || '',
        start: {
            dateTime: new Date(meeting.startTime).toISOString(),
            timeZone: 'UTC',
        },
        end: {
            dateTime: new Date(meeting.endTime).toISOString(),
            timeZone: 'UTC',
        },
    };

    try {
        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: googleEventId,
            resource: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
};

const deleteCalendarEvent = async (user, googleEventId) => {
    if (!user.googleAccessToken || !user.googleRefreshToken || !googleEventId) {
        return null;
    }

    const calendar = getGoogleCalendar(user.googleAccessToken, user.googleRefreshToken);

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        throw error;
    }
};

module.exports = {
    getAuthUrl,
    getTokens,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
};
