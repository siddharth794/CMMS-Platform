# CMMS Platform — Backend

Node.js/Express REST API for the **Computerized Maintenance Management System (CMMS)** platform. Handles authentication, asset management, work orders, preventive maintenance scheduling, inventory tracking, analytics, and real-time notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Node.js](https://nodejs.org/) v18+ |
| Framework | [Express.js](https://expressjs.com/) v5 |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Database | [MySQL 8.0](https://www.mysql.com/) |
| ORM | [Sequelize](https://sequelize.org/) v6 |
| Migrations | [Sequelize CLI](https://github.com/sequelize/cli) |
| Auth | JSON Web Tokens (JWT) via `jsonwebtoken` |
| Validation | [Zod](https://zod.dev/) |
| Logging | [Pino](https://getpino.io/) (structured JSON) |
| Security | [Helmet](https://helmetjs.github.io/) + [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| Real-time | [Socket.IO](https://socket.io/) v4 |
| File Uploads | [Multer](https://github.com/expressjs/multer) |

## Prerequisites

- Node.js v18+
- npm
- Docker & Docker Compose (for MySQL)

## Getting Started

### 1. Start the Database

```bash
# From the project root
docker compose up -d
```

This spins up a MySQL 8.0 container on port `3306`.

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USER=cmms_user
DB_PASSWORD=cmms_password
DB_NAME=cmms_dev
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Run Migrations

```bash
npm run migrate
```

This creates all database tables using Sequelize migrations (no more `sequelize.sync()`).

### 5. Seed the Database

```bash
npm run seed
```

Populates the DB with sample organizations, roles, users, assets, work orders, and inventory items.

### 6. Run the Dev Server

```bash
npm run dev
```

Server starts at **http://localhost:8000** with hot-reload via `nodemon`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with `nodemon` + `ts-node` (hot-reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled JS from `dist/` |
| `npm run seed` | Seed database with sample data |
| `npm run migrate` | Run pending Sequelize migrations |
| `npm run migrate:undo` | Revert the last migration |

## Architecture

The backend follows a strict **4-layer architecture** pattern:

```
Request → Route → Controller → Service → Repository → Database
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** (`src/routes/`) | Endpoint definitions, middleware wiring (auth, validation, rate limiting) |
| **Controllers** (`src/controllers/`) | HTTP req/res handling, DTO extraction, status codes. **Zero business logic.** |
| **Services** (`src/services/`) | All business logic, orchestration, transaction management. HTTP-agnostic. |
| **Repositories** (`src/repositories/`) | Pure Sequelize model operations. No business rules. |

### Error Handling

A centralized `AppError` class hierarchy (`src/errors/AppError.ts`) enables clean error throwing from any layer:

```typescript
// In any service:
throw new NotFoundError('Asset');        // → 404 { detail: "Asset not found" }
throw new ForbiddenError();              // → 403 { detail: "Insufficient permissions" }
throw new ConflictError('Email taken');  // → 409 { detail: "Email taken" }
throw new BadRequestError('Invalid');    // → 400 { detail: "Invalid" }
```

The global `errorHandler` middleware catches and serializes all errors consistently.

### Type Safety

- **Express augmentation** (`src/types/express.d.ts`): `req.user` is globally typed — no `any` casts
- **DTOs** (`src/types/dto.ts`): All request/response payloads use typed interfaces
- **Zod validation** (`src/validators/`): Input validated at the route level before reaching controllers

## API Endpoints

All routes are prefixed with `/api`.

| Route | Description |
|-------|-------------|
| `/api/auth` | Login, JWT token generation, current user |
| `/api/users` | User CRUD, role assignment, bulk operations |
| `/api/organizations` | Organization management with default role seeding |
| `/api/roles` | Role definitions (Super Admin, Org Admin, Manager, Technician, Requestor) |
| `/api/assets` | Asset CRUD, bulk import, bulk delete |
| `/api/work-orders` | Work order lifecycle (create → assign → complete), comments, file attachments, parts used |
| `/api/pm-schedules` | Preventive maintenance schedules |
| `/api/inventory` | Inventory items, stock tracking, stats, categories |
| `/api/analytics` | Dashboard analytics (admin + technician dashboards) |

### Pagination

List endpoints (`GET /api/work-orders`, `GET /api/assets`, `GET /api/inventory`) support server-side pagination:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `skip` | `0` | Number of records to skip |
| `limit` | `100` | Number of records to return |

Response format:
```json
{
  "data": [...],
  "total": 42,
  "skip": 0,
  "limit": 100
}
```

### File Uploads

Work order attachments are stored in `uploads/work-orders/` and served statically at `/uploads/`. Max 3 files per upload, 1 MB each.

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry point + Socket.IO + graceful shutdown
│   ├── config/
│   │   ├── database.ts        # Sequelize instance + connection pool
│   │   ├── config.js          # Sequelize CLI config (migrations)
│   │   └── logger.ts          # Pino structured logger
│   ├── constants/
│   │   └── roles.ts           # Centralized RBAC role constants
│   ├── errors/
│   │   └── AppError.ts        # Error class hierarchy (NotFound, Forbidden, etc.)
│   ├── types/
│   │   ├── express.d.ts       # Global Express type augmentation (req.user typing)
│   │   ├── common.dto.ts      # Shared DTOs (pagination, audit context, bulk ops)
│   │   └── dto.ts             # Module-specific DTOs (User, Asset, WorkOrder, etc.)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification + RBAC middleware
│   │   ├── errorHandler.ts    # Centralized error handler (AppError, Sequelize, JWT)
│   │   ├── validate.ts        # Zod validation middleware
│   │   ├── requestId.ts       # UUID per-request correlation
│   │   └── requestLogger.ts   # Pino-based request/response logging
│   ├── validators/            # Zod schemas for input validation
│   ├── routes/                # Thin endpoint → controller mappings
│   ├── controllers/           # HTTP layer (req/res/next), DTO extraction
│   ├── services/              # Business logic, orchestration, transactions
│   ├── repositories/          # Sequelize model operations (data access)
│   ├── models/                # Sequelize model definitions & associations
│   └── migrations/            # Sequelize CLI migration files
├── uploads/                   # File upload storage
├── seed.ts                    # Database seeding script
├── .sequelizerc               # Sequelize CLI path configuration
├── package.json
├── tsconfig.json
└── .env
```

## Security

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT tokens (24h expiry) |
| **Authorization** | Role-based access control (RBAC) via middleware |
| **Input Validation** | Zod schemas on all mutation endpoints |
| **Rate Limiting** | Global (500 req/15min) + login-specific (15 req/15min) |
| **Security Headers** | Helmet middleware (CSP, HSTS, X-Frame-Options, etc.) |
| **Password Hashing** | bcryptjs with salt rounds |
| **Request Tracing** | UUID correlation IDs on every request |
| **Structured Logging** | Pino JSON logs with request context |

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Super Admin** | Full system access across all organizations |
| **Org Admin** | Full access within their organization |
| **Facility Manager** | Create/edit assets, work orders, inventory, PM schedules; assign technicians |
| **Technician** | View assigned work orders, update status, log parts used |
| **Requestor** | Submit work order requests, view own requests |

> **Note:** Org Admins are restricted from assigning Super Admin or Org Admin roles.

## Health Check

```bash
curl http://localhost:8000/health
```

Returns server status, database connectivity, uptime, and memory usage:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "uptime": "120s",
    "memory": "85MB"
  }
}
```
