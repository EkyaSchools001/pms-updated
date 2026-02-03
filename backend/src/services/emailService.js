const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * @desc    Send meeting invitation/update email
 */
const sendMeetingEmail = async (to, subject, meetingDetails) => {
    const { title, startTime, endTime, isOnline, meetingLink, roomName, organizerName } = meetingDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">${subject}: ${title}</h2>
            <p>Hi there,</p>
            <p>You have been invited to a meeting scheduled by <strong>${organizerName}</strong>.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🕒 Time:</strong> ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleTimeString()}</p>
                <p><strong>📍 Location:</strong> ${isOnline ? `<a href="${meetingLink}">Join Online Meeting</a>` : roomName || 'To be decided'}</p>
            </div>
            
            <p>Please log in to the PMS to accept or decline the invitation.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Calendar" <calendar@pms.com>',
            to,
            subject: `${subject}: ${title}`,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

/**
 * @desc    Send ticket creation/reminder email
 */
const sendTicketEmail = async (to, subject, ticketDetails) => {
    const { title, priority, reporterName, description, projectName, isReminder } = ticketDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">${isReminder ? 'Reminder: ' : ''}${subject}</h2>
            <p>Hi there,</p>
            <p>${isReminder ? 'This is a follow-up reminder for the ticket:' : 'A new ticket has been assigned to you:'}</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🎫 Title:</strong> ${title}</p>
                <p><strong>🚨 Priority:</strong> <span style="color: ${priority === 'CRITICAL' ? '#ef4444' : priority === 'HIGH' ? '#f59e0b' : '#10b981'}; font-weight: bold;">${priority}</span></p>
                <p><strong>📁 Project:</strong> ${projectName}</p>
                <p><strong>👤 Reported By:</strong> ${reporterName}</p>
                <p><strong>📝 Description:</strong> ${description || 'No description provided'}</p>
            </div>
            
            <p>Please log in to the PMS to review and take action on this ticket.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Ticketing" <ticketing@pms.com>',
            to,
            subject: `${isReminder ? 'REMINDER: ' : ''}${title} [${priority}]`,
            html
        });
        console.log(`Ticket email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send ticket email:', error);
    }
};

/**
 * @desc    Send time log notification
 */
const sendTimeLogEmail = async (to, subject, logDetails) => {
    const { userName, projectName, taskName, hours, date, description } = logDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b;">⏱️ Hours Logged: ${hours}h</h2>
            <p><strong>${userName}</strong> has logged time for the project <strong>${projectName}</strong>.</p>
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
                <p><strong>📁 Project:</strong> ${projectName}</p>
                ${taskName ? `<p><strong>🎯 Task:</strong> ${taskName}</p>` : ''}
                <p><strong>🕒 Hours:</strong> ${hours} hours</p>
                <p><strong>📅 Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                <p><strong>📝 Note:</strong> ${description || 'No notes provided'}</p>
            </div>
            
            <p>This entry has been recorded in the system.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Time Tracker" <time@pms.com>',
            to,
            subject: `Time Logged: ${hours}h by ${userName}`,
            html
        });
        console.log(`Time log email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send time log email:', error);
    }
};

module.exports = {
    sendMeetingEmail,
    sendTicketEmail,
    sendTimeLogEmail
};


