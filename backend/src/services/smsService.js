/**
 * This is a placeholder for an SMS notification service.
 * To use this, you should sign up for a service like Twilio or Vonage.
 */

const sendSMS = async (to, message) => {
    if (!to) return;

    // TODO: Integrate with a real SMS provider like Twilio
    // Example Twilio integration:
    /*
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
    });
    */

    console.log(`[SMS Placeholder] Sent to ${to}: ${message}`);
};

/**
 * @desc    Send chat message SMS notification
 */
const sendChatMessageSMS = async (to, chatDetails) => {
    const { senderName, content } = chatDetails;
    const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
    const message = `PMS Chat: ${senderName} sent you a message: "${shortContent}"`;
    await sendSMS(to, message);
};

/**
 * @desc    Send ticket assignment SMS notification
 */
const sendTicketSMS = async (to, ticketDetails) => {
    const { title, priority } = ticketDetails;
    const message = `PMS Ticket: A ${priority} priority ticket has been assigned to you: "${title}"`;
    await sendSMS(to, message);
};

/**
 * @desc    Send project assignment SMS notification
 */
const sendProjectSMS = async (to, projectDetails) => {
    const { name, role } = projectDetails;
    const message = `PMS Project: You have been added to project "${name}" as a ${role}.`;
    await sendSMS(to, message);
};

module.exports = {
    sendChatMessageSMS,
    sendTicketSMS,
    sendProjectSMS
};
