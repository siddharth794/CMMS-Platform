---
description: How to add new RBAC permissions, roles, or protect routes with access control
---
# RBAC & Permissions Workflow

## Overview
This project uses a granular RBAC system:
- **Users** → have **Roles** (via `user_roles` junction)
- **Users** → belong to **Groups** (via `user_groups` junction)
- **Groups** → have **Roles** (via `group_roles` junction)
- **Roles** → have **Accesses/Permissions** (via `role_accesses` junction)
- Effective permissions = direct role permissions + group role permissions

## Adding a New Permission

### Step 1: Add to permissions constant (`src/constants/permissions.ts`)
Add a new entry to the `PERMISSIONS` array:

```typescript
{ name: 'entity:action', module: 'Module Name', description: 'Human-readable description' }
```

Follow the naming convention: `<module>:<action>` (e.g., `asset:create`, `pm:update`, `area:manage`).

### Step 2: Map to roles in `DEFAULT_ROLE_PERMISSIONS`
Add the permission name to the appropriate role arrays:

```typescript
Org_Admin: [...existing, 'entity:view', 'entity:create', 'entity:update', 'entity:delete'],
Facility_Manager: [...existing, 'entity:view', 'entity:create'],
Technician: [...existing, 'entity:view'],
```

Note: `Super_Admin` uses `['*']` — automatically gets everything.

### Step 3: Use in routes
Protect routes with `requirePermission`:

```typescript
router.post('/', requirePermission('entity:create'), validate(schema), controller.create);
router.put('/:id', requirePermission('entity:update'), validate(schema), controller.update);
```

### Step 4: Update seed script
Re-run `npm run seed:all` to apply new permissions to existing demo roles.

## Two Types of Route Protection

### `requirePermission(permission)` — Granular (preferred)
Checks the user's effective accesses (from roles + groups). Super_Admin bypasses all checks.

```typescript
router.delete('/:id', requirePermission('asset:delete'), deleteAsset);
```

### `requireRole(roles[])` — Role-based (legacy)
Checks if the user has ANY of the listed roles. Use role constants from `src/constants/roles.ts`:

```typescript
import { MANAGER_ROLES, ALL_WO_ROLES } from '../constants/roles';
router.post('/', requireRole(MANAGER_ROLES), createAsset);
```

**Prefer `requirePermission` over `requireRole` for new code.**

## Adding a New System Role

### Step 1: Create a migration
Generate a migration that inserts the role and maps its accesses:

```bash
npx sequelize-cli migration:generate --name add-new-role
```

### Step 2: Insert role and map permissions
Use raw SQL in the migration (see `20260409044616-add-cleaning-staff-role.js` as an example):
- Insert role WITHOUT specifying `id` (INTEGER AUTO_INCREMENT)
- Query back the inserted ID
- Insert into `role_accesses` junction table

### Step 3: Update constants
Add the role to `src/constants/roles.ts` and `src/constants/permissions.ts`.

### Step 4: Update seed script
Add the role to `seed-all.ts` and `seed.ts`.
