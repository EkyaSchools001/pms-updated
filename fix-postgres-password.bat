@echo off
setlocal enabledelayedexpansion
echo ========================================
echo PostgreSQL Password Fix Helper
echo ========================================
echo.

set PATH=%PATH%;C:\Program Files\nodejs

echo This script will help you fix the database connection.
echo.
echo Current DATABASE_URL in .env file:
echo postgresql://postgres:****@localhost:5432/pms_db
echo.

:input_password
set /p "pg_password=Enter your PostgreSQL password (or press Enter to try common defaults): "

if "%pg_password%"=="" (
    echo.
    echo Trying common default passwords...
    echo.
    
    REM Try postgres
    echo Trying password: postgres
    call :test_password "postgres"
    if !errorlevel! equ 0 goto success
    
    REM Try admin
    echo Trying password: admin
    call :test_password "admin"
    if !errorlevel! equ 0 goto success
    
    REM Try root
    echo Trying password: root
    call :test_password "root"
    if !errorlevel! equ 0 goto success
    
    REM Try empty password
    echo Trying empty password
    call :test_password ""
    if !errorlevel! equ 0 goto success
    
    echo.
    echo ❌ None of the common passwords worked.
    echo Please check your PostgreSQL installation password.
    goto input_password
) else (
    call :test_password "%pg_password%"
    if !errorlevel! equ 0 goto success
    echo.
    echo ❌ Password incorrect. Please try again.
    goto input_password
)

:test_password
set "test_pw=%~1"
echo DATABASE_URL="postgresql://postgres:%test_pw%@localhost:5432/pms_db?schema=public"> backend\.env.test
echo JWT_SECRET="supersecretkey_change_in_production">> backend\.env.test
echo PORT=5000>> backend\.env.test
echo FRONTEND_URL="http://localhost:5174">> backend\.env.test
echo.>> backend\.env.test
echo # Google Calendar Integration>> backend\.env.test
echo GOOGLE_CLIENT_ID="your_google_client_id">> backend\.env.test
echo GOOGLE_CLIENT_SECRET="your_google_client_secret">> backend\.env.test
echo GOOGLE_REDIRECT_URI="http://localhost:5000/api/v1/auth/google/callback">> backend\.env.test

cd backend
set "DOTENV_CONFIG_PATH=.env.test"
REM Simple test - if this doesn't fail, password is correct
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient({datasources:{db:{url:'postgresql://postgres:%test_pw%@localhost:5432/pms_db?schema=public'}}}); p.$connect().then(()=>{console.log('OK');process.exit(0);}).catch(()=>{process.exit(1);})" >nul 2>&1
cd..
del backend\.env.test >nul 2>&1
exit /b !errorlevel!

:success
echo.
echo ✅ Password is correct!
echo.
echo Updating backend\.env file...

echo DATABASE_URL="postgresql://postgres:%test_pw%@localhost:5432/pms_db?schema=public"> backend\.env
echo JWT_SECRET="supersecretkey_change_in_production">> backend\.env
echo PORT=5000>> backend\.env
echo FRONTEND_URL="http://localhost:5174">> backend\.env
echo.>> backend\.env
echo # Google Calendar Integration>> backend\.env
echo GOOGLE_CLIENT_ID="your_google_client_id">> backend\.env
echo GOOGLE_CLIENT_SECRET="your_google_client_secret">> backend\.env
echo GOOGLE_REDIRECT_URI="http://localhost:5000/api/v1/auth/google/callback">> backend\.env

echo ✅ .env file updated successfully!
echo.
echo Now seeding the database with test data...
cd backend
node scripts/seed.js
cd..
echo.
echo ========================================
echo ✅ All Done!
echo ========================================
echo.
echo Your database is now ready to use!
echo The backend server should automatically restart.
echo.
echo You can now log in with these credentials:
echo   Email: admin@test.com
echo   Password: password123
echo.
pause
exit /b 0
