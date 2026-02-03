const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.update({
        where: { email: 'admin@pms.com' },
        data: { passwordHash }
    });
    console.log('Admin password updated successfully for:', user.email);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
