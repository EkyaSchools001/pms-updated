@echo off
set PATH=%PATH%;C:\Program Files\nodejs

echo Running Prisma migration to create tables...
echo.

cd backend
npx prisma migrate dev --name init

echo.
echo Migration complete! Now seeding database...
node scripts\seed.js

cd..
echo.
echo ✅ Database is ready!
pause
