# 🌐 Google OAuth Setup Guide

To enable Google Login for your Project Management System, follow these steps to create your OAuth Client ID.

## Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top and select **"New Project"**.
3. Name your project (e.g., `Ekya-PMS`) and click **Create**.

## Step 2: Configure OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you are part of an organization/workspace) and click **Create**.
3. Fill in the required fields:
   - **App name**: `Ekya PMS`
   - **User support email**: Your email address.
   - **Developer contact information**: Your email address.
4. Click **Save and Continue** through the Scopes and Test Users screens (you don't need special scopes for basic login).

## Step 3: Create OAuth Client ID
1. Navigate to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. Select **Web application** as the application type.
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local development)
5. Add **Authorized redirect URIs**:
   - `http://localhost:5173`
6. Click **Create**. A modal will appear with your **Client ID** and **Client Secret**.

## Step 4: Update Your Environment Variables
Now you need to put these values into your `.env` files.

### 1. Frontend Setup
Open `frontend/.env` and replace the placeholder:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_PASTED_CLIENT_ID_HERE
```

### 2. Backend Setup
Open `backend/.env` and add both the ID and Secret:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_PASTED_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_PASTED_CLIENT_SECRET_HERE
```

## Step 5: Test the Login
1. Restart your frontend and backend servers.
2. Go to the Login page.
3. The **"Sign in with Google"** button should now be visible and functional!

---
*Note: If you deploy this to a live website later, you must add the live URL (e.g., `https://pms.ekya.edu.in`) to the "Authorized JavaScript origins" in the Google Cloud Console.*
