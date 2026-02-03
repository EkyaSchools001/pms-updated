const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRooms() {
    try {
        const rooms = await prisma.meetingRoom.findMany();
        console.log('Total Rooms:', rooms.length);
        console.log(JSON.stringify(rooms, null, 2));
    } catch (error) {
        console.error('Error checking rooms:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRooms();
