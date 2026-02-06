# Project Management System (PMS)

A comprehensive, full-stack Project Management System designed to handle projects, tasks, meetings, and team collaboration with high efficiency. Built using Node.js, Express, PostgreSQL, React, and Tailwind CSS.

---

## 🚀 Features

### Core Management
*   **Kanban Task Board**: Visual task management with Todo, In-Progress, Review, and Done status.
*   **Project Tracking**: Detailed project views with budget monitoring, timelines, and status updates.
*   **Role-Based Access Control (RBAC)**: Distinct permissions for `ADMIN`, `MANAGER`, `EMPLOYEE`, and `CUSTOMER`.
*   **Team Directory**: Manage team members, departments, and reporting hierarchies.
*   **User Deletion (Admin Only)**: Safe deletion of users with dependency checks to maintain data integrity.

### Collaboration & Communication
*   **Meeting Scheduler**: Integrated calendar for scheduling meetings with room booking and conflict detection.
*   **Real-time Chat**: In-app messaging for team and project-specific discussions using WebSockets.
*   **Meeting Room Management**: Admins can manage physical/virtual meeting rooms and availability.
*   **Calendar Module**: Visualize tasks, projects, and meetings in a unified calendar view.

### Operations & Support
*   **Ticketing System**: Raise and manage support or facility tickets with campus-specific categorization.
*   **Time Tracking**: Log hours worked on specific tasks and projects (Coming Soon).
*   **Audit Logs**: Track critical system changes for compliance and security.

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & Bcrypt
- **Real-time**: Socket.io

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Visualization**: FullCalendar.js
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 📂 Project Structure

```text
/PMSEKYA
  /backend
    /src
      /controllers    # Request handlers
      /middlewares    # Auth, Validation, RBAC
      /routes         # Express API routes
      /services       # Business logic (DB calls)
      /utils          # Helper functions
    /prisma           # Database Schema & Migrations
  /frontend
    /src
      /components     # Reusable UI components
      /context        # Global state (Auth)
      /layouts        # Page layouts (Dashboard)
      /pages          # Feature views (Projects, Tasks, etc.)
      /services       # Axios API services
    /public           # Static assets
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 1. Database Setup
1. Create a PostgreSQL database named `pms_db`.
2. Configure your connection string in `backend/.env`.

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env with your DATABASE_URL
npx prisma migrate dev --name init
npm run dev
```
*Server runs on: http://localhost:5000*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*App runs on: http://localhost:5173* (or as configured in Vite)

---

## 🛡 Security & Permissions

| Feature | Admin | Manager | Employee | Customer |
| :--- | :---: | :---: | :---: | :---: |
| Admin Panel | ✅ | ❌ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Schedule Meetings | ✅ | ✅ | ✅ | ❌ |
| Raise Tickets | ✅ | ✅ | ✅ | ✅ |
| View Financials | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 Testing Credentials
You can use the following default credentials (if seeded):
- **Email**: `admin@test.com`
- **Password**: `password123`

---

## 🔮 Future Roadmap
- [ ] Automated Invoice Generation.
- [ ] Advanced Time-Tracking Charts.
- [ ] Email Notifications via Nodemailer.
- [ ] Mobile App (React Native).
