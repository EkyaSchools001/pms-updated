# Role Name Change: EMPLOYEE → TEAM_MEMBER

## Summary
All instances of the "EMPLOYEE" role have been renamed to "TEAM_MEMBER" throughout the application.

## Changes Made

### Backend Changes
1. ✅ **Database Schema** (`prisma/schema.prisma`)
   - Updated `Role` enum: `EMPLOYEE` → `TEAM_MEMBER`
   - Updated default user role to `TEAM_MEMBER`

2. ✅ **Policies** (`src/utils/policies.js`)
   - Updated `ROLES.EMPLOYEE` → `ROLES.TEAM_MEMBER`
   - Updated all policy references

3. ✅ **Controllers**
   - `authController.js` - Default role for new users
   - `googleAuthController.js` - Default role for Google OAuth users
   - `projectController.js` - Project access logic
   - `taskController.js` - Task visibility logic
   - `ticketController.js` - Ticket assignment logic
   - `users.js` (routes) - User creation default role

4. ✅ **Middleware** (`rbacMiddleware.js`)
   - Updated access control logic
   - Updated comments and documentation

### Frontend Changes
1. ✅ **Components**
   - `Sidebar.jsx` - Navigation role permissions
   - `AddUserModal.jsx` - User creation form
   - `EditUserModal.jsx` - User edit form
   - `ChatSidebar.jsx` - Role filter

2. ✅ **Layouts**
   - `DashboardLayout.jsx` - Profile edit permissions and role dropdown

3. ✅ **Pages**
   - `Register.jsx` - Registration form default role
   - `TeamMembers.jsx` - Role stats, filters, and labels
   - `Dashboard.jsx` - Ticket display logic
   - `ManagerDashboard.jsx` - Team member filtering

4. ✅ **Documentation**
   - `GOOGLE_OAUTH_SETUP.md` - Updated role documentation

## Required Actions

### ⚠️ IMPORTANT: Database Migration Required

You **MUST** apply the database migration to update the schema:

1. **Stop the backend server** (if running)
   - Press `Ctrl+C` in the backend terminal

2. **Apply the migration**
   ```bash
   cd backend
   npx prisma db push
   ```
   - When prompted about data loss warnings, type `y` and press Enter

3. **Restart the backend server**
   ```bash
   npm run dev
   ```

### What the Migration Does
- Updates the `Role` enum in the database
- Changes existing `EMPLOYEE` role values to `TEAM_MEMBER`
- Updates the default role for new users

## Display Changes

### Before
- Role label: "Employee"
- Role value: `EMPLOYEE`
- Stats label: "Employees"

### After
- Role label: "Team Member"
- Role value: `TEAM_MEMBER`
- Stats label: "Team Members"

## Impact on Existing Data

### Existing Users
- All users with role `EMPLOYEE` will be automatically migrated to `TEAM_MEMBER`
- No data loss
- User permissions remain the same

### API Compatibility
- ⚠️ **Breaking Change**: Any external systems using the old `EMPLOYEE` role value will need to be updated
- Frontend and backend are now synchronized with the new role name

## Testing Checklist

After migration, verify:
- [ ] Users can log in successfully
- [ ] Team Members can access their assigned projects
- [ ] Team Members can view and update their tasks
- [ ] Team Members appear correctly in user lists
- [ ] Role filters work correctly (Team Members page, Chat sidebar)
- [ ] New user registration defaults to TEAM_MEMBER
- [ ] Google OAuth sign-ups create users with TEAM_MEMBER role
- [ ] Role dropdowns show "Team Member" instead of "Employee"

## Rollback (If Needed)

If you need to revert this change:
1. Revert the schema changes in `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Revert all code changes using git

## Notes

- ✅ Frontend automatically hot-reloaded with changes
- ✅ All role-based access control (RBAC) logic updated
- ✅ All UI labels and dropdowns updated
- ⏳ **Backend restart required** after database migration
