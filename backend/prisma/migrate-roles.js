// Migration script to update EMPLOYEE roles to TEAM_MEMBER before schema change
const { PrismaClient } = require('@prisma/client');

async function migrateRoles() {
    const prisma = new PrismaClient();

    try {
        console.log('Starting role migration...');

        // Use raw SQL to update EMPLOYEE to TEAM_MEMBER
        await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET role = 'TEAM_MEMBER' 
      WHERE role = 'EMPLOYEE';
    `);

        console.log('✓ Successfully migrated EMPLOYEE roles to TEAM_MEMBER');

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

migrateRoles();
