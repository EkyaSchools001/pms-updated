# Phase 1: Calendar & Meeting Module Architecture & Database Design

## 1. Module Overview
The Calendar & Meeting module is a mission-critical extension for the PMS, enabling high-level planning, resource management, and collaboration.

## 2. Technical Stack
- **Visualization**: [FullCalendar.js](https://fullcalendar.io/) (React Wrapper)
- **Data Orchestration**: REST API via Express.js
- **Persistence**: PostgreSQL via Prisma ORM
- **Real-time**: WebSockets (Socket.io) for live updates
- **Notifications**: SMTP via Nodemailer

## 3. Database Schema (Prisma)

### Updated & New Entities
The following models will be added or modified in `schema.prisma`.

#### Enums
- `MeetingStatus`: `SCHEDULED`, `CANCELLED`, `COMPLETED`
- `ParticipantStatus`: `PENDING`, `ACCEPTED`, `DECLINED`, `TENTATIVE`
- `ParticipantRole`: `ORGANIZER`, `ATTENDEE`
- `CalendarType`: `PERSONAL`, `TEAM`, `PROJECT`
- `SharePermission`: `READ`, `EDIT`

#### New Models
1. **Meeting**: Central entity for scheduling. Linked to `User` (organizer), `Project`, and `MeetingRoom`.
2. **MeetingParticipant**: Join table for `Meeting` and `User` with invitation status.
3. **MeetingRoom**: Admin-managed resources.
4. **RoomAvailabilitySlot**: Recurring availability (e.g., Mon-Fri 9-5).
5. **RoomBlockedSlot**: One-off blocks (maintenance, holidays).
6. **CalendarView**: Stores user user preferences for filters, layers, and scope.
7. **CalendarShare**: Managing permissions for shared views.
8. **AuditLog**: Tracking critical changes for compliance.

---

## 4. API Specification (Draft)

### Meetings
- `GET /api/v1/meetings`: List meetings based on user context.
- `POST /api/v1/meetings`: Schedule a new meeting (with room/conflict validation).
- `PATCH /api/v1/meetings/:id`: Update meeting details.
- `POST /api/v1/meetings/:id/rsvp`: Accept/Decline invite.

### Rooms (Admin)
- `GET /api/v1/rooms`: List all rooms with current availability.
- `POST /api/v1/rooms`: Create new meeting room.
- `POST /api/v1/rooms/:id/block`: Block room for specific time.

### Calendar
- `GET /api/v1/calendar/tasks`: Fetch tasks with date ranges for visualization.
- `GET /api/v1/calendar/views`: Fetch saved views.
- `POST /api/v1/calendar/views`: Save current filters as a view.

---

## 5. Security & RBAC Enforcement
- **Admin**: Full access to all rooms and schedules.
- **Manager**: Can manage project-level meetings and book rooms.
- **Employee**: Can schedule internal meetings and view shared calendars.
- **Customer**: Read-only access to invited meetings.

---

## 6. Real-time & Conflict Logic
- **Overlap Check**: `(StartA < EndB) AND (EndA > StartB)` for room bookings.
- **WebSocket Emitters**: `meeting:created`, `room:blocked`, `task:rescheduled`.
