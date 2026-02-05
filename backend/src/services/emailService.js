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
 * @desc    Send project assignment email
 */
const sendProjectEmail = async (to, projectDetails) => {
    const { name, description, managerName, role } = projectDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">🚀 Added to Project: ${name}</h2>
            <p>Hi there,</p>
            <p>You have been added to a new project as a <strong>${role || 'Member'}</strong>.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📁 Project:</strong> ${name}</p>
                <p><strong>👤 Manager:</strong> ${managerName}</p>
                <p><strong>📝 Description:</strong> ${description || 'No description provided'}</p>
            </div>
            
            <p>Please log in to the PMS to view project details and tasks.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Projects" <projects@pms.com>',
            to,
            subject: `Project Assignment: ${name}`,
            html
        });
        console.log(`Project email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send project email:', error);
    }
};

/**
 * @desc    Send chat message notification email
 */
const sendChatMessageEmail = async (to, chatDetails) => {
    const { senderName, content, chatName, isGroup } = chatDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">💬 New Message ${isGroup ? `in ${chatName}` : ''}</h2>
            <p><strong>${senderName}</strong> sent you a message:</p>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
                <p style="font-style: italic;">"${content.length > 100 ? content.substring(0, 100) + '...' : content}"</p>
            </div>
            
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px;">Reply in Chat</a></p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Chat" <chat@pms.com>',
            to,
            subject: `New message from ${senderName}`,
            html
        });
        console.log(`Chat notification email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send chat email:', error);
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

/**
 * @desc    Send email verification link
 */
const sendVerificationEmail = async (to, token) => {
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/auth/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Verify Your Email</h2>
            <p>Welcome to PMS! Please click the button below to verify your email address and activate your account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This link will expire in 24 hours.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Auth" <auth@pms.com>',
            to,
            subject: 'Verify your email address',
            html
        });
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }
};

module.exports = {
    sendMeetingEmail,
    sendTicketEmail,
    sendProjectEmail,
    sendChatMessageEmail,
    sendTimeLogEmail,
    sendVerificationEmail
};
