# CMMS Platform Backend API

This is the backend service for the CMMS (Computerized Maintenance Management System) Platform. It provides a robust, scalable REST API built with Node.js, Express, TypeScript, Sequelize (MySQL/PostgreSQL), and Socket.IO for real-time capabilities.

## 🚀 Technology Stack

* **Runtime**: Node.js (v20.x recommended)
* **Framework**: Express.js
* **Language**: TypeScript
* **ORM**: Sequelize
* **Database**: MySQL / PostgreSQL (Configurable)
* **Real-time**: Socket.IO
* **Authentication**: JWT (JSON Web Tokens)
* **Logging**: Pino & Pino-Pretty
* **Documentation**: Swagger UI

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
* [Node.js](https://nodejs.org/en/) (v20.x or higher)
* [npm](https://www.npmjs.com/) (v10.x or higher)
* A running MySQL or PostgreSQL database instance.

## ⚙️ Installation & Setup

1. **Clone the repository and navigate to the backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
   Create a `.env` file in the root of the `backend` directory and configure your environment variables. You can copy the structure below:
```env
# Server Configuration
PORT=8000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=cmms_dev

# Security
JWT_SECRET=your_super_secret_jwt_key_here
```

## 🗄️ Database Management (Migrations & Seeding)

The application uses Sequelize CLI to manage database schemas and populate initial data.

1. **Run Migrations**
   To execute all pending migrations and build your database schema:
```bash
npm run migrate
```

2. **Undo Migrations**
   If you need to rollback the most recent migration:
```bash
npm run migrate:undo
```

3. **Seed Initial/Demo Data**
   To populate the database with default roles, a super admin, and comprehensive demo data across all modules (Sites, Areas, Assets, Checklists, PM Schedules, Inventory, etc.):
```bash
npm run seed:all
```
   *(Alternatively, use `npm run seed` for minimal required bootstrapping like system roles).*

4. **All-in-One Setup Command**
   If you are setting up the project from scratch for the first time, you can run the setup script which migrates and seeds the database automatically:
```bash
npm run setup
```

## 🏃‍♂️ Running the Server

**Development Mode (with hot-reloading)**
```bash
npm run dev
```

**Production Mode**
1. Build the TypeScript source code:
```bash
npm run build
```
2. Start the compiled server:
```bash
npm run start
```

## 📚 API Documentation

Once the server is running, you can access the interactive Swagger UI documentation. By default, it is available at:
```text
http://localhost:8000/api-docs
```

## 🛠️ Additional Scripts

* **Run Tests**: `npm run test`
* **Test Coverage**: `npm run test:coverage`
* **Trigger PM Schedules**: `npm run pm:trigger` (Manually triggers the cron-job script that generates preventive maintenance work orders based on schedules)

## 📁 Project Structure

* `src/config/` - Global configurations (DB, Logger, Swagger)
* `src/controllers/` - Route handlers processing incoming requests
* `src/middleware/` - Express middlewares (Auth, Validation, Error Handling, Rate Limiting)
* `src/migrations/` - Sequelize migration files
* `src/models/` - Sequelize models representing database tables
* `src/repositories/` - Data Access Layer (DB query abstraction)
* `src/routes/` - Express API routing definitions
* `src/scripts/` - Seeding and cron execution scripts
* `src/services/` - Core business logic
* `src/validators/` - Zod schema definitions for request validation
