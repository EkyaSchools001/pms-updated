const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAll() {
    try {
        const result = await prisma.user.updateMany({
            data: {
                isVerified: true
            }
        });
        console.log(`Successfully verified ${result.count} existing users.`);
    } catch (error) {
        console.error('Error verifying users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAll();
