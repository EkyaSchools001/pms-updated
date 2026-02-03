# Phase 1: Product Architecture & Database Design

## 1. System Architecture Overview

We will use a **Client-Server Architecture** with a RESTful API.

*   **Frontend (Client)**: Single Page Application (SPA) built with React, Vite, and Tailwind CSS. It communicates with the backend via Axios.
*   **Backend (Server)**: Node.js/Express application acting as the centralized API. It handles business logic, authentication, and data processing.
*   **Database**: PostgreSQL managed via Prisma ORM. This ensures strict data integrity for our relational data (Projects -> Tasks -> TimeLogs).
*   **Authentication**: JWT (JSON Web Tokens) for stateless authentication.

### High-Level Data Flow
`[User Browser] <--> [React App] <--> [Express API] <--> [Prisma Client] <--> [PostgreSQL DB]`

---

## 2. Folder Structure (Clean Architecture)

We will use a monorepo-style structure for clarity, though they can be deployed separately.

```
/pms-fullstack
  /backend
    /src
      /config         # Env vars, DB connection
      /controllers    # Request handlers (logic)
      /middlewares    # Auth, Validation, Error handling
      /routes         # API route definitions
      /services       # Business logic (database calls)
      /utils          # Helper functions
      app.js          # App entry point
    prisma/           # DB Schema & Migrations
    package.json
  /frontend
    /src
      /assets
      /components     # Reusable UI components (Buttons, Cards)
      /context        # Global state (Auth, Theme)
      /hooks          # Custom React hooks
      /layouts        # Page layouts (Dashboard, Auth)
      /pages          # Main view pages
      /services       # API calls (Axios instances)
      App.jsx
    package.json
```

---

## 3. Database Schema Design (ER Model)

We will use **PostgreSQL** as the database. Below is the conceptual relationship:

*   **Users**: The central entity. Roles: `ADMIN`, `MANAGER`, `EMPLOYEE`, `CUSTOMER`.
*   **Projects**: Linked to a Manager (User) and a Customer (User).
*   **Tasks**: Linked to Projects and assigned to Employees.
*   **TimeLogs**: Linked to Tasks/Projects and Employees.
*   **Invoices**: Linked to Projects.
*   **Expenses**: Linked to Projects and Employees (who incurred them).
*   **Inventory**: Global assets.
*   **ProjectInventory**: Many-to-Many link between Projects and Inventory (tracking usage).
*   **Tickets**: Linked to Projects and Customers.

---

## 4. API Versioning & Endpoints (Preview)

We will prefix all routes with `/api/v1`.

*   **Auth**: `POST /auth/login`, `POST /auth/register`
*   **Users**: `GET /users`, `POST /users` (Admin only)
*   **Projects**: `GET /projects`, `POST /projects`, `GET /projects/:id`
*   **Tasks**: `GET /projects/:id/tasks`, `POST /tasks`
*   **TimeSheets**: `POST /timesheets`, `PATCH /timesheets/:id/approve`
*   **Invoices**: `GET /projects/:id/invoices`, `POST /invoices`

---

## 5. Security & Scalability

*   **Passwords**: Hashed using `bcrypt`.
*   **Validation**: Request bodies validated using `Zod` middleware.
*   **RBAC**: Middleware to check `req.user.role` before sensitive actions.
*   **Environment**: Strict separation of Dev/Prod keys.
