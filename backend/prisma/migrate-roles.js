// Migration script to update EMPLOYEE roles to TEAM_MEMBER before schema change
const { PrismaClient } = require('@prisma/client');

async function migrateRoles() {
    const prisma = new PrismaClient();

    try {
        console.log('Starting role migration check...');

        // 0. Check if User table exists (to avoid errors on fresh DBs)
        const tableCheck = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'User'
            );
        `;

        const userTableExists = tableCheck[0]?.exists;

        if (!userTableExists) {
            console.log('ℹ️  User table does not exist. Skipping data migration (Fresh Database detected).');
            return;
        }

        console.log('✓ User table found. Proceeding with migration...');

        // 1. Add TEAM_MEMBER to the enum if it doesn't exist
        try {
            console.log('Adding TEAM_MEMBER to Role enum...');
            await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEAM_MEMBER';`);
            console.log('✓ Added TEAM_MEMBER to Role enum');
        } catch (e) {
            console.log('Note: Could not add TEAM_MEMBER to enum (might already exist):', e.message);
        }

        // 2. Update existing users
        console.log('Updating user roles...');
        await prisma.$executeRawUnsafe(`
            UPDATE "User" 
            SET role = 'TEAM_MEMBER'::"Role" 
            WHERE role::text = 'EMPLOYEE';
        `);

        console.log('✓ Successfully migrated EMPLOYEE roles to TEAM_MEMBER');

    } catch (error) {
        console.warn('⚠️  Migration script encountered an error, but allowing deployment to continue:', error.message);
        // We don't exit with error code 1 so deployment can try to proceed
        // If it's a critical error, prisma db push will fail anyway
    } finally {
        await prisma.$disconnect();
    }
}

migrateRoles();
