# CMMS Platform - Backend API

This repository contains the Node.js/TypeScript backend API for the CMMS (Computerized Maintenance Management System) Platform. It utilizes Express, Sequelize (MySQL), and Socket.IO.

## Prerequisites

Before setting up the backend, ensure you have the following installed on your machine:
*   **Node.js:** Version `20.x` or higher (Recommended: `v24.x`).
*   **MySQL:** A running MySQL server instance (Local or Cloud like AWS RDS).

---

## 🚀 Setup Guide for a Brand New Database

If you are setting up the project for the first time on a fresh database, follow these steps exactly:

### 1. Install Dependencies
Install all necessary packages, including development tools required for building the TypeScript code.
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of the `backend` directory.
```bash
cp .env.example .env
```
Open the `.env` file and fill in your database credentials:
```env
PORT=8000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=cmms_dev
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Build the Project
Compile the TypeScript code into executable JavaScript inside the `dist/` folder.
```bash
npm run build
```

### 4. Run Database Migrations
Migrations define your database schema. Running this command will automatically create all the necessary tables (users, roles, work_orders, etc.) inside your blank database.
```bash
npm run migrate
```
*(If you ever make a mistake and want to undo all tables and start over, you can run `npx sequelize-cli db:migrate:undo:all`)*

### 5. Seed Core System Data (Safe & Idempotent)
The system requires core roles (Super Admin, Facility Manager, etc.) and permissions to function. 
Run the seed script to safely insert this core data. This script is idempotent, meaning you can run it safely on production without overwriting existing data.
```bash
npm run seed
```
**What this does:**
1. Creates the base "CMMS Demo Org" organization.
2. Creates all system Access permissions.
3. Creates default Roles (`Super_Admin`, `Org_Admin`, `Facility_Manager`, `Technician`, `Requestor`).
4. Creates 5 default users attached to those roles (e.g., `admin@demo.com` with password `admin123`).

### 6. Seed Demo Data (Optional - For Development Only)
If you want to populate your system with dummy Assets, Inventory Items, and Work Orders to test the UI, run:
```bash
npm run seed:demo
```

### 7. Start the Server
Now that your database is fully structured and seeded, start the development server:
```bash
npm run dev
```
The server will start on `http://localhost:8000`. 
*   **Health Check:** `http://localhost:8000/health`
*   **Swagger API Docs:** `http://localhost:8000/api-docs`

---

## ☁️ Production Deployment Guide (Render)

If you are deploying this backend to a cloud host like **Render**, follow these exact settings to ensure successful builds and deployments.

**Important Note on Vercel:** Do *not* deploy this application to Vercel. Vercel is a Serverless platform and does not support long-running processes or Socket.IO (WebSockets), which are essential for this application's real-time AI features. Use Render, Heroku, or an AWS EC2/ECS instance.

### Render Service Configuration:
1.  **Environment:** `Node`
2.  **Build Command:** 
    ```bash
    npm install && npm run build
    ```
    *(This ensures TypeScript and `@types` are installed before compiling, preventing `MODULE_NOT_FOUND` errors).*
3.  **Start Command:**
    ```bash
    npm start
    ```
4.  **Health Check Path:** `/health`
5.  **Environment Variables:** Add `NODE_ENV=production`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`.

### Running Migrations in Production
Once your app is successfully deployed to Render, you must initialize the live database:
1. Go to your Render Web Service Dashboard.
2. Click the **Shell** tab.
3. Execute the migration and seed commands:
    ```bash
    npm run migrate
    npm run seed
    ```

---

## Commands Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the server in watch mode using `nodemon`. |
| `npm run build` | Compiles `.ts` files to `.js` in the `dist/` folder. |
| `npm start` | Runs the compiled server directly (Production). |
| `npm run migrate` | Runs Sequelize migrations to create tables. |
| `npm run migrate:undo` | Reverts the last run migration. |
| `npm run seed` | Seeds core organization, roles, permissions, and admin users. |
| `npm run seed:demo` | Seeds dummy assets, inventory, and work orders. |
