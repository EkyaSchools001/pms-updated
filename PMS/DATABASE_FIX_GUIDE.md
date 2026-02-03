# 🔧 Database Connection Fix Guide

## Problem
The backend cannot connect to PostgreSQL because the password in `.env` is incorrect.

## Current Configuration
**File**: `backend/.env`  
**Current DATABASE_URL**: `postgresql://postgres:password@localhost:5432/pms_db?schema=public`

The password `password` is not working for your PostgreSQL installation.

---

## Solution Steps

### Option 1: Update the Password in .env (Recommended)

1. **Find your PostgreSQL password** - This is the password you set when installing PostgreSQL

2. **Update the `.env` file**:
   - Open: `backend/.env`
   - Find the line: `DATABASE_URL="postgresql://postgres:password@localhost:5432/pms_db?schema=public"`
   - Replace `password` with your actual PostgreSQL password
   - Save the file

3. **Restart the backend server**:
   - The server should automatically restart (nodemon is watching)
   - Or manually stop and run `backend\start.bat` again

4. **Setup the database**:
   ```batch
   cd backend
   node scripts/seed.js
   ```

### Option 2: Reset PostgreSQL Password

If you don't remember your PostgreSQL password:

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Right-click on **PostgreSQL server** → Properties → Connection
3. Set a new password
4. Update the password in `backend/.env`

### Option 3: Use Common Default Passwords

Try these common defaults in your `.env` file (one at a time):
- `postgres` (most common)
- `admin`
- `root`
- Leave it empty: `postgresql://postgres:@localhost:5432/pms_db?schema=public`

---

## Testing the Connection

Run this command to test:
```batch
cd backend
node test-db-connection.js
```

---

## After Successful Connection

Once connected, run the seed script to populate test data:
```batch
cd backend
node scripts/seed.js
```

This will create all the test users with the credentials I provided earlier.

---

## Quick Fix Script

I've also created `fix-postgres-password.bat` - just run it and enter your PostgreSQL password when prompted!
