const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMeetings() {
    try {
        const meetings = await prisma.meeting.findMany({
            where: { status: 'SCHEDULED' },
            include: { room: true }
        });
        console.log('Scheduled Meetings:', meetings.length);
        meetings.forEach(m => {
            console.log(`- ${m.title} in ${m.room?.name || 'Unknown'}: ${m.startTime} to ${m.endTime}`);
        });

        const rooms = await prisma.meetingRoom.findMany();
        console.log('\nRooms in DB:', rooms.length);
        rooms.forEach(r => {
            console.log(`- ${r.name} (${r.type || 'no type'}) - Active: ${r.isActive}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}
checkMeetings();
