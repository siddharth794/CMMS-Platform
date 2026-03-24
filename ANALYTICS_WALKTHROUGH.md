# Analytics API Walkthrough

> **Purpose:** Complete reference for frontend developers building the Analytics page.
> Every endpoint, its exact response shape, query parameters, chart recommendations, and role-based access rules are documented here.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Common Query Parameters](#3-common-query-parameters)
4. [Role-Based Access Matrix](#4-role-based-access-matrix)
5. [Endpoint Reference](#5-endpoint-reference)
   - [5.1 Existing Dashboard](#51-existing-dashboard)
   - [5.2 Work Order Analytics](#52-work-order-analytics)
   - [5.3 Technician Performance](#53-technician-performance)
   - [5.4 PM Analytics](#54-pm-analytics)
   - [5.5 Inventory Analytics](#55-inventory-analytics)
   - [5.6 Asset Analytics](#56-asset-analytics)
   - [5.7 User Analytics](#57-user-analytics)
   - [5.8 Site Analytics](#58-site-analytics)
   - [5.9 Requestor Analytics](#59-requestor-analytics)
   - [5.10 Audit Analytics](#510-audit-analytics)
   - [5.11 Comprehensive Dashboard](#511-comprehensive-dashboard)
6. [Frontend Page Layouts by Role](#6-frontend-page-layouts-by-role)
7. [API Call Strategy](#7-api-call-strategy)
8. [Error Handling](#8-error-handling)

---

## 1. Architecture Overview

```
Frontend (React)  ──►  /api/analytics/*  ──►  Controller  ──►  Service  ──►  Repository  ──►  MySQL
                                                          │
                                              Parses auth token,
                                              extracts org_id, site_id,
                                              role, date filters
```

**Files modified:**

| File | Role |
|------|------|
| `src/repositories/analytics.repository.ts` | Raw SQL queries + Sequelize aggregations |
| `src/services/analytics.service.ts` | Data normalization, gap-filling, mapping |
| `src/controllers/analytics.controller.ts` | Request parsing, role/site extraction, response formatting |
| `src/routes/analytics.ts` | Route registration with `authenticate` + `requirePermission('analytics:view')` |

---

## 2. Authentication & Authorization

### How to call

Every request must include the JWT token:

```
GET /api/analytics/work-orders-trend
Authorization: Bearer <jwt_token>
```

### Permission required

| Endpoint | Permission | Who has it |
|----------|-----------|------------|
| `/dashboard` | _(none - authenticated only)_ | All roles |
| `/technician-dashboard` | _(none)_ | All roles |
| `/my-requests` | _(none)_ | All roles |
| All other endpoints | `analytics:view` | super_admin, org_admin, facility_manager |

### Role-based scoping (automatic)

The backend automatically scopes data based on the caller's role:

| Role | org_id filter | site_id filter | Notes |
|------|--------------|----------------|-------|
| **super_admin** | From `?org_id=` query param | From `?site_id=` query param | Must pass `org_id` explicitly |
| **org_admin** | From JWT token (their org) | From `?site_id=` query param (optional) | Sees all sites by default |
| **facility_manager** | From JWT token | Auto-set to their managed/assigned site | Can override with `?site_id=` |
| **technician** | From JWT token | Their site | Dashboard only |
| **requestor** | From JWT token | N/A | `/my-requests` only |

---

## 3. Common Query Parameters

All analytics endpoints support these optional query parameters where applicable:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `org_id` | UUID string | User's org | - | Super admin only - target organization |
| `site_id` | UUID string | Auto for managers | - | Filter to specific site |
| `start_date` | ISO date string | - | - | `2026-01-15` - filter created_at >= this |
| `end_date` | ISO date string | - | - | `2026-03-23` - filter created_at <= this |
| `months` | integer | 12 | 24 | For trend endpoints - how many months back |
| `days` | integer | 30 | 365 | For audit activity - how many days back |
| `limit` | integer | 10 | 50 | For ranking/table endpoints |

### URL construction examples

```
# Org admin, all sites, last 12 months
GET /api/analytics/work-orders-trend

# Org admin, specific site, last 6 months
GET /api/analytics/work-orders-trend?site_id=abc-123&months=6

# Super admin, specific org
GET /api/analytics/work-orders-trend?org_id=org-uuid-456

# With date range
GET /api/analytics/work-orders-by-site?start_date=2026-01-01&end_date=2026-03-31

# Top 20 assets
GET /api/analytics/top-assets?limit=20
```

---

## 4. Role-Based Access Matrix

| Endpoint | super_admin | org_admin | facility_manager | technician | requestor |
|----------|:-----------:|:---------:|:----------------:|:----------:|:---------:|
| `/dashboard` | All org | Own org | Own site | Own assigned | Own requests |
| `/technician-dashboard` | - | - | - | Own assigned | - |
| `/my-requests` | - | - | - | - | Own requests |
| `/work-orders-trend` | Via org_id | Own org | Own site | - | - |
| `/work-orders-by-site` | Via org_id | Own org | Own site | - | - |
| `/work-orders-by-category` | Via org_id | Own org | Own site | - | - |
| `/top-assets` | Via org_id | Own org | Own site | - | - |
| `/workload-by-day` | Via org_id | Own org | Own site | - | - |
| `/preventive-vs-reactive` | Via org_id | Own org | Own site | - | - |
| `/overdue-trend` | Via org_id | Own org | Own site | - | - |
| `/estimated-vs-actual` | Via org_id | Own org | Own site | - | - |
| `/site-comparison` | Via org_id | Own org | All sites | - | - |
| `/avg-resolution-time` | Via org_id | Own org | Own site | - | - |
| `/technician-performance` | Via org_id | Own org | Own site | - | - |
| `/pm-compliance` | Via org_id | Own org | Own site | - | - |
| `/pm-status` | Via org_id | Own org | Own site | - | - |
| `/inventory-stats` | Via org_id | Own org | Own site | - | - |
| `/inventory-top-parts` | Via org_id | Own org | Own site | - | - |
| `/inventory-by-category` | Via org_id | Own org | Own site | - | - |
| `/inventory-cost-trend` | Via org_id | Own org | All sites | - | - |
| `/asset-stats` | Via org_id | Own org | Own site | - | - |
| `/users-by-role` | Via org_id | Own org | - | - | - |
| `/user-growth` | Via org_id | Own org | - | - | - |
| `/site-technician-counts` | Via org_id | Own org | - | - | - |
| `/top-requesters` | Via org_id | Own org | Own site | - | - |
| `/audit-activity` | Via org_id | Own org | - | - | - |
| `/comprehensive` | Via org_id | Own org | Own site | - | - |

---

## 5. Endpoint Reference

---

### 5.1 Existing Dashboard

#### `GET /api/analytics/dashboard`

Returns the main dashboard stats. Behavior changes based on caller's role.

**Query params:** `start_date`, `end_date` (optional)

**Response for org_admin / facility_manager:**

```json
{
  "stats": {
    "total_work_orders": 342,
    "completed_work_orders": 198,
    "pending_work_orders": 45,
    "in_progress_work_orders": 67,
    "total_assets": 156,
    "active_pm_schedules": 23,
    "overdue_pms": 0,
    "completion_rate": 57.9
  },
  "wo_by_status": [
    { "status": "new", "count": 12 },
    { "status": "open", "count": 33 },
    { "status": "in_progress", "count": 67 },
    { "status": "on_hold", "count": 8 },
    { "status": "pending_review", "count": 15 },
    { "status": "completed", "count": 198 },
    { "status": "cancelled", "count": 9 }
  ],
  "wo_by_priority": [
    { "priority": "low", "count": 45 },
    { "priority": "medium", "count": 180 },
    { "priority": "high", "count": 89 },
    { "priority": "critical", "count": 28 }
  ],
  "recent_work_orders": [
    {
      "id": "uuid",
      "wo_number": "WO-20260001",
      "title": "Fix HVAC unit B2",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2026-03-22T10:30:00.000Z",
      "asset": { "id": "uuid", "name": "HVAC Unit B2", "asset_tag": "HVAC-001" },
      "assignee": { "id": "uuid", "first_name": "John", "last_name": "Doe", "Roles": [{ "name": "technician" }] },
      "requester": { "id": "uuid", "first_name": "Jane", "last_name": "Smith", "Roles": [{ "name": "requestor" }] }
    }
  ]
}
```

**Response for technician (auto-scoped to own assigned):**

```json
{
  "stats": {
    "total_work_orders": 28,
    "completed_work_orders": 15,
    "in_progress_work_orders": 5,
    "pending_work_orders": 6,
    "total_assets": 0,
    "active_pm_schedules": 0,
    "overdue_pms": 2,
    "completion_rate": 53.6,
    "my_assigned": 28,
    "my_completed": 15,
    "my_in_progress": 5,
    "my_pending": 6,
    "my_overdue": 2,
    "my_completion_rate": 53
  },
  "wo_by_status": [ ... ],
  "wo_by_priority": [ ... ],
  "recent_work_orders": [ ... ]
}
```

**Recommended charts:**
- 4x KPI stat cards (Total WOs, Completed, In Progress, Completion Rate %)
- Donut chart: WO by Status
- Donut chart: WO by Priority
- Table: Recent 10 Work Orders

---

#### `GET /api/analytics/technician-dashboard`

Identical to `/dashboard` but forces technician scoping. Kept for backward compatibility.

**Response:** Same as technician response above.

---

### 5.2 Work Order Analytics

---

#### `GET /api/analytics/work-orders-trend`

Monthly time series of WOs created vs completed.

**Query params:** `months` (default 12, max 24), `site_id` (optional)

**Request:**
```
GET /api/analytics/work-orders-trend?months=12
```

**Response:**

```json
[
  { "month": "2025-04", "created_count": 22, "completed_count": 18 },
  { "month": "2025-05", "created_count": 30, "completed_count": 25 },
  { "month": "2025-06", "created_count": 28, "completed_count": 27 },
  { "month": "2025-07", "created_count": 35, "completed_count": 30 },
  { "month": "2025-08", "created_count": 25, "completed_count": 28 },
  { "month": "2025-09", "created_count": 40, "completed_count": 32 },
  { "month": "2025-10", "created_count": 38, "completed_count": 35 },
  { "month": "2025-11", "created_count": 32, "completed_count": 30 },
  { "month": "2025-12", "created_count": 28, "completed_count": 26 },
  { "month": "2026-01", "created_count": 35, "completed_count": 33 },
  { "month": "2026-02", "created_count": 30, "completed_count": 28 },
  { "month": "2026-03", "created_count": 18, "completed_count": 12 }
]
```

**Key notes:**
- Always returns exactly `months` entries (gaps filled with 0)
- `month` format is `YYYY-MM`
- If `created_count > completed_count` consistently, backlog is growing

**Recommended chart:** Dual-line chart (Created vs Completed)

---

#### `GET /api/analytics/work-orders-by-site`

WO count broken down by site.

**Query params:** `start_date`, `end_date` (optional)

**Response:**

```json
[
  { "site_name": "Headquarters", "count": 145 },
  { "site_name": "Warehouse A", "count": 98 },
  { "site_name": "Factory Floor", "count": 67 },
  { "site_name": "Unassigned", "count": 32 }
]
```

**Recommended chart:** Vertical bar chart (sites on x-axis, count on y-axis)

---

#### `GET /api/analytics/work-orders-by-category`

WO count broken down by asset category.

**Query params:** `start_date`, `end_date` (optional)

**Response:**

```json
[
  { "category": "HVAC", "count": 89 },
  { "category": "Electrical", "count": 67 },
  { "category": "Plumbing", "count": 45 },
  { "category": "Conveyor", "count": 34 },
  { "category": "Uncategorized", "count": 12 }
]
```

**Recommended chart:** Vertical bar chart or horizontal bar chart

---

#### `GET /api/analytics/top-assets`

Assets with the most work orders (problematic assets).

**Query params:** `limit` (default 10, max 50), `site_id` (optional)

**Response:**

```json
[
  {
    "asset_id": "uuid-1",
    "asset_name": "HVAC Unit B2",
    "asset_tag": "HVAC-002",
    "category": "HVAC",
    "wo_count": 23
  },
  {
    "asset_id": "uuid-2",
    "asset_name": "Conveyor Belt #3",
    "asset_tag": "CONV-003",
    "category": "Conveyor",
    "wo_count": 18
  }
]
```

**Recommended chart:** Horizontal bar chart (asset names on y-axis, sorted descending)

---

#### `GET /api/analytics/workload-by-day`

WO count by day of week (MySQL DAYOFWEEK: 1=Sunday through 7=Saturday).

**Query params:** `site_id` (optional)

**Response:**

```json
[
  { "day": "Sunday", "day_number": 1, "count": 8 },
  { "day": "Monday", "day_number": 2, "count": 65 },
  { "day": "Tuesday", "day_number": 3, "count": 72 },
  { "day": "Wednesday", "day_number": 4, "count": 68 },
  { "day": "Thursday", "day_number": 5, "count": 58 },
  { "day": "Friday", "day_number": 6, "count": 52 },
  { "day": "Saturday", "day_number": 7, "count": 15 }
]
```

**Recommended chart:** Vertical bar chart (days on x-axis)

---

#### `GET /api/analytics/preventive-vs-reactive`

Ratio of PM-generated work orders vs manual/reactive ones.

**Query params:** `site_id`, `start_date`, `end_date` (all optional)

**Response:**

```json
{
  "preventive": 120,
  "reactive": 222
}
```

**Recommended chart:** Donut/Pie chart (Preventive vs Reactive)

**Insight:** Higher preventive ratio = better maintenance program health.

---

#### `GET /api/analytics/overdue-trend`

Monthly trend of overdue work orders (not completed/cancelled, past scheduled_end).

**Query params:** `months` (default 6, max 24), `site_id` (optional)

**Response:**

```json
[
  { "month": "2025-10", "count": 5 },
  { "month": "2025-11", "count": 8 },
  { "month": "2025-12", "count": 6 },
  { "month": "2026-01", "count": 10 },
  { "month": "2026-02", "count": 7 },
  { "month": "2026-03", "count": 4 }
]
```

**Key notes:**
- Always returns exactly `months` entries (gaps filled with 0)
- Declining trend = good. Rising trend = staffing/scheduling problem.

**Recommended chart:** Area chart (with red fill for emphasis)

---

#### `GET /api/analytics/estimated-vs-actual`

Scatter data comparing estimated hours vs actual hours for completed work orders.

**Query params:** `site_id` (optional)

**Response:**

```json
[
  {
    "id": "uuid",
    "wo_number": "WO-20260045",
    "title": "Replace motor bearings",
    "estimated_hours": 4,
    "actual_hours": 6,
    "priority": "high",
    "variance": 2
  },
  {
    "id": "uuid",
    "wo_number": "WO-20260038",
    "title": "Calibrate sensors",
    "estimated_hours": 2,
    "actual_hours": 2,
    "priority": "medium",
    "variance": 0
  }
]
```

**Key notes:**
- `variance = actual_hours - estimated_hours`
- Positive = took longer than expected. Negative = faster.
- Max 500 records returned (most recent completed)

**Recommended chart:** Scatter plot (x=estimated, y=actual). Draw a diagonal line y=x for reference. Points above the line = overruns.

---

#### `GET /api/analytics/site-comparison`

Multi-metric comparison across all sites (org_admin sees all sites).

**Query params:** `start_date`, `end_date` (optional)

**Response:**

```json
[
  {
    "site_id": "uuid-1",
    "site_name": "Headquarters",
    "total": 145,
    "completed": 98,
    "in_progress": 25,
    "pending": 15,
    "overdue": 7
  },
  {
    "site_id": "uuid-2",
    "site_name": "Warehouse A",
    "total": 98,
    "completed": 72,
    "in_progress": 12,
    "pending": 8,
    "overdue": 6
  }
]
```

**Recommended chart:** Grouped/stacked bar chart (one group per site, bars for completed/in_progress/pending/overdue)

---

#### `GET /api/analytics/avg-resolution-time`

Average time from `actual_start` to `actual_end` for completed work orders.

**Query params:** `site_id` (optional)

**Response:**

```json
{
  "avg_hours": 18.5
}
```

**Recommended display:** Large KPI number card (e.g., "18.5 hrs")

---

### 5.3 Technician Performance

---

#### `GET /api/analytics/technician-performance`

Per-technician work order statistics (leaderboard).

**Query params:** `site_id`, `start_date`, `end_date` (all optional)

**Response:**

```json
[
  {
    "technician_id": "uuid-1",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "total_assigned": 45,
    "completed": 38,
    "in_progress": 4,
    "overdue": 3,
    "completion_rate": 84.4
  },
  {
    "technician_id": "uuid-2",
    "first_name": "Sarah",
    "last_name": "Wilson",
    "email": "sarah@company.com",
    "total_assigned": 38,
    "completed": 35,
    "in_progress": 2,
    "overdue": 1,
    "completion_rate": 92.1
  }
]
```

**Recommended charts:**
- Horizontal bar chart: Completed WOs per technician (sorted)
- Table: Full breakdown with completion_rate as progress bar

---

### 5.4 PM Analytics

---

#### `GET /api/analytics/pm-compliance`

PM execution completion rate (are preventive tasks being done on time?).

**Query params:** `site_id` (optional)

**Response:**

```json
{
  "total": 85,
  "completed": 72,
  "skipped": 5,
  "generated": 8,
  "rate": 84.7
}
```

**Key notes:**
- `generated` = pending PM work orders (not yet done)
- `rate` = `completed / total * 100`
- `total = completed + skipped + generated`

**Recommended chart:** Gauge/progress ring showing `rate` (84.7%). Below it, show completed/skipped/generated breakdown as a donut.

---

#### `GET /api/analytics/pm-status`

Distribution of PM schedules by status.

**Query params:** `site_id` (optional)

**Response:**

```json
{
  "active": 18,
  "paused": 3,
  "inactive": 2
}
```

**Recommended chart:** Donut chart (Active / Paused / Inactive)

---

### 5.5 Inventory Analytics

---

#### `GET /api/analytics/inventory-stats`

Summary statistics for inventory.

**Query params:** `site_id` (optional)

**Response:**

```json
{
  "totalItems": 156,
  "totalQuantity": 4523,
  "lowStockCount": 12,
  "totalValue": 89450.75
}
```

**Key notes:**
- `lowStockCount` = items where `quantity <= min_quantity`
- `totalValue` = sum of `quantity * unit_cost` across all active items

**Recommended display:** 4 KPI cards (Total Items, Total Quantity, Low Stock Alerts, Total Value)

---

#### `GET /api/analytics/inventory-top-parts`

Most consumed parts across all work orders.

**Query params:** `limit` (default 10, max 50), `site_id` (optional)

**Response:**

```json
[
  {
    "inventory_item_id": "uuid-1",
    "name": "Ball Bearing 6205",
    "sku": "BB-6205",
    "category": "Bearings",
    "unit": "pcs",
    "total_used": 145
  },
  {
    "inventory_item_id": "uuid-2",
    "name": "Hydraulic Oil ISO 46",
    "sku": "HO-ISO46",
    "category": "Lubricants",
    "unit": "liters",
    "total_used": 89
  }
]
```

**Recommended chart:** Horizontal bar chart (part names on y-axis)

---

#### `GET /api/analytics/inventory-by-category`

Inventory items and quantity grouped by category.

**Query params:** `site_id` (optional)

**Response:**

```json
[
  { "category": "Bearings", "item_count": 23, "total_quantity": 580 },
  { "category": "Lubricants", "item_count": 12, "total_quantity": 245 },
  { "category": "Electrical", "item_count": 34, "total_quantity": 890 },
  { "category": "Fasteners", "item_count": 45, "total_quantity": 2100 }
]
```

**Recommended chart:** Grouped bar chart (item_count and total_quantity per category)

---

#### `GET /api/analytics/inventory-cost-trend`

Monthly cost of parts consumed on work orders.

**Query params:** `months` (default 12, max 24)

**Response:**

```json
[
  { "month": "2025-04", "total_cost": 1250.50 },
  { "month": "2025-05", "total_cost": 980.25 },
  { "month": "2025-06", "total_cost": 1560.00 },
  { "month": "2025-07", "total_cost": 890.75 },
  { "month": "2025-08", "total_cost": 1120.30 },
  { "month": "2025-09", "total_cost": 1450.00 },
  { "month": "2025-10", "total_cost": 1380.60 },
  { "month": "2025-11", "total_cost": 1020.45 },
  { "month": "2025-12", "total_cost": 750.20 },
  { "month": "2026-01", "total_cost": 1290.80 },
  { "month": "2026-02", "total_cost": 1100.55 },
  { "month": "2026-03", "total_cost": 650.30 }
]
```

**Recommended chart:** Line chart or area chart (monthly cost over time)

---

### 5.6 Asset Analytics

---

#### `GET /api/analytics/asset-stats`

Asset distribution by type and status.

**Query params:** `site_id` (optional)

**Response:**

```json
{
  "by_type": {
    "movable": 112,
    "immovable": 44
  },
  "by_status": [
    { "status": "active", "count": 130 },
    { "status": "inactive", "count": 15 },
    { "status": "under_maintenance", "count": 8 },
    { "status": "retired", "count": 3 }
  ]
}
```

**Recommended charts:**
- Donut chart: Movable vs Immovable
- Bar chart: Assets by Status

---

### 5.7 User Analytics

---

#### `GET /api/analytics/users-by-role`

User count per role.

**Response:**

```json
[
  { "role_name": "technician", "count": 12 },
  { "role_name": "requestor", "count": 25 },
  { "role_name": "facility_manager", "count": 3 },
  { "role_name": "org_admin", "count": 2 }
]
```

**Recommended chart:** Vertical bar chart

---

#### `GET /api/analytics/user-growth`

New users added per month.

**Query params:** `months` (default 12, max 24)

**Response:**

```json
[
  { "month": "2025-04", "count": 3 },
  { "month": "2025-05", "count": 5 },
  { "month": "2025-06", "count": 2 },
  { "month": "2025-07", "count": 0 },
  { "month": "2025-08", "count": 4 },
  { "month": "2025-09", "count": 6 },
  { "month": "2025-10", "count": 3 },
  { "month": "2025-11", "count": 1 },
  { "month": "2025-12", "count": 0 },
  { "month": "2026-01", "count": 2 },
  { "month": "2026-02", "count": 4 },
  { "month": "2026-03", "count": 1 }
]
```

**Recommended chart:** Line chart with area fill

---

### 5.8 Site Analytics

---

#### `GET /api/analytics/site-technician-counts`

Number of technicians assigned to each site.

**Response:**

```json
[
  { "site_id": "uuid-1", "site_name": "Headquarters", "technician_count": 5 },
  { "site_id": "uuid-2", "site_name": "Warehouse A", "technician_count": 3 },
  { "site_id": "uuid-3", "site_name": "Factory Floor", "technician_count": 4 }
]
```

**Recommended chart:** Bar chart

---

### 5.9 Requestor Analytics

---

#### `GET /api/analytics/my-requests`

Full dashboard for requestors showing their own submitted work orders.

**Query params:** `start_date`, `end_date` (optional)

**No permission required** - any authenticated user can access.

**Response:**

```json
{
  "stats": {
    "total_requests": 15,
    "completed": 8,
    "in_progress": 3,
    "pending": 4,
    "completion_rate": 53.3,
    "avg_resolution_hours": 24.5
  },
  "trend": [
    { "month": "2025-04", "count": 1 },
    { "month": "2025-05", "count": 2 },
    { "month": "2025-06", "count": 0 },
    { "month": "2025-07", "count": 1 },
    { "month": "2025-08", "count": 3 },
    { "month": "2025-09", "count": 2 },
    { "month": "2025-10", "count": 1 },
    { "month": "2025-11", "count": 0 },
    { "month": "2025-12", "count": 2 },
    { "month": "2026-01", "count": 1 },
    { "month": "2026-02", "count": 1 },
    { "month": "2026-03", "count": 1 }
  ],
  "wo_by_status": [
    { "status": "new", "count": 12 },
    { "status": "open", "count": 33 },
    { "status": "in_progress", "count": 67 },
    { "status": "on_hold", "count": 8 },
    { "status": "pending_review", "count": 15 },
    { "status": "completed", "count": 198 },
    { "status": "cancelled", "count": 9 }
  ],
  "wo_by_priority": [
    { "priority": "low", "count": 45 },
    { "priority": "medium", "count": 180 },
    { "priority": "high", "count": 89 },
    { "priority": "critical", "count": 28 }
  ]
}
```

**Key notes:**
- `trend` shows the requestor's own monthly submission count
- `wo_by_status` and `wo_by_priority` show the org-wide breakdown (for context)
- `avg_resolution_hours` = avg time from WO creation to `actual_end` for their completed WOs

**Recommended charts:**
- KPI cards: Total Requests, Completed, In Progress, Pending, Completion Rate %, Avg Resolution Hours
- Line chart: Monthly request trend
- Donut: WO by Status (org-wide context)
- Donut: WO by Priority

---

### 5.10 Audit Analytics

---

#### `GET /api/analytics/audit-activity`

Daily audit log activity (create/update/delete actions across the org).

**Query params:** `days` (default 30, max 365)

**Response:**

```json
[
  { "date": "2026-02-22", "count": 45 },
  { "date": "2026-02-23", "count": 38 },
  { "date": "2026-02-24", "count": 52 },
  { "date": "2026-02-25", "count": 12 },
  { "date": "2026-02-26", "count": 8 },
  { "date": "2026-02-27", "count": 41 },
  { "date": "2026-02-28", "count": 35 }
]
```

**Key notes:**
- `date` is `YYYY-MM-DD` format
- Days with no activity are NOT included (frontend should fill gaps)
- Weekend dips are normal

**Recommended chart:** Line chart (date on x-axis, count on y-axis)

---

### 5.11 Comprehensive Dashboard

---

#### `GET /api/analytics/comprehensive`

Single endpoint returning multiple analytics in one call (reduces HTTP round-trips).

**Query params:** `site_id`, `start_date`, `end_date` (all optional)

**Response:**

```json
{
  "avg_resolution_hours": 18.5,
  "pm_compliance": {
    "total": 85,
    "completed": 72,
    "skipped": 5,
    "generated": 8,
    "rate": 84.7
  },
  "pm_status": {
    "active": 18,
    "paused": 3,
    "inactive": 2
  },
  "preventive_vs_reactive": {
    "preventive": 120,
    "reactive": 222
  },
  "inventory_stats": {
    "totalItems": 156,
    "totalQuantity": 4523,
    "lowStockCount": 12,
    "totalValue": 89450.75
  },
  "assets_by_type": {
    "movable": 112,
    "immovable": 44
  }
}
```

**Use case:** Initial page load for analytics dashboard - fetches multiple KPIs in one request.

---

## 6. Frontend Page Layouts by Role

### 6.1 Org Admin / Super Admin - Full Analytics Page

```
┌─────────────────────────────────────────────────────────────┐
│  [Site Dropdown]  [Date Range Picker]  [Months: 6|12|24]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │Total WOs│ │Completed│ │In Prog  │ │Overdue  │ │Avg Res│ │
│ │  342    │ │  198    │ │   67    │ │   15    │ │18.5hrs│ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
├──────────────────────────┬──────────────────────────────────┤
│  WO Trend (Line Chart)   │  WO by Status (Donut)           │
│  Created vs Completed    │                                  │
├──────────────────────────┼──────────────────────────────────┤
│  WO by Site (Bar)        │  Preventive vs Reactive (Donut) │
├──────────────────────────┼──────────────────────────────────┤
│  Top Assets (H-Bar)      │  WO by Priority (Donut)         │
├──────────────────────────┼──────────────────────────────────┤
│  Technician Perf (Table) │  PM Compliance (Gauge)          │
├──────────────────────────┼──────────────────────────────────┤
│  Site Comparison (Stacked Bar)                              │
├──────────────────────────┬──────────────────────────────────┤
│  Overdue Trend (Area)    │  Workload by Day (Bar)          │
├──────────────────────────┼──────────────────────────────────┤
│  Est vs Actual (Scatter) │  WO by Category (Bar)           │
├──────────────────────────┼──────────────────────────────────┤
│  Inventory Stats         │  Top Used Parts (H-Bar)         │
│  4 KPI Cards             │                                  │
├──────────────────────────┼──────────────────────────────────┤
│  Inventory Cost Trend    │  Inventory by Category (Bar)    │
├──────────────────────────┼──────────────────────────────────┤
│  Asset Stats (Donut)     │  PM Status (Donut)              │
├──────────────────────────┼──────────────────────────────────┤
│  Users by Role (Bar)     │  User Growth (Line)             │
├──────────────────────────┼──────────────────────────────────┤
│  Site Tech Counts (Bar)  │  Top Requesters (Table)         │
├──────────────────────────┴──────────────────────────────────┤
│  Audit Activity (Line Chart)                                │
├─────────────────────────────────────────────────────────────┤
│  Recent Work Orders (Table - 10 rows)                       │
└─────────────────────────────────────────────────────────────┘
```

**API calls on page load:**

```typescript
// Optimized: Use /comprehensive for combined data, then fetch individual endpoints
const [dashboard, comprehensive, trend, bySite, topAssets, techPerf, siteComparison] = await Promise.all([
  GET('/api/analytics/dashboard'),
  GET('/api/analytics/comprehensive'),
  GET('/api/analytics/work-orders-trend?months=12'),
  GET('/api/analytics/work-orders-by-site'),
  GET('/api/analytics/top-assets?limit=10'),
  GET('/api/analytics/technician-performance'),
  GET('/api/analytics/site-comparison'),
]);
// Then lazy-load remaining charts on scroll
```

---

### 6.2 Facility Manager - Site Analytics Page

```
┌─────────────────────────────────────────────────────────────┐
│  [Date Range Picker]  [Months: 6|12|24]                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │My Site  │ │Completed│ │In Prog  │ │Overdue  │ │Avg Res│ │
│ │ WOs: 89 │ │   56    │ │   18    │ │   7     │ │16.2hrs│ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
├──────────────────────────┬──────────────────────────────────┤
│  WO Trend (Line Chart)   │  WO by Status (Donut)           │
├──────────────────────────┼──────────────────────────────────┤
│  Top Assets (H-Bar)      │  Preventive vs Reactive (Donut) │
├──────────────────────────┼──────────────────────────────────┤
│  Technician Perf (Table) │  PM Compliance (Gauge)          │
├──────────────────────────┼──────────────────────────────────┤
│  Overdue Trend (Area)    │  Workload by Day (Bar)          │
├──────────────────────────┼──────────────────────────────────┤
│  Est vs Actual (Scatter) │  WO by Category (Bar)           │
├──────────────────────────┼──────────────────────────────────┤
│  Inventory Stats (4 KPIs)│  Top Used Parts (H-Bar)         │
├──────────────────────────┼──────────────────────────────────┤
│  Inventory Cost Trend    │  Inventory by Category          │
├──────────────────────────┼──────────────────────────────────┤
│  Asset Stats (Donut)     │  PM Status (Donut)              │
├──────────────────────────┴──────────────────────────────────┤
│  Recent Work Orders (Table)                                 │
└─────────────────────────────────────────────────────────────┘
```

**Note:** All endpoints auto-filter to manager's site. No site dropdown needed (unless manager oversees multiple sites).

---

### 6.3 Technician - My Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  [Date Range Picker]                                         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │Assigned │ │Completed│ │In Prog  │ │Pending  │ │Overdue│ │
│ │   28    │ │   15    │ │    5    │ │    6    │ │   2   │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
├──────────────────────────┬──────────────────────────────────┤
│  Completion Rate: 53%    │  My WO by Priority (Donut)      │
│  (Gauge/Progress Ring)   │                                  │
├──────────────────────────┼──────────────────────────────────┤
│  My WO by Status (Donut) │  Recent Assigned WOs (Table)    │
└──────────────────────────┴──────────────────────────────────┘
```

**API calls:**
```
GET /api/analytics/dashboard  (auto-scoped to technician)
```

---

### 6.4 Requestor - My Requests Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  [Date Range Picker]                                         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │ Requests│ │Completed│ │In Prog  │ │ Pending │ │Avg Res│ │
│ │   15    │ │    8    │ │    3    │ │    4    │ │24.5hrs│ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
├──────────────────────────┬──────────────────────────────────┤
│  Completion Rate: 53%    │  WO by Priority (Donut)         │
│  (Gauge)                 │  (org-wide context)             │
├──────────────────────────┼──────────────────────────────────┤
│  My Request Trend (Line) │  WO by Status (Donut)           │
│  (last 12 months)        │  (org-wide context)             │
└──────────────────────────┴──────────────────────────────────┘
```

**API calls:**
```
GET /api/analytics/my-requests
```

---

## 7. API Call Strategy

### 7.1 Initial Page Load

For the main analytics page, use a parallel fetch strategy:

```typescript
// TypeScript / React example

interface AnalyticsData {
  dashboard: DashboardResponse;
  comprehensive: ComprehensiveResponse;
  woTrend: TrendItem[];
  woBySite: SiteItem[];
  topAssets: TopAssetItem[];
  techPerformance: TechPerfItem[];
  siteComparison: SiteComparisonItem[];
}

async function loadAnalyticsPage(filters: {
  siteId?: string;
  startDate?: string;
  endDate?: string;
  months?: number;
}): Promise<AnalyticsData> {
  const params = new URLSearchParams();
  if (filters.siteId) params.set('site_id', filters.siteId);
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  if (filters.months) params.set('months', String(filters.months));

  const qs = params.toString();
  const base = '/api/analytics';

  const [
    dashboard,
    comprehensive,
    woTrend,
    woBySite,
    topAssets,
    techPerformance,
    siteComparison,
  ] = await Promise.all([
    fetch(`${base}/dashboard?${qs}`).then(r => r.json()),
    fetch(`${base}/comprehensive?${qs}`).then(r => r.json()),
    fetch(`${base}/work-orders-trend?${qs}`).then(r => r.json()),
    fetch(`${base}/work-orders-by-site?${qs}`).then(r => r.json()),
    fetch(`${base}/top-assets?${qs}`).then(r => r.json()),
    fetch(`${base}/technician-performance?${qs}`).then(r => r.json()),
    fetch(`${base}/site-comparison?${qs}`).then(r => r.json()),
  ]);

  return { dashboard, comprehensive, woTrend, woBySite, topAssets, techPerformance, siteComparison };
}
```

### 7.2 Lazy Load Secondary Charts

Fetch these after the initial render (on scroll or tab switch):

```typescript
async function loadSecondaryCharts(qs: string) {
  const base = '/api/analytics';
  const [
    overdueTrend,
    workloadByDay,
    estimatedVsActual,
    woByCategory,
    inventoryTopParts,
    inventoryByCategory,
    inventoryCostTrend,
    pmCompliance,
    pmStatus,
    assetStats,
    usersByRole,
    userGrowth,
    topRequesters,
    auditActivity,
  ] = await Promise.all([
    fetch(`${base}/overdue-trend?${qs}`).then(r => r.json()),
    fetch(`${base}/workload-by-day?${qs}`).then(r => r.json()),
    fetch(`${base}/estimated-vs-actual?${qs}`).then(r => r.json()),
    fetch(`${base}/work-orders-by-category?${qs}`).then(r => r.json()),
    fetch(`${base}/inventory-top-parts?${qs}`).then(r => r.json()),
    fetch(`${base}/inventory-by-category?${qs}`).then(r => r.json()),
    fetch(`${base}/inventory-cost-trend?${qs}`).then(r => r.json()),
    fetch(`${base}/pm-compliance?${qs}`).then(r => r.json()),
    fetch(`${base}/pm-status?${qs}`).then(r => r.json()),
    fetch(`${base}/asset-stats?${qs}`).then(r => r.json()),
    fetch(`${base}/users-by-role?${qs}`).then(r => r.json()),
    fetch(`${base}/user-growth?${qs}`).then(r => r.json()),
    fetch(`${base}/top-requesters?${qs}`).then(r => r.json()),
    fetch(`${base}/audit-activity?${qs}`).then(r => r.json()),
  ]);

  return {
    overdueTrend, workloadByDay, estimatedVsActual, woByCategory,
    inventoryTopParts, inventoryByCategory, inventoryCostTrend,
    pmCompliance, pmStatus, assetStats, usersByRole, userGrowth,
    topRequesters, auditActivity,
  };
}
```

### 7.3 Filter Changes

When the user changes the site dropdown or date range, re-fetch all endpoints with updated query params. Use `AbortController` to cancel in-flight requests:

```typescript
const abortController = useRef<AbortController | null>(null);

function onFilterChange(newFilters: Filters) {
  // Cancel previous requests
  abortController.current?.abort();
  abortController.current = new AbortController();

  loadAnalyticsPage(newFilters, { signal: abortController.current.signal });
}
```

---

## 8. Error Handling

### HTTP Status Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| `200` | Success | Render data |
| `400` | Missing org_id | Show error: "Organization context required" |
| `401` | Invalid/expired token | Redirect to login |
| `403` | No `analytics:view` permission | Hide charts, show "Access denied" message |
| `500` | Server error | Show retry button with error toast |

### Error Response Shape

```json
{
  "detail": "Organization ID required"
}
```

### Empty Data Handling

All endpoints return arrays/objects even when no data exists:

| Endpoint | Empty state |
|----------|-------------|
| Trend endpoints | Array of objects with `count: 0` for each month |
| Grouped endpoints | Array with all categories, count may be 0 |
| Ranking endpoints | Empty array `[]` |
| KPI endpoints | `0` or `{ value: 0 }` |

Frontend should check array length / value before rendering charts. Show "No data available" placeholder when all values are 0.

---

## Appendix A: Chart Library Recommendations

| Chart Type | Library | Usage |
|-----------|---------|-------|
| Line / Area | Recharts `LineChart`, `AreaChart` | Trends over time |
| Bar / Horizontal Bar | Recharts `BarChart` | Comparisons |
| Donut / Pie | Recharts `PieChart` | Proportions |
| Scatter | Recharts `ScatterChart` | Est vs Actual |
| Gauge / Progress | Custom SVG or `recharts` custom | KPI rates |
| Table | React Table / TanStack Table | Rankings, lists |
| KPI Card | Custom component | Big number displays |

## Appendix B: Color Palette Suggestions

| Category | Suggested Colors |
|----------|-----------------|
| Status: new | `#94a3b8` (slate) |
| Status: open | `#3b82f6` (blue) |
| Status: in_progress | `#f59e0b` (amber) |
| Status: on_hold | `#8b5cf6` (violet) |
| Status: pending_review | `#06b6d4` (cyan) |
| Status: completed | `#22c55e` (green) |
| Status: cancelled | `#ef4444` (red) |
| Priority: low | `#22c55e` (green) |
| Priority: medium | `#f59e0b` (amber) |
| Priority: high | `#f97316` (orange) |
| Priority: critical | `#ef4444` (red) |
| Preventive | `#22c55e` (green) |
| Reactive | `#f97316` (orange) |
| Created trend | `#3b82f6` (blue) |
| Completed trend | `#22c55e` (green) |
| Overdue trend | `#ef4444` (red) |

---

## Appendix C: Complete Endpoint List (Quick Reference)

```
GET /api/analytics/dashboard                  → KPI stats + WO by status/priority + recent WOs
GET /api/analytics/technician-dashboard       → Technician-scoped dashboard
GET /api/analytics/work-orders-trend          → Monthly created vs completed
GET /api/analytics/work-orders-by-site        → WO count per site
GET /api/analytics/work-orders-by-category    → WO count per asset category
GET /api/analytics/top-assets                 → Top assets by WO count
GET /api/analytics/workload-by-day            → WO count per day of week
GET /api/analytics/preventive-vs-reactive     → PM-generated vs manual WOs
GET /api/analytics/overdue-trend              → Monthly overdue WO count
GET /api/analytics/estimated-vs-actual        → Hours variance per completed WO
GET /api/analytics/site-comparison            → Multi-metric per site
GET /api/analytics/avg-resolution-time        → Avg hours to complete
GET /api/analytics/technician-performance     → Per-technician WO stats
GET /api/analytics/pm-compliance              → PM execution completion rate
GET /api/analytics/pm-status                  → PM schedule active/paused/inactive
GET /api/analytics/inventory-stats            → Total items, quantity, low stock, value
GET /api/analytics/inventory-top-parts        → Most consumed parts
GET /api/analytics/inventory-by-category      → Items & quantity per category
GET /api/analytics/inventory-cost-trend       → Monthly parts cost
GET /api/analytics/asset-stats                → Assets by type & status
GET /api/analytics/users-by-role              → User count per role
GET /api/analytics/user-growth                → New users per month
GET /api/analytics/site-technician-counts     → Technicians per site
GET /api/analytics/top-requesters             → Top requesters by WO count
GET /api/analytics/audit-activity             → Daily audit log activity
GET /api/analytics/my-requests                → Requestor's own dashboard
GET /api/analytics/comprehensive              → Combined multi-analytics
```

**Total: 27 endpoints** (2 existing + 25 new)
