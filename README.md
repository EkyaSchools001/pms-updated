# Project Management System (PMS)

A full-stack Project Management System built with Node.js, Express, PostgreSQL, React, and Tailwind CSS.

## 🚀 Features

*   **Role-Based Access Control**: Admin, Manager, Employee, Customer roles.
*   **Project Management**: Create, view, and manage projects with budgets and timelines.
*   **Task Management**: Kanban-style board for tracking tasks.
*   **Authentication**: Secure JWT-based login and registration.
*   **Dashboard**: Overview of user-specific data.

## 🛠 Tech Stack

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Auth**: JWT & Bcrypt

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM
*   **HTTP Client**: Axios
*   **Icons**: Lucide React

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   PostgreSQL installed and running

### 1. Database Setup
Create a PostgreSQL database named `pms_db`.
```bash
# In pSQL terminal
CREATE DATABASE pms_db;
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure .env file (already created)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/pms_db?schema=public"

# Run Migrations
npx prisma migrate dev --name init

# Start Server
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Client
npm run dev
```
Client runs on `http://localhost:5173`

## 🧪 Testing the App

1.  **Register** a new user (e.g., as a Manager).
2.  **Login** with credentials.
3.  **Create a Project** from the Projects page.
4.  **Add Tasks** to the project.
5.  **Manage Status** of tasks on the Kanban board.

## 🔮 Future Enhancements
*   Time Tracking & Timesheets
*   Invoice Generation
*   Email Notifications
*   File Attachments for Tasks
