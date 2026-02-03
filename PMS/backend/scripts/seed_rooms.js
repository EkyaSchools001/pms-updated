const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Meeting Rooms...');

    const rooms = [
        { name: 'Boardroom', capacity: 20, location: '1st Floor' },
        { name: 'Zen Room', capacity: 4, location: '4th Floor' },
        { name: 'Innovation Hub', capacity: 12, location: '2nd Floor' },
        { name: 'Mini Pod A', capacity: 2, location: '3rd Floor' }
    ];

    for (const room of rooms) {
        await prisma.meetingRoom.upsert({
            where: { id: room.name }, // This is a bit hacky for a quick seed, usually id is uuid
            update: {},
            create: {
                name: room.name,
                capacity: room.capacity,
                location: room.location
            }
        }).catch(async (e) => {
            // If upscale by name fails because of id mismatch, just create
            await prisma.meetingRoom.create({ data: room });
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
