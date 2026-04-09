---
description: How to set up the CMMS backend from scratch on a new machine or fresh database
---
# Project Setup Workflow

## Prerequisites
- Node.js 20.x
- MySQL 8.x (local or remote)
- Git

## Step 1: Clone and Install
```bash
git clone <repo-url>
cd CMMS-Platform/backend
npm install
```

## Step 2: Environment Variables
Create `.env` in the backend root:

```
PORT=8000
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cmms_platform
JWT_SECRET=your_super_secret_jwt_key
```

## Step 3: Create Database
```bash
npx sequelize-cli db:create
```
// turbo

## Step 4: Full Setup (Migrate + Seed in One Command)
```bash
npm run setup
```
// turbo

This runs all migrations and seeds the database with:
- 1 Demo Organization
- 30 system permissions
- 6 roles (Super_Admin, Org_Admin, Facility_Manager, Technician, Requestor, Cleaning_Staff)
- 6 demo users with credentials
- 1 demo site
- 50 demo assets
- 50 demo inventory items
- 50 demo work orders

## Step 5: Start Development Server
```bash
npm run dev
```
// turbo

Server starts at `http://localhost:8000`. API docs at `/api-docs`.

## Available Scripts
| Command | Description |
|---|---|
| `npm run setup` | Migrate + seed everything (fresh start) |
| `npm run migrate` | Run pending migrations only |
| `npm run migrate:undo` | Undo last migration |
| `npm run seed` | Seed org, roles, permissions, users only |
| `npm run seed:all` | Full seed (org + roles + users + site + assets + inventory + work orders) |
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | TypeScript production build |
| `npm run test` | Run jest tests |
| `npm run pm:trigger` | Manually trigger PM schedule evaluation |

## Demo User Credentials
| Email | Password | Role |
|---|---|---|
| admin@demo.com | admin123 | Super_Admin |
| orgadmin@demo.com | orgadmin123 | Org_Admin |
| manager@demo.com | manager123 | Facility_Manager |
| tech@demo.com | tech123 | Technician |
| requestor@demo.com | requestor123 | Requestor |
| cleaner@demo.com | cleaner123 | Cleaning_Staff |
