# CMMS Platform - Backend

This is the Node.js Express backend for the CMMS (Computerized Maintenance Management System) Platform.

## Tech Stack

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database**: [MySQL](https://www.mysql.com/)
*   **ORM**: [Sequelize](https://sequelize.org/)
*   **Authentication**: JSON Web Tokens (JWT)

## Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   Docker and Docker Compose (optional, for running the MySQL database locally)

## Getting Started

### 1. Start the Database

If you don't have a local MySQL instance running, you can use the provided `docker-compose.yml` file in the root of the project to spin up a MySQL container.

```bash
# Run this from the project root directory
docker compose up -d
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory. You can use the following variables as a template:

```env
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=cmms
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Install Dependencies

Navigate to the `backend` directory and install the necessary dependencies:

```bash
cd backend
npm install
```

### 4. Running the Development Server

Start the development server using `nodemon` and `ts-node`:

```bash
npm run dev
```

The server will be running on `http://localhost:8000` (or whatever port you specified in `.env`). The database tables will be automatically synchronized with Sequelize's `sync({ alter: true })` feature.

### 5. Seeding the Database

To populate the database with initial dummy data (organizations, roles, users, assets, work orders, etc.), run the seed script:

```bash
npm run seed
```

## Available Scripts

*   `npm run dev`: Starts the server in watch mode using `nodemon` for development.
*   `npm run build`: Compiles the TypeScript code into JavaScript in the `dist` folder.
*   `npm start`: Runs the compiled JavaScript server from the `dist` folder.
*   `npm run seed`: Seeds the database with sample initial data.

## API Structure

The backend features a RESTful API structure under the `/api` prefix, including:

*   `/api/auth` - Authentication and login.
*   `/api/users` - User management.
*   `/api/organizations` - Organization management.
*   `/api/roles` - Role management.
*   `/api/assets` - Asset management.
*   `/api/work-orders` - Work order creation and tracking.
*   `/api/pm-schedules` - Preventive maintenance scheduling.
*   `/api/inventory` - Inventory tracking.
