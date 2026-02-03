---
description: How to Deploy PMS Pro to Render (Public Live URL)
---

# 🚀 How to Deploy PMS Pro for Public Use

This guide will help you deploy your full-stack application (Frontend + Backend + Database) to **Render.com** (a free/cheap cloud provider perfect for this stack).

---

## 🏗️ Step 1: Pre-Deployment Setup
I have already prepared your code for deployment:
1.  **Backend**: Added a `"start"` script so the cloud server knows how to run it.
2.  **Frontend**: Configured the API to look for a `VITE_API_URL` environment variable instead of always using localhost.

---

## 🗄️ Step 2: Database Setup (PostgreSQL)
You need a cloud database. Render offers this for free/cheap.
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **PostgreSQL**.
3.  Name: `pms-db`.
4.  Region: Choose one close to you (e.g., Frankfurt or Singapore).
5.  Plan: **Free** (or Starter if you expect heavy traffic).
6.  Click **Create Database**.
7.  **IMPORTANT:** Once created, copy the **Internal DB URL** (looks like `postgres://...`) and the **External DB URL**. You will need these later.

---

## 🔗 Step 3: Deploy Backend (Node.js)
1.  Push your code to **GitHub** (if you haven't already).
2.  In Render Dashboard, click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Root Directory**: `pms-fullstack/backend` (Important!).
5.  **Build Command**: `npm install`
6.  **Start Command**: `npm start`
7.  **Environment Variables** (Click "Advanced"):
    *   `DATABASE_URL`: Paste the **Internal DB URL** from Step 2.
    *   `JWT_SECRET`: Type a random long string (e.g., `supersecretkey123`).
    *   `FRONTEND_URL`: Paste your **Frontend URL** (you will get this in Step 4, you can update this variable *after* Step 4 is live).
    *   `PORT`: `10000`.
8.  Click **Create Web Service**.
9.  Wait for it to deploy. Once "Live", copy the **backend URL** (e.g., `https://pms-backend.onrender.com`).

---

## 🎨 Step 4: Deploy Frontend (React/Vite)
1.  In Render Dashboard, click **New +** -> **Static Site**.
2.  Connect the same GitHub repository.
3.  **Root Directory**: `frontend` (Note: Ensure this matches your folder name).
4.  **Build Command**: `npm run build`
5.  **Publish Directory**: `dist`
6.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your **Backend URL** from Step 3, followed by `/api/v1/`.
        *   Example: `https://pms-backend.onrender.com/api/v1/`
7.  Click **Create Static Site**.
8.  Wait for deployment.

---

## ✅ Step 5: Final Check
1.  Open your new **Frontend URL** (provided by Render).
2.  Try to **Register** a new account.
    *   If it works, your Frontend is successfully talking to your Backend, which is writing to your Database!
3.  Share the Frontend URL with anyone to let them use the app.

---

## 💡 Troubleshooting
*   **CORS Error?** If the frontend says "Network Error", you might need to update `server.js` in the backend code to allow the specific frontend domain in `cors()`.
    *   *Quick Fix for now:* In `server.js`, ensure `app.use(cors())` is present (I verified it is in your package.json).
*   **Database Error?** Ensure you pasted the `DATABASE_URL` correctly in the Backend Environment Variables.
