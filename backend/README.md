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
| Auth | JSON Web Tokens (JWT) via `jsonwebtoken` |
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

### 4. Run the Dev Server

```bash
npm run dev
```

Server starts at **http://localhost:8000**. Database tables are auto-synchronized via Sequelize `sync({ alter: true })`.

### 5. Seed the Database

```bash
npm run seed
```

Populates the DB with sample organizations, roles, users, assets, work orders, and inventory items.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with `nodemon` + `ts-node` (hot-reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled JS from `dist/` |
| `npm run seed` | Seed database with sample data |

## API Endpoints

All routes are prefixed with `/api`.

| Route | Description |
|-------|-------------|
| `/api/auth` | Login, JWT token generation |
| `/api/users` | User CRUD, role assignment |
| `/api/organizations` | Organization management |
| `/api/roles` | Role definitions (Super Admin, Org Admin, Manager, Technician, Requestor) |
| `/api/assets` | Asset CRUD, bulk import |
| `/api/work-orders` | Work order lifecycle (create → assign → complete), file attachments, parts used |
| `/api/pm-schedules` | Preventive maintenance schedules |
| `/api/inventory` | Inventory items, stock tracking, stats |
| `/api/analytics` | Dashboard analytics (work order stats, asset health, team performance) |

### Pagination

List endpoints (`GET /api/work-orders`, `GET /api/assets`, `GET /api/inventory`) support server-side pagination via query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `skip` | `0` | Number of records to skip |
| `limit` | `10` | Number of records to return |

Response format:
```json
{
  "data": [...],
  "total": 42,
  "skip": 0,
  "limit": 10
}
```

### File Uploads

Work order attachments are stored in `uploads/work-orders/` and served statically at `/uploads/`.

## Project Structure

```
backend/
├── src/
│   ├── server.ts          # Express app entry point + Socket.IO setup
│   ├── models/            # Sequelize model definitions & associations
│   ├── routes/            # API route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── organizations.ts
│   │   ├── roles.ts
│   │   ├── assets.ts
│   │   ├── workOrders.ts
│   │   ├── pmSchedules.ts
│   │   ├── inventory.ts
│   │   └── analytics.ts
│   └── middleware/        # Auth middleware (JWT verification)
├── seed.ts                # Database seeding script
├── package.json
├── tsconfig.json
└── .env
```

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Super Admin** | Full system access across all organizations |
| **Org Admin** | Full access within their organization |
| **Manager** | Create/edit assets, work orders, inventory; assign technicians |
| **Technician** | View assigned work orders, update status, log parts used |
| **Requestor** | Submit work order requests, view own requests |

> **Note:** Org Admins are restricted from creating Super Admin or Org Admin roles.
