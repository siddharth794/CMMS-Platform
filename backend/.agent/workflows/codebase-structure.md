---
description: Codebase directory structure and naming conventions for the CMMS backend
---
# Codebase Structure & Naming Conventions

## Directory Layout
```
backend/
├── .env                          # Environment variables (not committed)
├── .sequelizerc                  # Sequelize CLI path config
├── package.json                  # Scripts: dev, build, setup, migrate, seed, test
├── tsconfig.json                 # TypeScript config
├── jest.config.js                # Jest test config
│
├── src/
│   ├── server.ts                 # Express app entry point + Socket.IO setup
│   ├── config/
│   │   ├── config.js             # Sequelize CLI config (dev/test/prod)
│   │   ├── database.ts           # Sequelize instance
│   │   └── logger.ts             # Pino logger
│   │
│   ├── models/
│   │   └── index.ts              # ALL models + associations in ONE file
│   │
│   ├── migrations/               # Sequelize CLI migration files (JS)
│   │   └── YYYYMMDDHHMMSS-description.js
│   │
│   ├── constants/
│   │   ├── permissions.ts        # PERMISSIONS array + DEFAULT_ROLE_PERMISSIONS
│   │   ├── roles.ts              # ROLES, ADMIN_ROLES, MANAGER_ROLES, ALL_WO_ROLES
│   │   └── workOrder.ts          # WO status/priority constants
│   │
│   ├── errors/
│   │   └── AppError.ts           # All error classes (BadRequest, NotFound, etc.)
│   │
│   ├── middleware/
│   │   ├── auth.ts               # authenticate, requireRole, requirePermission
│   │   ├── validate.ts           # Zod validation middleware
│   │   ├── errorHandler.ts       # Centralized error handler
│   │   ├── requestId.ts          # UUID per request
│   │   └── requestLogger.ts      # Pino request logging
│   │
│   ├── validators/               # Zod schemas per entity
│   │   └── <entity>.validator.ts
│   │
│   ├── controllers/              # Request parsing + response formatting
│   │   └── <entity>.controller.ts
│   │
│   ├── services/                 # Business logic layer
│   │   ├── <entity>.service.ts
│   │   ├── audit.service.ts      # Audit logging (fire-and-forget)
│   │   ├── auth.service.ts       # JWT + bcrypt login
│   │   └── notification.service.ts # Socket.IO real-time events
│   │
│   ├── repositories/             # Sequelize queries + data access
│   │   └── <entity>.repository.ts
│   │
│   ├── routes/                   # Express routers + middleware wiring
│   │   ├── index.ts              # Central router (mounts all sub-routers)
│   │   └── <entity>.ts
│   │
│   ├── types/
│   │   ├── dto.ts                # All Create/Update/Query DTOs
│   │   ├── common.dto.ts         # Shared types (AuditContext, PaginatedResponse)
│   │   └── express.d.ts          # Express Request augmentation (req.user)
│   │
│   ├── workers/
│   │   ├── pmGenerator.worker.ts # Cron: auto-generates PM work orders
│   │   └── areaChecklist.worker.ts # Cron: generates area checklist executions
│   │
│   ├── scripts/
│   │   ├── seed.ts               # Minimal seed (org + roles + users)
│   │   ├── seed-all.ts           # Full seed (everything for fresh setup)
│   │   └── trigger-pms.ts        # Manual PM trigger utility
│   │
│   └── __tests__/                # Jest test files
│       ├── services/
│       ├── routes/
│       └── middleware/
│
└── uploads/                      # File upload directory (created at runtime)
```

## Naming Conventions

### Files
| Layer | Pattern | Example |
|---|---|---|
| Model | `src/models/index.ts` (single file) | — |
| Route | `src/routes/<entities>.ts` | `workOrders.ts`, `pmSchedules.ts` |
| Controller | `src/controllers/<entity>.controller.ts` | `workOrder.controller.ts` |
| Service | `src/services/<entity>.service.ts` | `workOrder.service.ts` |
| Repository | `src/repositories/<entity>.repository.ts` | `workOrder.repository.ts` |
| Validator | `src/validators/<entity>.validator.ts` | `workOrder.validator.ts` |
| Migration | `src/migrations/YYYYMMDDHHMMSS-description.js` | `20260307180500-initial-schema.js` |

### Code
| Item | Convention | Example |
|---|---|---|
| Model class | PascalCase | `WorkOrder`, `PMSchedule` |
| Table name | snake_case plural | `work_orders`, `pm_schedules` |
| Column name | snake_case | `created_at`, `org_id`, `is_active` |
| Route path | kebab-case plural | `/work-orders`, `/pm-schedules` |
| Permission name | `module:action` | `work_order:create`, `asset:view` |
| Service/Repo export | singleton instance | `export default new FooService()` |
| Controller export | named functions | `export const createFoo = async (...) => { }` |
| Zod schema | camelCase + `Schema` | `createWorkOrderSchema` |
| DTO interface | PascalCase + `DTO` | `CreateWorkOrderDTO` |
