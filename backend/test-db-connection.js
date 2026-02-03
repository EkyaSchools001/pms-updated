const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
    console.log('🔍 Testing database connection...\n');
    console.log('Database URL from .env:');
    console.log(process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
    console.log('');

    try {
        await prisma.$connect();
        console.log('✅ Database connection successful!\n');

        // Test if we can query
        const userCount = await prisma.user.count();
        console.log(`📊 Found ${userCount} users in database`);

        if (userCount === 0) {
            console.log('\n⚠️  Database is empty. You should run the seed script:');
            console.log('   node scripts/seed.js');
        } else {
            console.log('\n✅ Database has data. You should be able to log in!');
        }

    } catch (error) {
        console.error('❌ Database connection failed!\n');
        console.error('Error details:', error.message);
        console.error('\n📝 Common solutions:');
        console.error('1. Check if PostgreSQL is running');
        console.error('2. Verify the password in backend/.env file');
        console.error('3. Make sure database "pms_db" exists');
        console.error('4. Check if the port 5432 is correct');
        console.error('\n💡 To create the database, run in PostgreSQL:');
        console.error('   CREATE DATABASE pms_db;');
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
