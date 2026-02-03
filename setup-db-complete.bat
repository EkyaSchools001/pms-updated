@echo off
set PATH=%PATH%;C:\Program Files\nodejs
set PGPASSWORD=postgres

echo ========================================
echo Step 1: Creating Database
echo ========================================
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE pms_db;" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Database 'pms_db' created
) else (
    echo ℹ️ Database might already exist
)

echo.
echo ========================================
echo Step 2: Running Prisma Migrations
echo ========================================
cd backend
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo Running migrate dev instead...
    call npx prisma migrate dev --name init
)

echo.
echo ========================================
echo Step 3: Generating Prisma Client
echo ========================================
call npx prisma generate

echo.
echo ========================================
echo Step 4: Seeding Database
echo ========================================
node scripts\seed.js

cd..
echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo The backend should automatically restart.
echo Go to http://localhost:5175 and login with:
echo   Email: admin@test.com
echo   Password: password123
echo.
pause
