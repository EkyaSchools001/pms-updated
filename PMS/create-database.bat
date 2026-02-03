@echo off
echo ========================================
echo Creating PostgreSQL Database
echo ========================================
echo.

set PATH=%PATH%;C:\Program Files\nodejs

echo Creating database 'pms_db'...
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE pms_db;" 2>nul

if %errorlevel% equ 0 (
    echo ✅ Database created successfully!
) else (
    echo ℹ️ Database might already exist, continuing...
)

echo.
echo Running Prisma migrations...
cd backend
call npx prisma migrate dev --name init

echo.
echo Generating Prisma Client...
call npx prisma generate

echo.
echo Seeding database with test data...
node scripts\seed.js

echo.
echo ========================================
echo ✅ Database Setup Complete!
echo ========================================
echo.
pause
