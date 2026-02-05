// Migration script to update EMPLOYEE roles to TEAM_MEMBER before schema change
const { PrismaClient } = require('@prisma/client');

async function migrateRoles() {
    const prisma = new PrismaClient();

    try {
        console.log('Starting role migration...');

        // 1. Add TEAM_MEMBER to the enum if it doesn't exist
        // This is necessary because Postgres enums are strict.
        try {
            console.log('Adding TEAM_MEMBER to Role enum...');
            // Note: ALTER TYPE cannot run inside a transaction block usually, 
            // but prisma.$executeRawUnsafe runs in an implicit transaction if not configured otherwise for some drivers.
            // However, for top-level script it should be fine.
            await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEAM_MEMBER';`);
            console.log('✓ Added TEAM_MEMBER to Role enum');
        } catch (e) {
            console.log('Note: Could not add TEAM_MEMBER to enum (might already exist):', e.message);
        }

        // 2. Update existing users
        console.log('Updating user roles...');
        // Updates records from 'EMPLOYEE' to 'TEAM_MEMBER'
        // We cast role to text in WHERE clause to find 'EMPLOYEE' even if it's not in the new enum definition (unlikely but safe)
        // AND we cast 'TEAM_MEMBER' to Role for the assignment.
        await prisma.$executeRawUnsafe(`
            UPDATE "User" 
            SET role = 'TEAM_MEMBER'::"Role" 
            WHERE role::text = 'EMPLOYEE';
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
