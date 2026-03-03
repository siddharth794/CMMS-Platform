# Facility Management System (Spartans FMS) PRD

## Original Problem Statement
Build a comprehensive web-based Facility Management System based on PDF specification with work order management, asset tracking, preventive maintenance scheduling, and analytics dashboard.

## User Requirements
- **Database**: MySQL (adapted to SQLite for dev environment)
- **Authentication**: JWT-based custom auth
- **Email**: Nodemailer (MOCKED for now)
- **Scope**: All 5 phases implemented
- **UI**: Dark/light theme toggle, modern enterprise dashboard, indigo-blue color scheme

## Architecture

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Recharts, React Router
- **Backend**: FastAPI, SQLAlchemy (async), SQLite
- **Auth**: JWT tokens with role-based access control

### Database Models
- Organizations (multi-tenant support)
- Users (with roles)
- Roles (with permissions)
- Assets
- Work Orders
- PM Schedules
- Audit Logs

## Core Features Implemented

### Phase 1: Authentication & Authorization ✅
- JWT-based login/logout
- Role-based access control (RBAC)
- Default roles: Super_Admin, Org_Admin, Facility_Manager, Technician, Requestor

### Phase 2: Work Order Management ✅
- Create, read, update, delete work orders
- Status workflow: New → Open → In Progress → On Hold → Completed/Cancelled
- Assignment to technicians
- Link to assets
- Priority levels (Low, Medium, High, Critical)

### Phase 3: Asset Management ✅
- Full CRUD operations
- Asset types (Movable, Immovable)
- Location tracking
- Search functionality
- Auto-generated asset tags

### Phase 4: Preventive Maintenance ✅
- PM schedule creation with frequency
- Linked to assets
- Due date tracking
- Overdue status indicators

### Phase 5: Analytics & Reporting ✅
- Dashboard with KPI cards
- Work orders by status (pie chart)
- Work orders by priority (bar chart)
- Recent work orders table
- Completion rate tracking

### Phase 6: Inventory Management ✅
- Inventory item CRUD (Name, SKU, Category, Quantity, Min Qty, Unit, Unit Cost, Location)
- Stats dashboard (Total Items, Low Stock Alerts, Total Value)
- Search by name/SKU/location
- Filter by category
- Low Stock Only toggle
- Low stock badge indicators
- Edit/Delete actions per item

### Additional Features ✅
- Dark/Light theme toggle
- Responsive sidebar navigation
- User management (admin only)
- Role management
- Audit logging

## User Personas
1. **Super Admin**: Full system access, org management
2. **Org Admin**: Organization-level administration
3. **Facility Manager**: Manages WOs, assets, PM schedules
4. **Technician**: Executes assigned work orders
5. **Requestor**: Creates and tracks work orders

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Manager | manager@demo.com | manager123 |
| Technician | tech@demo.com | tech123 |
| Requestor | requestor@demo.com | request123 |

## What's Been Implemented (March 2, 2026)

### Backend
- ✅ FastAPI with async SQLAlchemy
- ✅ JWT authentication with RBAC
- ✅ All CRUD endpoints for entities
- ✅ Status workflow engine
- ✅ Analytics aggregation
- ✅ Audit logging
- ✅ Demo data seeding
- ✅ Inventory management with stats

### Frontend
- ✅ Modern enterprise dashboard UI
- ✅ Dark/light theme toggle
- ✅ Sidebar navigation
- ✅ Dashboard with charts
- ✅ Work Orders management
- ✅ Assets management
- ✅ Inventory management (NEW)
- ✅ PM Schedules management
- ✅ Analytics page
- ✅ Settings/User management

## Prioritized Backlog

### P0 (Critical) - All Complete
- [x] Authentication
- [x] Work Order CRUD
- [x] Asset CRUD
- [x] Dashboard

### P1 (High Priority)
- [ ] Real email integration (SendGrid)
- [ ] Production MySQL database
- [ ] File attachments for work orders
- [ ] Work order comments/history

### P2 (Medium Priority)
- [ ] Bulk asset import (CSV)
- [ ] Bulk inventory import (CSV)
- [ ] Auto-generate PM work orders
- [ ] Calendar view for scheduling
- [ ] Export reports (PDF/Excel)
- [ ] Link inventory to work orders (parts usage)

### P3 (Low Priority)
- [ ] Mobile app version
- [ ] Push notifications
- [ ] Equipment QR codes
- [ ] Inventory management

## Next Tasks
1. Connect to real MySQL database when available
2. Integrate SendGrid for email notifications
3. Add file attachment support for work orders
4. Implement bulk asset import
5. Add calendar view for PM scheduling
