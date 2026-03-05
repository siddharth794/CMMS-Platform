# CMMS Platform — Frontend

React single-page application for the **Computerized Maintenance Management System (CMMS)** platform. Provides a modern, responsive UI for managing assets, work orders, preventive maintenance, inventory, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React](https://react.dev/) v19 |
| Build Tool | [Craco](https://github.com/dilanx/craco) (Create React App Configuration Override) |
| Routing | [React Router](https://reactrouter.com/) v7 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) v3 |
| UI Components | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Charts | [Recharts](https://recharts.org/) |
| HTTP Client | [Axios](https://axios-http.com/) |
| Real-time | [Socket.IO Client](https://socket.io/) v4 |
| Icons | [Lucide React](https://lucide.dev/) |
| Excel Import/Export | [SheetJS (xlsx)](https://sheetjs.com/) |
| Date Utilities | [date-fns](https://date-fns.org/) |
| Package Manager | Yarn |

## Prerequisites

- Node.js v18+
- Yarn (`npm install -g yarn` if not installed)
- Backend server running on `http://localhost:8000`

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
yarn install
```

> **Note:** Use `yarn`, not `npm install`. This project uses Yarn as its package manager.

### 2. Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 3. Start the Dev Server

```bash
yarn start
```

Opens **http://localhost:3000** in your browser with hot-reload enabled.

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn start` | Start dev server on port 3000 |
| `yarn build` | Production build → `build/` |
| `yarn test` | Run tests in watch mode |

## Application Pages

| Page | Path | Description |
|------|------|-------------|
| **Login** | `/login` | JWT-based authentication |
| **Dashboard** | `/` | Overview stats, recent work orders, charts (role-aware) |
| **Work Orders** | `/work-orders` | List, create, assign, filter, search, export to Excel |
| **Work Order Detail** | `/work-orders/:id` | Full lifecycle view, status updates, file attachments, parts tracking |
| **Assets** | `/assets` | Asset registry with CRUD, bulk Excel import |
| **Inventory** | `/inventory` | Stock management, low-stock alerts, stats cards |
| **PM Schedules** | `/pm-schedules` | Preventive maintenance scheduling |
| **Analytics** | `/analytics` | Charts and KPIs (work order trends, asset health, team performance) |
| **Settings** | `/settings` | User management, role assignment |

### Role-Based Views

- **Managers / Admins**: Full access to all pages and CRUD operations
- **Technicians**: Dedicated dashboard with assigned work orders and personal analytics
- **Requestors**: Personalized dashboard showing their submitted requests

## Key Features

- **Pagination** — Server-side pagination with "Showing X to Y of Z results" on Work Orders, Assets, and Inventory tables
- **Bulk Asset Import** — Upload Excel/CSV files to create assets in bulk
- **Work Order Export** — Export work orders list to `.xlsx` format
- **Real-time Notifications** — Socket.IO-powered live updates
- **Responsive Design** — Tailwind CSS responsive layouts for desktop and tablet
- **Dark Mode Support** — via `next-themes`

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, card, dialog, pagination, etc.)
│   │   ├── Layout.js         # App shell with sidebar navigation
│   │   ├── AssetsBulkUploadDialog.js
│   │   └── ...
│   ├── pages/                # Route-level page components
│   │   ├── DashboardPage.js
│   │   ├── WorkOrdersPage.js
│   │   ├── AssetsPage.js
│   │   ├── InventoryPage.js
│   │   ├── AnalyticsPage.js
│   │   ├── SettingsPage.js
│   │   └── ...
│   ├── context/              # React Context providers
│   │   ├── AuthContext.js    # JWT auth, user roles, login/logout
│   │   └── NotificationContext.js
│   ├── lib/
│   │   ├── api.js            # Axios API client definitions
│   │   └── utils.js          # Utility functions (cn, etc.)
│   ├── App.js                # Root component with routing
│   └── index.js              # Entry point
├── craco.config.js           # Craco/Tailwind configuration
├── tailwind.config.js
├── package.json
└── .env
```
