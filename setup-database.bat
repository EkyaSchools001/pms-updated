@echo off
echo ========================================
echo PostgreSQL Database Setup Helper
echo ========================================
echo.

set PATH=%PATH%;C:\Program Files\nodejs

echo Step 1: Testing current database connection...
echo.
cd backend
node test-db-connection.js

echo.
echo ========================================
echo.
echo If the connection failed, please:
echo 1. Update the password in backend\.env file
echo 2. Make sure PostgreSQL is running
echo 3. Run this script again
echo.
echo If connection succeeded but database is empty:
echo Run: node scripts/seed.js
echo.
pause
