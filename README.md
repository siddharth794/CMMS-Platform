# CMMS Platform

A full-stack **Computerized Maintenance Management System** built for managing assets, work orders, preventive maintenance, inventory, and team operations — with real-time notifications and role-based access control.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.x or higher (v20.x recommended)
- **Database**: MySQL 8.0
- **Docker**: Optional (for running MySQL locally)

### 2. Initial Setup
```bash
# Clone the repository
git clone <repo-url>
cd CMMS-Platform

# Start MySQL via Docker (if required)
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Configure your DB credentials & JWT_SECRET
npm run setup           # Run migrations AND seed demo data in one command
npm run dev             # Start backend on http://localhost:8000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm start                # Start frontend on http://localhost:3000
```

### 5. Login
Use the default admin credentials:
- **Email**: `admin@demo.com`
- **Password**: `admin123`

---

## 📚 Documentation

For detailed information, please refer to the following guides:

- 🛠️ **[User & Functional Manual](./FUNCTIONALITIES.md)**: Features, Workflows, and User Guides.
- ⚙️ **[Backend Developer Manual](./backend/BACKEND_MANUAL.md)**: Architecture, API design, and Database schema.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, React Router, Axios, Recharts, Socket.IO Client |
| **Backend** | Node.js, Express 5, TypeScript, Sequelize 6, Socket.IO |
| **Database** | MySQL 8.0 |
| **Security** | JWT, bcryptjs, Helmet, Zod validation |
| **Dev Tools** | nodemon, ts-node, ESLint |

---

## 🏗️ Repository Structure

```
CMMS-Platform/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── routes/             # API Endpoints
│   │   ├── controllers/        # Request handling
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access
│   │   ├── models/             # DB schema
│   │   └── server.ts           # Entry point
│   └── BACKEND_MANUAL.md       # Technical docs
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/              # UI Pages
│   │   └── components/         # UI Elements
├── docs/                       # Archive (to be cleared)
├── FUNCTIONALITIES.md          # User & Features manual
└── README.md                   # Main entry point
```

---

## 📄 License
ISC
