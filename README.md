# CMMS Platform

A full-stack **Computerized Maintenance Management System** built for managing assets, work orders, preventive maintenance, inventory, and team operations — with real-time notifications and role-based access control.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18, React Router, Axios, Recharts, Socket.IO Client |
| **Backend** | Node.js, Express 5, TypeScript, Sequelize 6, Socket.IO |
| **Database** | MySQL 8.0 (via Docker) |
| **Auth** | JWT (JSON Web Tokens) |
| **Validation** | Zod |
| **Logging** | Pino (structured JSON) |
| **Security** | Helmet, express-rate-limit, bcryptjs |

## Features

- **Asset Management** — Track movable & immovable assets with tags, categories, warranty info
- **Work Orders** — Full lifecycle management (create → assign → in-progress → complete) with comments, attachments, and parts tracking
- **Preventive Maintenance** — Schedule recurring maintenance with configurable frequencies
- **Inventory Tracking** — Stock levels, low-stock alerts, usage per work order with atomic stock deduction
- **Analytics Dashboards** — Admin and technician-specific dashboards with charts
- **Real-time Notifications** — Socket.IO powered live notifications and work order comment updates

- **Role-Based Access Control (RBAC)** — Granular, multi-tenant RBAC system with customizable Roles, Groups, and Access Features. [Read the Architecture Guide](./docs/RBAC_ARCHITECTURE.md).
- **Multi-Organization** — Tenant-isolated data with organization-scoped queries

## Quick Start

### Prerequisites

- Node.js v18+
- npm
- Docker & Docker Compose

### 1. Clone & Start the Database

```bash
git clone <repo-url>
cd CMMS-Platform
docker compose up -d
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env    # Configure your environment variables
npm run migrate          # Run database migrations
npm run seed             # Seed sample data
npm run dev              # Start backend on http://localhost:8000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start                # Start frontend on http://localhost:3000
```

### 4. Login

Use the seeded credentials to log in at `http://localhost:3000`.

## Project Structure

```
CMMS-Platform/
├── backend/                    # Node.js/Express REST API
│   ├── src/
│   │   ├── routes/             # Thin endpoint → controller mappings
│   │   ├── controllers/        # HTTP req/res handling (typed)
│   │   ├── services/           # Business logic & orchestration
│   │   ├── repositories/       # Sequelize data access layer
│   │   ├── models/             # Sequelize model definitions
│   │   ├── middleware/         # Auth, validation, error handling, logging
│   │   ├── errors/             # AppError class hierarchy
│   │   ├── types/              # DTOs & Express type augmentations
│   │   ├── validators/         # Zod input validation schemas
│   │   ├── migrations/         # Sequelize CLI migrations
│   │   └── server.ts           # App entry point
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # API client (Axios)
│   │   └── App.js              # Router & layout
│   └── package.json
├── docker-compose.yml          # MySQL 8.0 container
└── README.md
```

## Architecture

The backend follows a strict **4-layer architecture**:

```
Request → Route → Controller → Service → Repository → Database
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** | Endpoint definitions, middleware wiring (auth, validation) |
| **Controllers** | HTTP concerns — extract DTOs from request, return status codes |
| **Services** | All business logic, transactions, orchestration |
| **Repositories** | Pure database operations via Sequelize |

Errors are thrown as typed classes (`NotFoundError`, `ForbiddenError`, etc.) from any layer and auto-serialized by the centralized error handler.

## API Overview

All API routes are prefixed with `/api`.

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `POST /login`, `GET /me` | JWT authentication |
| Users | CRUD + bulk ops + `/me` | User management & self-serve profile |
| Organizations | CRUD | Multi-tenant org management |
| Roles | CRUD + `/accesses` | Custom Tenant Roles |
| Groups | CRUD + `/members`, `/roles` | User Groups & inherited permissions |
| Accesses | CRUD | Granular feature strings |
| Assets | CRUD + bulk | Asset tracking with tags & categories |
| Work Orders | CRUD + status/assign/comments/attachments/inventory | Full work order lifecycle |
| PM Schedules | CRUD | Preventive maintenance scheduling |
| Inventory | CRUD + stats/categories | Stock management with low-stock alerts |
| Analytics | 2 dashboards | Admin & technician analytics |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `8000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `cmms_user` |
| `DB_PASS` | MySQL password | `cmms_password` |
| `DB_NAME` | MySQL database name | `cmms_dev` |
| `JWT_SECRET` | Secret key for JWT signing | *required* |

## License

ISC
