# Google OAuth Authentication Setup Guide

## Overview
This guide will help you set up Google OAuth authentication for your Project Management System.

## Prerequisites
- Google Cloud Console account
- Project running on `http://localhost:5173` (frontend) and `http://localhost:5000` (backend)

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **Internal** (for organization) or **External** (for public)
   - Fill in the required information:
     - App name: "Project Management System"
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - Skip scopes (or add email and profile)
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "PMS Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3000` (if using different port)
   - Authorized redirect URIs:
     - `http://localhost:5173`
   - Click **Create**

5. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Backend

### 2.1 Update `.env` file
Open `backend/.env` and replace the placeholders:

```bash
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
```

### 2.2 Update Database Schema
The schema has already been updated with the `googleId` field. You need to apply the migration:

1. **Stop the backend server** (Ctrl+C in the terminal)
2. Run the migration:
   ```bash
   cd backend
   npx prisma db push
   ```
3. Restart the backend server:
   ```bash
   npm run dev
   ```

## Step 3: Configure Frontend

### 3.1 Update `.env` file
Open `frontend/.env` and replace the placeholder:

```bash
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
VITE_API_URL=http://localhost:5000/api/v1
```

**Important:** Use the same Client ID from Step 1.3

### 3.2 Restart Frontend Server
The frontend should automatically reload, but if not:
1. Stop the frontend server (Ctrl+C)
2. Restart it:
   ```bash
   cd frontend
   npm run dev
   ```

## Step 4: Test Google Authentication

1. Open your browser and go to `http://localhost:5173`
2. You should see the login page with a **"Sign in with Google"** button
3. Click the Google button
4. Select your Google account
5. You should be automatically logged in and redirected to the dashboard

## How It Works

### Backend Flow
1. User clicks "Sign in with Google" on the frontend
2. Google OAuth popup appears and user selects account
3. Google returns a credential token to the frontend
4. Frontend sends the credential to `/api/v1/auth/google`
5. Backend verifies the token with Google's servers
6. Backend checks if user exists:
   - **If exists:** Updates Google ID and profile picture
   - **If new:** Creates new user with role "EMPLOYEE"
7. Backend generates JWT token and returns user data

### Frontend Flow
1. `GoogleOAuthProvider` wraps the entire app (in `main.jsx`)
2. `GoogleLogin` component renders the sign-in button
3. On success, calls `handleGoogleSuccess` which:
   - Sends credential to backend
   - Stores JWT token in localStorage
   - Redirects to dashboard

## Security Features

✅ **Token Verification:** Backend verifies Google tokens with Google's servers
✅ **Automatic User Creation:** New users are automatically created with default "EMPLOYEE" role
✅ **Profile Sync:** Profile pictures are automatically synced from Google
✅ **JWT Authentication:** Same JWT system used for regular login
✅ **No Password Required:** OAuth users don't need passwords

## Troubleshooting

### Issue: "Google sign-in failed"
- **Solution:** Check that your Google Client ID is correct in both `.env` files
- Ensure the authorized origins include `http://localhost:5173`

### Issue: "Invalid credentials" error
- **Solution:** Make sure the Google Client Secret is correct in `backend/.env`
- Verify that Google+ API is enabled in Google Cloud Console

### Issue: Database error
- **Solution:** Run `npx prisma db push` to update the database schema
- Make sure PostgreSQL is running

### Issue: CORS errors
- **Solution:** The backend is already configured to accept requests from the frontend
- Check that `FRONTEND_URL` in `backend/.env` matches your frontend URL

## User Roles

When a new user signs in with Google:
- **Default Role:** TEAM_MEMBER
- **Admin can change:** Admins can update user roles from the user management page

## Next Steps

To enhance Google OAuth integration:
1. **Add Google Calendar Integration:** Sync meetings with Google Calendar
2. **Google Drive Integration:** Store project files in Google Drive
3. **Google Meet Integration:** Create video meetings directly from the app
4. **Profile Picture Display:** Show Google profile pictures in the UI

## Files Modified

### Backend
- ✅ `backend/.env` - Added Google OAuth credentials
- ✅ `backend/prisma/schema.prisma` - Added `googleId` field
- ✅ `backend/src/controllers/googleAuthController.js` - New controller
- ✅ `backend/src/routes/authRoutes.js` - Added `/google` route

### Frontend
- ✅ `frontend/.env` - Added Google Client ID
- ✅ `frontend/src/main.jsx` - Wrapped app with GoogleOAuthProvider
- ✅ `frontend/src/context/AuthContext.jsx` - Added `googleLogin` function
- ✅ `frontend/src/pages/Login.jsx` - Added Google Sign-In button
- ✅ `frontend/package.json` - Added `@react-oauth/google` dependency

## Support

If you encounter any issues, check:
1. Console logs in the browser (F12)
2. Backend terminal for error messages
3. Google Cloud Console for API quotas and errors
