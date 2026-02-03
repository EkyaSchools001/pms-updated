const prisma = require('./prisma');
const { sendTicketEmail } = require('../services/emailService');

const checkTicketReminders = async () => {
    try {
        const openTickets = await prisma.ticket.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                assigneeId: { not: null }
            },
            include: { assignee: true, reporter: true, project: true }
        });

        const now = new Date();

        for (const ticket of openTickets) {
            let gapHours = 24; // Default for LOW or others
            if (ticket.priority === 'CRITICAL') gapHours = 1;
            else if (ticket.priority === 'HIGH') gapHours = 4;
            else if (ticket.priority === 'MEDIUM') gapHours = 12;

            const lastReminder = ticket.lastReminderSentAt || ticket.createdAt;
            const hoursSinceLastReminder = (now - new Date(lastReminder)) / (1000 * 60 * 60);

            if (hoursSinceLastReminder >= gapHours) {
                console.log(`Sending reminder for ticket: ${ticket.title} (Priority: ${ticket.priority})`);

                await sendTicketEmail(ticket.assignee.email, 'Ticket Reminder', {
                    title: ticket.title,
                    priority: ticket.priority,
                    reporterName: ticket.reporter.fullName,
                    description: ticket.description,
                    projectName: ticket.project.name,
                    isReminder: true
                });

                await prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { lastReminderSentAt: now }
                });
            }
        }
    } catch (error) {
        console.error('Check Reminders Error:', error);
    }
};

module.exports = { checkTicketReminders };
