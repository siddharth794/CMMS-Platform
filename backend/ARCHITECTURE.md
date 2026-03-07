# CMMS-Platform Backend — Architectural Workflow Documentation

> **Generated**: March 2026  
> **Application**: Computerized Maintenance Management System (CMMS)  
> **Stack**: Node.js · Express 5 · TypeScript · Sequelize · MySQL · Socket.IO  

---

## Table of Contents

1. [Codebase Understanding](#step-1--codebase-understanding)
2. [System Components](#step-2--system-components)
3. [API & Entry Points](#step-3--api--entry-points)
4. [Workflow Identification](#step-4--workflow-identification)
5. [Sequence Diagrams](#step-5--sequence-diagrams)

---

## STEP 1 — Codebase Understanding

### 1.1 Architecture Style

**Modular Monolith** — A single Express process that organizes code by feature-domain (assets, work orders, inventory, etc.) within a layered folder structure. There is no separate service layer; business logic is colocated inside Express route handlers. Real-time features are powered by Socket.IO running on the same HTTP server.

```
backend/
├── src/
│   ├── server.ts               # Application entry & Socket.IO setup
│   ├── config/
│   │   └── database.ts         # Sequelize configuration (MySQL)
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication & RBAC middleware
│   │   └── errorHandler.ts     # Centralized error handling
│   ├── models/
│   │   └── index.ts            # All 12 Sequelize models + associations
│   └── routes/
│       ├── index.ts            # Route aggregator (mounts all sub-routers)
│       ├── auth.ts             # Login / session
│       ├── users.ts            # User management (CRUD + bulk)
│       ├── organizations.ts    # Multi-tenant org management
│       ├── roles.ts            # RBAC role management
│       ├── assets.ts           # Asset registry (CRUD + bulk)
│       ├── workOrders.ts       # Work orders, comments, parts, attachments
│       ├── pmSchedules.ts      # Preventive maintenance schedules
│       ├── inventory.ts        # Spare parts / inventory (CRUD + bulk)
│       └── analytics.ts        # Dashboard & technician analytics
├── seed.ts                     # DB seeding (org, roles, demo users)
├── uploads/                    # File upload storage (work order attachments)
├── .env                        # Environment configuration
├── package.json
└── tsconfig.json
```

### 1.2 Main Layers

| Layer | Location | Description |
|---|---|---|
| **API / Controllers** | `src/routes/*.ts` | Express routers with inline request handling. Each route file acts as both controller and service. |
| **Business Logic** | Inlined in route handlers | Validation, authorization checks, stock management, notification dispatch — all within route callbacks. |
| **Data Access / ORM** | `src/models/index.ts` | 12 Sequelize model classes with associations. Direct `Model.findAll()`, `Model.create()`, etc. calls from routes. |
| **Middleware** | `src/middleware/` | Cross-cutting: JWT auth (`authenticate`), RBAC (`requireRole`), and error handling (`errorHandler`, `AppError`). |
| **Infrastructure** | `src/config/database.ts`, `src/server.ts` | Sequelize + MySQL connection, Express app bootstrap, Socket.IO server, static file serving. |
| **Real-time** | `src/server.ts` (Socket.IO) | WebSocket connections for live comments and notification delivery. |

### 1.3 Frameworks & Technologies

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | (runtime) | Server runtime |
| **Express** | 5.2.x | HTTP framework |
| **TypeScript** | 5.9.x | Static typing |
| **Sequelize** | 6.37.x | ORM (MySQL dialect) |
| **MySQL** | via `mysql2` 3.18.x | Relational database |
| **Socket.IO** | 4.8.x | Real-time WebSocket communication |
| **jsonwebtoken** | 9.0.x | JWT creation & verification |
| **bcryptjs** | 3.0.x | Password hashing |
| **multer** | 2.1.x | Multipart file upload handling |
| **dotenv** | 17.3.x | Environment variable management |
| **cors** | 2.8.x | Cross-origin resource sharing |
| **nodemon** | 3.1.x (dev) | Hot-reload during development |
| **ts-node** | 10.9.x (dev) | TypeScript execution without build |

### 1.4 Dependency Injection

**None** — There is no DI container. Dependencies (models, middleware) are imported directly via ES module `import` statements. The Socket.IO `io` instance is shared via `app.set('io', io)` and accessed in routes via `req.app.get('io')`.

### 1.5 Configuration Management

- **Environment**: Variables loaded via `dotenv` from `.env` file
- **Keys**: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
- **Fallbacks**: Hardcoded defaults for DB config and JWT secret in code

### 1.6 Logging / Monitoring

- **Console-based only**: `console.log()` / `console.error()` throughout
- Socket.IO connections/disconnections are logged
- Error stack traces are printed in the global error handler
- **No structured logging** (no Winston, Pino, etc.)
- **No APM or metrics** instrumentation

### 1.7 Error Handling

```
Route Handler → try/catch → next(err) → Global Error Handler
```

- **`AppError`** class in `errorHandler.ts`: Custom error with `statusCode`
- **Sequelize-specific**: `SequelizeValidationError` and `SequelizeUniqueConstraintError` are caught and returned as **400** responses
- **Global handler** in `server.ts`: Catches any unhandled errors and returns `{ detail: message }` with appropriate status code
- **Multer errors**: Caught inline in the attachment upload route

### 1.8 Multi-Tenancy

The application uses **single-database, shared-schema multi-tenancy**:
- Every data model includes an `org_id` field
- All queries filter by the authenticated user's `org_id` (`req.user.org_id`)
- Organization isolation is enforced at the query level, not the database level

### 1.9 Soft Delete Strategy

All major models use Sequelize's `paranoid: true` mode:
- First delete → sets `deleted_at` timestamp + `is_active = false` (soft delete)
- Second delete on already-soft-deleted record → `force: true` (hard delete / permanent)
- Listing endpoints support `record_status=inactive` query param to show soft-deleted records

---

## STEP 2 — System Components

### 2.1 Core Modules

| Module | File(s) | Responsibility |
|---|---|---|
| **Authentication** | `routes/auth.ts`, `middleware/auth.ts` | Login, JWT issuance, session validation, RBAC |
| **User Management** | `routes/users.ts` | CRUD + bulk-delete, password hashing, role assignment |
| **Organization** | `routes/organizations.ts` | Org creation with default roles, org lookup |
| **Role Management** | `routes/roles.ts` | CRUD for roles, system role protection |
| **Asset Registry** | `routes/assets.ts` | Asset CRUD + bulk operations, auto-generated asset tags |
| **Work Orders** | `routes/workOrders.ts` | Full lifecycle management, assignment, status transitions |
| **WO Comments** | `routes/workOrders.ts` (sub-routes) | Threaded comments with real-time Socket.IO broadcast |
| **WO Inventory** | `routes/workOrders.ts` (sub-routes) | Parts consumption tracking with stock deduction/restoration |
| **WO Attachments** | `routes/workOrders.ts` (sub-routes) | File upload (images) via Multer |
| **PM Schedules** | `routes/pmSchedules.ts` | Preventive maintenance scheduling tied to assets |
| **Inventory** | `routes/inventory.ts` | Spare parts management, low-stock detection, category listing |
| **Analytics** | `routes/analytics.ts` | Dashboard statistics, technician-specific views |
| **Audit Logging** | Cross-cutting (in routes) | Records create/update/delete actions to `audit_logs` table |
| **Notifications** | In `workOrders.ts` + `server.ts` | In-app notifications with real-time Socket.IO delivery |

### 2.2 Data Model (12 Sequelize Models)

```mermaid
erDiagram
    Organization ||--o{ Role : "has"
    Organization ||--o{ User : "has"
    Organization ||--o{ Asset : "has"
    Organization ||--o{ WorkOrder : "has"
    Organization ||--o{ PMSchedule : "has"
    Organization ||--o{ InventoryItem : "has"

    Role ||--o{ User : "has"

    User ||--o{ WorkOrder : "assignee"
    User ||--o{ WorkOrder : "requester"
    User ||--o{ WOComment : "writes"
    User ||--o{ Notification : "receives"

    Asset ||--o{ WorkOrder : "linked_to"
    Asset ||--o{ PMSchedule : "scheduled_for"

    WorkOrder ||--o{ WOComment : "has"
    WorkOrder ||--o{ WorkOrderInventoryItem : "uses_parts"
    WorkOrder ||--o{ WOAttachment : "has"

    InventoryItem ||--o{ WorkOrderInventoryItem : "consumed_by"

    Organization {
        UUID id PK
        string name UK
        text description
        text address
        boolean is_active
    }
    Role {
        int id PK
        UUID org_id FK
        string name
        json permissions
        boolean is_system_role
    }
    User {
        UUID id PK
        UUID org_id FK
        int role_id FK
        string email UK
        string username
        string password_hash
        boolean is_active
        datetime last_login
    }
    Asset {
        UUID id PK
        UUID org_id FK
        string name
        string asset_tag UK
        enum asset_type
        string status
    }
    WorkOrder {
        UUID id PK
        UUID org_id FK
        string wo_number UK
        string title
        UUID asset_id FK
        UUID assignee_id FK
        UUID requester_id FK
        enum status
        enum priority
        boolean is_pm_generated
    }
    PMSchedule {
        UUID id PK
        UUID org_id FK
        UUID asset_id FK
        string frequency_type
        int frequency_value
        datetime next_due
    }
    InventoryItem {
        UUID id PK
        UUID org_id FK
        string name
        string sku
        int quantity
        int min_quantity
    }
    WOComment {
        UUID id PK
        UUID work_order_id FK
        UUID user_id FK
        text message
    }
    Notification {
        UUID id PK
        UUID user_id FK
        string title
        text message
        boolean is_read
        string link
    }
    WorkOrderInventoryItem {
        UUID id PK
        UUID work_order_id FK
        UUID inventory_item_id FK
        int quantity_used
    }
    WOAttachment {
        UUID id PK
        UUID work_order_id FK
        string file_path
    }
    AuditLog {
        UUID id PK
        UUID org_id FK
        UUID user_id FK
        string entity_type
        string action
        json old_values
        json new_values
    }
```

### 2.3 System Component Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["React Frontend<br/>(SPA)"]
        WS_CLIENT["Socket.IO Client"]
    end

    subgraph "API Gateway Layer"
        EXPRESS["Express 5 Server<br/>:8000"]
        CORS["CORS Middleware"]
        SOCKET["Socket.IO Server"]
    end

    subgraph "Authentication & Authorization"
        JWT_MW["JWT Auth Middleware"]
        RBAC["Role-Based Access Control<br/>(requireRole)"]
    end

    subgraph "Route Handlers (Controllers + Business Logic)"
        AUTH["Auth Routes<br/>/api/auth"]
        USERS["User Routes<br/>/api/users"]
        ORGS["Org Routes<br/>/api/organizations"]
        ROLES["Role Routes<br/>/api/roles"]
        ASSETS["Asset Routes<br/>/api/assets"]
        WO["Work Order Routes<br/>/api/work-orders"]
        PM["PM Schedule Routes<br/>/api/pm-schedules"]
        INV["Inventory Routes<br/>/api/inventory"]
        ANALYTICS["Analytics Routes<br/>/api/analytics"]
    end

    subgraph "Data Access Layer"
        SEQ["Sequelize ORM<br/>(12 Models)"]
    end

    subgraph "Infrastructure"
        MYSQL[("MySQL Database<br/>cmms_dev")]
        UPLOADS["File System<br/>/uploads"]
        MULTER["Multer<br/>(File Upload)"]
    end

    subgraph "Cross-Cutting Concerns"
        AUDIT["Audit Logger<br/>(AuditLog Model)"]
        NOTIF["Notification System<br/>(Notification Model + Socket.IO)"]
        ERR["Error Handler<br/>(AppError + Global)"]
    end

    WEB --> EXPRESS
    WS_CLIENT --> SOCKET
    EXPRESS --> CORS --> JWT_MW
    JWT_MW --> RBAC
    RBAC --> AUTH & USERS & ORGS & ROLES & ASSETS & WO & PM & INV & ANALYTICS
    WO --> MULTER --> UPLOADS
    AUTH & USERS & ORGS & ROLES & ASSETS & WO & PM & INV & ANALYTICS --> SEQ
    SEQ --> MYSQL
    WO --> NOTIF
    NOTIF --> SOCKET
    USERS & ASSETS & WO & PM & INV --> AUDIT
    AUTH & USERS & ORGS & ROLES & ASSETS & WO & PM & INV & ANALYTICS --> ERR
```

### 2.4 External Systems & Integrations

| System | Type | Notes |
|---|---|---|
| **MySQL Database** | Persistence | Primary data store, connected via Sequelize |
| **File System** | Storage | Work order attachments stored locally in `/uploads/work-orders/` |
| **None (External APIs)** | — | No third-party API integrations exist currently |

> **Note**: There are no message queues, background job processors, cron schedulers, or external notification providers (email, SMS, push) in the current implementation.

---

## STEP 3 — API & Entry Points

### 3.1 REST API Endpoints

All routes are mounted under `/api` prefix. Authentication is required unless noted.

#### Authentication (`/api/auth` & `/api/v1/auth`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | No | Any | User login, returns JWT + user object |
| `GET` | `/auth/me` | Yes | Any | Get current user profile with role |

#### User Management (`/api/users`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/users` | Yes | Any | List org users (supports `record_status`, pagination) |
| `POST` | `/users` | Yes | Super_Admin, Org_Admin, Admin | Create new user with role assignment |
| `GET` | `/users/:user_id` | Yes | Any | Get single user by ID |
| `PUT` | `/users/:user_id` | Yes | Super_Admin, Org_Admin, Admin | Update user (profile, role, password) |
| `DELETE` | `/users/:user_id` | Yes | Super_Admin, Org_Admin, Admin | Soft/hard delete user |
| `POST` | `/users/bulk-delete` | Yes | Super_Admin, Org_Admin, Admin | Bulk deactivate/delete users |

#### Organizations (`/api/organizations`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `POST` | `/organizations` | No | Any | Create organization + default roles |
| `GET` | `/organizations` | Yes | Super_Admin | List all organizations |
| `GET` | `/organizations/:org_id` | Yes | Super_Admin or own org | Get organization details |

#### Roles (`/api/roles`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/roles` | Yes | Any | List active roles for org |
| `POST` | `/roles` | Yes | Super_Admin, Org_Admin | Create new custom role |
| `PUT` | `/roles/:role_id` | Yes | Super_Admin, Org_Admin | Update role (system roles blocked) |

#### Assets (`/api/assets`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/assets` | Yes | Any | List assets (search, filter, pagination) |
| `POST` | `/assets` | Yes | Super_Admin, Org_Admin, Facility_Manager | Create asset |
| `POST` | `/assets/bulk` | Yes | Super_Admin, Org_Admin, Facility_Manager | Bulk create assets |
| `GET` | `/assets/:asset_id` | Yes | Any | Get single asset |
| `PUT` | `/assets/:asset_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Update asset |
| `DELETE` | `/assets/:asset_id` | Yes | Any | Soft/hard delete asset |
| `POST` | `/assets/bulk-delete` | Yes | Super_Admin, Org_Admin, Facility_Manager | Bulk delete assets |

#### Work Orders (`/api/work-orders`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/work-orders` | Yes | Any (filtered by role) | List work orders with includes |
| `POST` | `/work-orders` | Yes | Most roles | Create work order |
| `GET` | `/work-orders/:wo_id` | Yes | Any | Get single work order (full load) |
| `PUT` | `/work-orders/:wo_id` | Yes | Any | Update work order |
| `PATCH` | `/work-orders/:wo_id/status` | Yes | Any | Change work order status |
| `PATCH` | `/work-orders/:wo_id/assign` | Yes | Super_Admin, Org_Admin, Facility_Manager | Assign technician |
| `DELETE` | `/work-orders/:wo_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Soft/hard delete |
| `POST` | `/work-orders/bulk-delete` | Yes | Super_Admin, Org_Admin, Facility_Manager | Bulk delete work orders |
| `GET` | `/work-orders/:wo_id/comments` | Yes | Any | List WO comments |
| `POST` | `/work-orders/:wo_id/comments` | Yes | Any | Add comment (+ real-time notification) |
| `GET` | `/work-orders/:wo_id/inventory` | Yes | Any | List parts used |
| `POST` | `/work-orders/:wo_id/inventory` | Yes | Any | Add part (deducts stock) |
| `DELETE` | `/work-orders/:wo_id/inventory/:usage_id` | Yes | Any | Remove part (restores stock) |
| `POST` | `/work-orders/:wo_id/attachments` | Yes | Any | Upload images (max 3, 1MB each) |

#### PM Schedules (`/api/pm-schedules`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/pm-schedules` | Yes | Any | List PM schedules |
| `POST` | `/pm-schedules` | Yes | Super_Admin, Org_Admin, Facility_Manager | Create PM schedule |
| `GET` | `/pm-schedules/:pm_id` | Yes | Any | Get single PM schedule |
| `PUT` | `/pm-schedules/:pm_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Update PM schedule |
| `DELETE` | `/pm-schedules/:pm_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Deactivate PM schedule |

#### Inventory (`/api/inventory`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/inventory` | Yes | Any | List inventory items (search, filter, pagination) |
| `GET` | `/inventory/stats` | Yes | Any | Inventory statistics (totals, low stock, value) |
| `GET` | `/inventory/categories` | Yes | Any | List distinct categories |
| `POST` | `/inventory` | Yes | Super_Admin, Org_Admin, Facility_Manager | Create inventory item |
| `GET` | `/inventory/:item_id` | Yes | Any | Get single item |
| `PUT` | `/inventory/:item_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Update item |
| `DELETE` | `/inventory/:item_id` | Yes | Super_Admin, Org_Admin, Facility_Manager | Soft/hard delete |
| `POST` | `/inventory/bulk-delete` | Yes | Super_Admin, Org_Admin, Facility_Manager | Bulk delete items |

#### Analytics (`/api/analytics`)

| Method | Endpoint | Auth? | Roles | Description |
|---|---|---|---|---|
| `GET` | `/analytics/dashboard` | Yes | Any | Organization-wide dashboard stats |
| `GET` | `/analytics/technician-dashboard` | Yes | Any | Technician-specific performance stats |

### 3.2 Health Check

| Method | Endpoint | Auth? | Description |
|---|---|---|---|
| `GET` | `/health` | No | Returns `{ status: "ok" }` |

### 3.3 WebSocket Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Authenticates via JWT in handshake, registers active socket |
| `join_wo_room` | Client → Server | Client joins `wo_{id}` room for real-time WO updates |
| `leave_wo_room` | Client → Server | Client leaves a WO room |
| `disconnect` | Client → Server | Cleans up active socket mapping |
| `new_comment` | Server → Room | Broadcasts new comment to all users viewing a work order |
| `new_notification` | Server → All | Broadcasts notification (client filters by `target_user_id`) |

### 3.4 CLI Tasks

| Script | Command | Description |
|---|---|---|
| **Seed** | `npm run seed` → `ts-node seed.ts` | Creates default org, 5 system roles, 5 demo users |
| **DB Sync** | `ts-node sync_db.ts` (manual) | Forces schema synchronization |

### 3.5 Static File Serving

| Path | Description |
|---|---|
| `/uploads/*` | Serves uploaded work order attachment files |

---

## STEP 4 — Workflow Identification

### 4.1 User Authentication (Login)

**Flow**: `POST /api/auth/login`

```
Client → AuthRoute.login()
  → User.findOne({ email }, include: [Role, Organization])
  → bcrypt.compareSync(password, user.password_hash)
  → Validate user.is_active
  → Update user.last_login
  → jwt.sign({ sub, org_id, role })
  → Return { access_token, user }
```

### 4.2 Organization Registration

**Flow**: `POST /api/organizations`

```
Client → OrgRoute.create()
  → Organization.findOne({ name }) — duplication check
  → Organization.create({ name, description, address })
  → Create 5 default roles (Super_Admin, Org_Admin, Facility_Manager, Technician, Requestor)
  → Return organization
```

### 4.3 User Creation

**Flow**: `POST /api/users`

```
Client → authenticate() → requireRole([Admin+])
  → UserRoute.create()
  → User.findOne({ email }) — duplication check
  → Role.findOne({ id, org_id }) — validate role exists
  → Check requestor permissions (Admins cannot assign Super_Admin/Org_Admin)
  → bcrypt.hashSync(password)
  → User.create({ org_id, role_id, email, ... })
  → User.findByPk(include: [Role]) — reload with association
  → AuditLog.create({ entity_type: 'User', action: 'create' })
  → Return 201 + created user
```

### 4.4 Work Order Lifecycle

**Flow**: Full lifecycle from creation to completion

```
1. CREATE: POST /api/work-orders
   → authenticate() → requireRole(*)
   → Generate wo_number (WO-YYYYMMDD-XXXX)
   → WorkOrder.create({ org_id, requester_id, status: 'new' })
   → AuditLog.create()

2. ASSIGN: PATCH /api/work-orders/:id/assign
   → authenticate() → requireRole([Manager+])
   → WorkOrder.update({ assignee_id, status: 'open' })
   → AuditLog.create()

3. START: PATCH /api/work-orders/:id/status { status: 'in_progress' }
   → authenticate()
   → Set actual_start timestamp
   → AuditLog.create()

4. ADD PARTS: POST /api/work-orders/:id/inventory
   → authenticate()
   → InventoryItem.findOne() — validate stock
   → Deduct item.quantity
   → WorkOrderInventoryItem.create()

5. UPLOAD PROOF: POST /api/work-orders/:id/attachments
   → authenticate()
   → Multer saves files to /uploads/work-orders/
   → WOAttachment.create() for each file

6. COMPLETE: PATCH /api/work-orders/:id/status { status: 'completed' }
   → authenticate()
   → Validate at least 1 attachment exists (gate)
   → Set actual_end timestamp
   → AuditLog.create()
```

### 4.5 Work Order Comments & Notifications

**Flow**: `POST /api/work-orders/:wo_id/comments`

```
Client → authenticate()
  → WorkOrder.findOne() — verify access
  → WOComment.create({ work_order_id, user_id, message })
  → WOComment.findByPk(include: [User, Role]) — full load
  → io.to('wo_<id>').emit('new_comment', comment) — real-time broadcast
  → Determine recipients (assignee + requester, excluding commenter)
  → For each recipient:
      → Notification.create({ user_id, title, message, link })
      → io.emit('new_notification', { ...notification, target_user_id })
  → Return 201 + comment
```

### 4.6 Inventory Management

**Flow**: CRUD + Stock consumption

```
CREATE: POST /api/inventory
  → authenticate() → requireRole([Manager+])
  → InventoryItem.create({ org_id, ... })
  → AuditLog.create()

CONSUME (via WO): POST /api/work-orders/:id/inventory
  → Validate stock availability
  → Deduct InventoryItem.quantity
  → Create WorkOrderInventoryItem usage record

RESTORE (via WO): DELETE /api/work-orders/:id/inventory/:usage_id
  → Find usage record
  → Restore InventoryItem.quantity
  → Destroy usage record

LOW STOCK: GET /api/inventory?low_stock_only=true
  → Where min_quantity > 0 AND quantity <= min_quantity
```

### 4.7 Asset Lifecycle

**Flow**: Registration → Usage → Deactivation

```
CREATE: POST /api/assets
  → Auto-generate asset_tag (AST-XXXXXX) if not provided
  → Asset.create({ org_id, ... })
  → AuditLog.create()

LINK TO WO: POST /api/work-orders { asset_id: <id> }
  → Work order references asset

DEACTIVATE: DELETE /api/assets/:id (first call)
  → Set is_active = false + soft delete (deleted_at timestamp)

PERMANENT DELETE: DELETE /api/assets/:id (second call on soft-deleted)
  → force: true — permanently removes record
```

### 4.8 Analytics Dashboard

**Flow**: `GET /api/analytics/dashboard`

```
Client → authenticate()
  → Count work orders by status (new, open, in_progress, on_hold, completed, cancelled)
  → Count by priority (low, medium, high, critical)
  → Calculate completion rate
  → Count active assets
  → Count active PM schedules + overdue PMs
  → Fetch 10 most recent work orders (with Asset, Assignee, Requester)
  → Return aggregated stats object
```

### 4.9 Preventive Maintenance Schedule

**Flow**: CRUD (no auto-generation logic currently)

```
CREATE: POST /api/pm-schedules
  → authenticate() → requireRole([Manager+])
  → PMSchedule.create({ org_id, asset_id, frequency_type, frequency_value, next_due })
  → AuditLog.create()

NOTE: The PM → WO auto-generation is modeled (is_pm_generated flag on WorkOrder)
      but not yet implemented as a background scheduler.
```

### 4.10 RBAC Authorization Matrix

| Role | Users | Assets | Work Orders | Inventory | PM Schedules | Analytics | Roles | Orgs |
|---|---|---|---|---|---|---|---|---|
| **Super_Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full | Full CRUD | Full |
| **Org_Admin** | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full | Full CRUD | Own org |
| **Facility_Manager** | Read | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full | Read | — |
| **Technician** | Read | Read | Own assigned | Read | Read | Own stats | Read | — |
| **Requestor** | Read | Read | Own requested | Read | Read | Read | Read | — |

---

## STEP 5 — Sequence Diagrams

### 5.1 User Login

```mermaid
sequenceDiagram
    actor User
    participant API as Express Server
    participant AuthRoute as Auth Route Handler
    participant UserModel as User Model (Sequelize)
    participant DB as MySQL Database
    participant JWT as jsonwebtoken

    User->>API: POST /api/auth/login { email, password }
    API->>AuthRoute: Route matched
    AuthRoute->>UserModel: findOne({ email }, include: [Role, Organization])
    UserModel->>DB: SELECT * FROM users JOIN roles JOIN organizations WHERE email = ?
    DB-->>UserModel: User record (or null)
    UserModel-->>AuthRoute: User instance

    alt User not found OR password mismatch
        AuthRoute->>AuthRoute: bcrypt.compareSync(password, password_hash)
        AuthRoute-->>API: 401 { detail: "Invalid email or password" }
        API-->>User: 401 Unauthorized
    else User is inactive
        AuthRoute-->>API: 403 { detail: "Account is disabled" }
        API-->>User: 403 Forbidden
    else Authentication successful
        AuthRoute->>AuthRoute: bcrypt.compareSync(password, password_hash) ✓
        AuthRoute->>UserModel: user.save() — update last_login
        UserModel->>DB: UPDATE users SET last_login = NOW()
        AuthRoute->>JWT: jwt.sign({ sub, org_id, role }, secret, 24h)
        JWT-->>AuthRoute: access_token
        AuthRoute-->>API: 200 { access_token, user }
        API-->>User: 200 OK + JWT Token
    end
```

### 5.2 Work Order Creation

```mermaid
sequenceDiagram
    actor User
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant RoleMW as requireRole()
    participant WORoute as WorkOrder Route
    participant WOModel as WorkOrder Model
    participant AuditModel as AuditLog Model
    participant DB as MySQL Database

    User->>API: POST /api/work-orders { title, description, asset_id, priority, ... }
    API->>AuthMW: authenticate()
    AuthMW->>DB: SELECT * FROM users WHERE id = ? (from JWT)
    DB-->>AuthMW: User + Role
    AuthMW->>RoleMW: requireRole([Super_Admin, ..., Requestor])
    RoleMW-->>WORoute: Authorized ✓

    WORoute->>WORoute: Generate wo_number (WO-20260307-XXXX)
    WORoute->>WORoute: Set status = 'new', requester_id = user.id
    WORoute->>WOModel: WorkOrder.create(woData)
    WOModel->>DB: INSERT INTO work_orders (...)
    DB-->>WOModel: Created record

    WORoute->>WOModel: findByPk(id, include: [Asset, assignee, requester, parts, attachments])
    WOModel->>DB: SELECT ... JOIN assets, users, inventory ...
    DB-->>WOModel: Fully loaded WO

    WORoute->>AuditModel: AuditLog.create({ entity_type: 'WorkOrder', action: 'create' })
    AuditModel->>DB: INSERT INTO audit_logs (...)

    WORoute-->>API: 201 Created
    API-->>User: 201 { work_order }
```

### 5.3 Work Order Comment + Real-Time Notification

```mermaid
sequenceDiagram
    actor Commenter
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant WORoute as WorkOrder Route
    participant CommentModel as WOComment Model
    participant NotifModel as Notification Model
    participant DB as MySQL Database
    participant SocketIO as Socket.IO Server
    actor Assignee
    actor Requester

    Commenter->>API: POST /api/work-orders/:wo_id/comments { message }
    API->>AuthMW: authenticate()
    AuthMW-->>WORoute: User verified

    WORoute->>DB: SELECT * FROM work_orders WHERE id = ? AND org_id = ?
    DB-->>WORoute: Work Order (with assignee_id, requester_id)

    WORoute->>CommentModel: WOComment.create({ work_order_id, user_id, message })
    CommentModel->>DB: INSERT INTO wo_comments (...)
    DB-->>CommentModel: Comment created

    WORoute->>CommentModel: findByPk(include: [User, Role])
    CommentModel->>DB: SELECT ... JOIN users, roles
    DB-->>WORoute: Full comment

    WORoute->>SocketIO: io.to('wo_<wo_id>').emit('new_comment', comment)
    SocketIO-->>Assignee: new_comment event (if viewing WO)
    SocketIO-->>Requester: new_comment event (if viewing WO)

    loop For each recipient (assignee, requester) != commenter
        WORoute->>NotifModel: Notification.create({ user_id, title, message, link })
        NotifModel->>DB: INSERT INTO notifications (...)
        WORoute->>SocketIO: io.emit('new_notification', { notif, target_user_id })
        SocketIO-->>Assignee: new_notification event
        SocketIO-->>Requester: new_notification event
    end

    WORoute-->>API: 201 Created
    API-->>Commenter: 201 { comment }
```

### 5.4 Work Order Status Transition (Completion Gate)

```mermaid
sequenceDiagram
    actor Technician
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant WORoute as WorkOrder Route
    participant WOModel as WorkOrder Model
    participant AttachModel as WOAttachment Model
    participant AuditModel as AuditLog Model
    participant DB as MySQL Database

    Technician->>API: PATCH /api/work-orders/:wo_id/status { status: "completed", notes: "Work done" }
    API->>AuthMW: authenticate()
    AuthMW-->>WORoute: User verified

    WORoute->>WOModel: findOne({ id, org_id })
    WOModel->>DB: SELECT * FROM work_orders WHERE id = ? AND org_id = ?
    DB-->>WORoute: Work Order (current status, etc.)

    WORoute->>AttachModel: WOAttachment.count({ work_order_id })
    AttachModel->>DB: SELECT COUNT(*) FROM wo_attachments WHERE work_order_id = ?
    DB-->>WORoute: attachment_count

    alt attachment_count === 0
        WORoute-->>API: 400 { detail: "Cannot mark as completed without uploading at least one image/attachment." }
        API-->>Technician: 400 Bad Request
    else Has attachments
        WORoute->>WORoute: Set status = 'completed', actual_end = NOW()
        WORoute->>WORoute: Append timestamped note to wo.notes
        WORoute->>WOModel: wo.save()
        WOModel->>DB: UPDATE work_orders SET status, actual_end, notes ...
        DB-->>WOModel: Updated

        WORoute->>WOModel: findByPk(include: all associations)
        WOModel->>DB: SELECT ... (full join)
        DB-->>WORoute: Fully loaded WO

        WORoute->>AuditModel: AuditLog.create({ action: 'status_change', old: 'in_progress', new: 'completed' })
        AuditModel->>DB: INSERT INTO audit_logs (...)

        WORoute-->>API: 200 OK
        API-->>Technician: 200 { updated work_order }
    end
```

### 5.5 Inventory Consumption via Work Order

```mermaid
sequenceDiagram
    actor Technician
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant WORoute as WorkOrder Route
    participant WOModel as WorkOrder Model
    participant InvModel as InventoryItem Model
    participant UsageModel as WO Inventory Item
    participant DB as MySQL Database

    Technician->>API: POST /api/work-orders/:wo_id/inventory { inventory_item_id, quantity_used: 3 }
    API->>AuthMW: authenticate()
    AuthMW-->>WORoute: User verified

    WORoute->>WOModel: findOne({ id, org_id })
    WOModel->>DB: SELECT * FROM work_orders WHERE id = ?
    DB-->>WORoute: Work Order ✓

    WORoute->>InvModel: findOne({ id: inventory_item_id, org_id })
    InvModel->>DB: SELECT * FROM inventory_items WHERE id = ? AND org_id = ?
    DB-->>WORoute: InventoryItem { quantity: 10 }

    alt quantity < quantity_used
        WORoute-->>API: 400 { detail: "Not enough stock. Only 10 available." }
        API-->>Technician: 400 Bad Request
    else Sufficient stock
        WORoute->>InvModel: item.quantity -= 3, item.save()
        InvModel->>DB: UPDATE inventory_items SET quantity = 7 WHERE id = ?
        DB-->>InvModel: Updated

        WORoute->>UsageModel: WorkOrderInventoryItem.create({ work_order_id, inventory_item_id, quantity_used: 3 })
        UsageModel->>DB: INSERT INTO work_order_inventory_items (...)
        DB-->>UsageModel: Usage record created

        WORoute->>UsageModel: findByPk(include: [InventoryItem])
        UsageModel->>DB: SELECT ... JOIN inventory_items
        DB-->>WORoute: Full usage record

        WORoute-->>API: 201 Created
        API-->>Technician: 201 { usage_record_with_item }
    end
```

### 5.6 Organization Setup + User Registration

```mermaid
sequenceDiagram
    actor Admin
    participant API as Express Server
    participant OrgRoute as Org Route
    participant OrgModel as Organization Model
    participant RoleModel as Role Model
    participant AuthMW as Auth Middleware
    participant UserRoute as User Route
    participant UserModel as User Model
    participant AuditModel as AuditLog Model
    participant DB as MySQL Database

    Note over Admin, DB: Phase 1: Create Organization (No Auth)
    Admin->>API: POST /api/organizations { name, description, address }
    API->>OrgRoute: Route matched (no auth required)
    OrgRoute->>OrgModel: Organization.findOne({ name })
    OrgModel->>DB: SELECT * FROM organizations WHERE name = ?
    DB-->>OrgRoute: null (unique)

    OrgRoute->>OrgModel: Organization.create(data)
    OrgModel->>DB: INSERT INTO organizations (...)
    DB-->>OrgRoute: Org created

    loop Create 5 default roles
        OrgRoute->>RoleModel: Role.create({ org_id, name, permissions })
        RoleModel->>DB: INSERT INTO roles (...)
    end
    Note right of OrgRoute: Super_Admin, Org_Admin, Facility_Manager, Technician, Requestor

    OrgRoute-->>API: 201 Created
    API-->>Admin: 201 { organization }

    Note over Admin, DB: Phase 2: Create User (Auth Required)
    Admin->>API: POST /api/users { email, password, role_id, username, ... }
    API->>AuthMW: authenticate() + requireRole([Admin+])
    AuthMW-->>UserRoute: Authorized

    UserRoute->>UserModel: User.findOne({ email }) — duplicate check
    UserRoute->>RoleModel: Role.findOne({ id, org_id }) — validate role
    UserRoute->>UserRoute: bcrypt.hashSync(password)
    UserRoute->>UserModel: User.create({ org_id, role_id, ... })
    UserModel->>DB: INSERT INTO users (...)
    DB-->>UserRoute: New user

    UserRoute->>AuditModel: AuditLog.create({ action: 'create' })
    AuditModel->>DB: INSERT INTO audit_logs (...)

    UserRoute-->>API: 201 Created
    API-->>Admin: 201 { user_with_role }
```

### 5.7 Work Order Assignment

```mermaid
sequenceDiagram
    actor Manager as Facility Manager
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant WORoute as WorkOrder Route
    participant WOModel as WorkOrder Model
    participant AuditModel as AuditLog Model
    participant DB as MySQL Database

    Manager->>API: PATCH /api/work-orders/:wo_id/assign { assignee_id: "tech-uuid" }
    API->>AuthMW: authenticate() + requireRole([Manager+])
    AuthMW-->>WORoute: Authorized ✓

    WORoute->>WOModel: findOne({ id, org_id })
    WOModel->>DB: SELECT * FROM work_orders WHERE id = ? AND org_id = ?
    DB-->>WORoute: WorkOrder { status: 'new' }

    WORoute->>WORoute: Set assignee_id = "tech-uuid"
    WORoute->>WORoute: If status is 'new' → change to 'open'
    WORoute->>WOModel: wo.save()
    WOModel->>DB: UPDATE work_orders SET assignee_id = ?, status = 'open'
    DB-->>WOModel: Updated

    WORoute->>WOModel: findByPk(include: all associations)
    WOModel->>DB: SELECT with JOINs
    DB-->>WORoute: Fully loaded WO

    WORoute->>AuditModel: AuditLog.create({ action: 'assign' })
    AuditModel->>DB: INSERT INTO audit_logs (...)

    WORoute-->>API: 200 OK
    API-->>Manager: 200 { updated_work_order }
```

### 5.8 File Upload (Work Order Attachments)

```mermaid
sequenceDiagram
    actor User
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant Multer as Multer Middleware
    participant WORoute as WorkOrder Route
    participant WOModel as WorkOrder Model
    participant AttachModel as WOAttachment Model
    participant FS as File System
    participant DB as MySQL Database

    User->>API: POST /api/work-orders/:wo_id/attachments (multipart/form-data, images[])
    API->>AuthMW: authenticate()
    AuthMW-->>Multer: Authorized

    Multer->>Multer: Validate file count (max 3) and size (max 1MB each)
    alt Validation fails
        Multer-->>API: MulterError (LIMIT_FILE_SIZE or LIMIT_FILE_COUNT)
        API-->>User: 400 { detail: error.message }
    else Files accepted
        Multer->>FS: Save files to /uploads/work-orders/<timestamp>-<original_name>
        FS-->>Multer: Files saved

        Multer-->>WORoute: req.files populated

        WORoute->>WOModel: findOne({ id, org_id })
        WOModel->>DB: SELECT * FROM work_orders WHERE ...
        DB-->>WORoute: Work Order ✓

        loop For each uploaded file
            WORoute->>AttachModel: WOAttachment.create({ work_order_id, file_path })
            AttachModel->>DB: INSERT INTO wo_attachments (...)
        end

        WORoute-->>API: 201 Created
        API-->>User: 201 [attachment_records]
    end
```

### 5.9 Analytics Dashboard

```mermaid
sequenceDiagram
    actor Manager as Manager / Admin
    participant API as Express Server
    participant AuthMW as Auth Middleware
    participant AnalyticsRoute as Analytics Route
    participant WOModel as WorkOrder Model
    participant AssetModel as Asset Model
    participant PMModel as PMSchedule Model
    participant DB as MySQL Database

    Manager->>API: GET /api/analytics/dashboard
    API->>AuthMW: authenticate()
    AuthMW-->>AnalyticsRoute: Authorized

    par Parallel stat queries
        AnalyticsRoute->>WOModel: count({ org_id, status: various })
        WOModel->>DB: SELECT COUNT(*) FROM work_orders WHERE ...
        DB-->>AnalyticsRoute: total, completed, pending, in_progress

        AnalyticsRoute->>AssetModel: count({ org_id, is_active: true })
        AssetModel->>DB: SELECT COUNT(*) FROM assets WHERE ...
        DB-->>AnalyticsRoute: total_assets

        AnalyticsRoute->>PMModel: count({ org_id, is_active, next_due < NOW() })
        PMModel->>DB: SELECT COUNT(*) FROM pm_schedules WHERE ...
        DB-->>AnalyticsRoute: active_pms, overdue_pms
    end

    loop For each status in [new, open, in_progress, on_hold, completed, cancelled]
        AnalyticsRoute->>DB: SELECT COUNT(*) WHERE status = ?
        DB-->>AnalyticsRoute: count
    end

    loop For each priority in [low, medium, high, critical]
        AnalyticsRoute->>DB: SELECT COUNT(*) WHERE priority = ?
        DB-->>AnalyticsRoute: count
    end

    AnalyticsRoute->>WOModel: findAll(limit: 10, order: DESC, include: [Asset, assignee, requester])
    WOModel->>DB: SELECT TOP 10 ... JOIN ...
    DB-->>AnalyticsRoute: recent_work_orders

    AnalyticsRoute-->>API: 200 { stats, wo_by_status, wo_by_priority, recent_work_orders }
    API-->>Manager: 200 Dashboard Data
```

### 5.10 Soft Delete / Hard Delete Flow (Universal Pattern)

```mermaid
sequenceDiagram
    actor Admin
    participant API as Express Server
    participant Route as Entity Route Handler
    participant Model as Sequelize Model
    participant AuditModel as AuditLog Model
    participant DB as MySQL Database

    Note over Admin, DB: First DELETE call → Soft Delete
    Admin->>API: DELETE /api/<entity>/:id
    API->>Route: authenticate() + requireRole()
    Route->>Model: findOne({ id, org_id }, paranoid: false)
    Model->>DB: SELECT * FROM <table> WHERE id = ? (includes soft-deleted)
    DB-->>Route: Entity { deleted_at: null, is_active: true }

    Route->>Route: entity.is_active = false
    Route->>Model: entity.save()
    Model->>DB: UPDATE SET is_active = false
    Route->>Model: entity.destroy() — Sequelize paranoid soft delete
    Model->>DB: UPDATE SET deleted_at = NOW()

    Route->>AuditModel: AuditLog.create({ action: 'delete' })
    Route-->>API: 200 { message: "Entity deactivated" }
    API-->>Admin: 200 Soft Deleted

    Note over Admin, DB: Second DELETE call → Hard Delete
    Admin->>API: DELETE /api/<entity>/:id
    API->>Route: authenticate() + requireRole()
    Route->>Model: findOne({ id, org_id }, paranoid: false)
    Model->>DB: SELECT * FROM <table> WHERE id = ?
    DB-->>Route: Entity { deleted_at: '2026-03-07', is_active: false }

    Route->>Model: entity.destroy({ force: true }) — permanent delete
    Model->>DB: DELETE FROM <table> WHERE id = ?

    Route->>AuditModel: AuditLog.create({ action: 'hard_delete' })
    Route-->>API: 200 { message: "Entity permanently deleted" }
    API-->>Admin: 200 Hard Deleted
```

---

## Appendix A — Request Flow Summary

Every authenticated API request follows this pipeline:

```
Client HTTP Request
    │
    ▼
┌──────────────────────┐
│   CORS Middleware     │
└──────────┬───────────┘
           │
    ▼
┌──────────────────────┐
│   express.json()     │  ← Body parsing
└──────────┬───────────┘
           │
    ▼
┌──────────────────────┐
│  authenticate()      │  ← JWT verification + User lookup
│  middleware/auth.ts   │
└──────────┬───────────┘
           │
    ▼
┌──────────────────────┐
│  requireRole([...])  │  ← RBAC check (optional per route)
│  middleware/auth.ts   │
└──────────┬───────────┘
           │
    ▼
┌──────────────────────┐
│  Route Handler        │  ← Business logic + Sequelize queries
│  routes/<module>.ts   │
└──────────┬───────────┘
           │
    ▼
┌──────────────────────┐     ┌─────────────────┐
│  Sequelize ORM       │────▶│  MySQL Database  │
│  models/index.ts     │◀────│                  │
└──────────┬───────────┘     └─────────────────┘
           │
    ▼ (on error)
┌──────────────────────┐
│  Global Error Handler │  ← Catches all unhandled errors
│  server.ts            │
└──────────────────────┘
```

## Appendix B — Work Order State Machine

```mermaid
stateDiagram-v2
    [*] --> new: Created
    new --> open: Assigned to technician
    open --> in_progress: Work started
    in_progress --> on_hold: Paused
    on_hold --> in_progress: Resumed
    in_progress --> completed: Marked complete (requires attachment)
    new --> cancelled: Cancelled
    open --> cancelled: Cancelled
    in_progress --> cancelled: Cancelled
    completed --> [*]
    cancelled --> [*]
```

## Appendix C — Technology Decision Summary

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js + TypeScript | Rapid development, type safety |
| Web Framework | Express 5 | Industry standard, mature ecosystem |
| ORM | Sequelize 6 | Feature-rich, MySQL support, migrations, paranoid mode |
| Database | MySQL | Relational data with strong FK constraints |
| Auth | JWT (24h expiry) | Stateless auth, no session store needed |
| Real-time | Socket.IO | Bidirectional events for comments/notifications |
| File Storage | Local disk (Multer) | Simple, no cloud dependency for MVP |
| Password Hashing | bcryptjs | Industry standard, salt rounds = 10 |
| Multi-tenancy | Shared DB, `org_id` filter | Simple, effective for single-deployment |
