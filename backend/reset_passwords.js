const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const usersToFix = [
    'admin@test.com',
    'manager@test.com',
    'john@test.com',
    'emily@test.com',
    'michael@test.com',
    'customer@test.com'
];

async function main() {
    console.log('🔄 Resetting passwords for test users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    for (const email of usersToFix) {
        try {
            const user = await prisma.user.update({
                where: { email },
                data: { passwordHash }
            });
            console.log(`✅ Password reset for: ${user.email}`);
        } catch (error) {
            console.error(`❌ Could not reset password for ${email}:`, error.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
