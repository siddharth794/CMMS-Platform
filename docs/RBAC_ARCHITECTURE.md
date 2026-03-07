# Spartans FMS - Role-Based Access Control (RBAC) Architecture

## Overview
Spartans FMS implements a highly granular, multi-tenant Role-Based Access Control (RBAC) system. The architecture supports complex enterprise requirements including:

- **Hierarchical Access**: Super Admins (Spartans Team) vs. Org Admins (Tenant Team).
- **Multi-Tenancy Isolation**: All tenant-created roles and access features are strictly isolated using the `org_id` boundary.
- **Many-to-Many Relationships**: Users can have multiple Roles, belong to multiple Groups, and Groups can inherit multiple Roles.
- **Granular Permissions**: Access is defined using distinct feature strings (e.g., `work_order:create`, `asset:delete`), which are grouped and assigned to Roles.

---

## Entity Relationships (Data Model)

The RBAC system introduces several core entities and mapping (junction) tables:

### Core Entities
1. **Accesses**: Represents a distinct capability within the system (e.g., `inventory:read`).
    *   *Columns*: `id`, `name`, `description`, `module`, `org_id` (Nullable), `is_system` (Boolean).
    *   *System vs. Custom*: If `is_system=true` and `org_id=null`, it is a globally available feature defined by Spartans. If `org_id` is populated, it is a custom feature created by an Org Admin for their tenant.
2. **Roles**: A collection of Accesses.
    *   *Columns*: `id`, `name`, `description`, `org_id` (Nullable), `is_system_role` (Boolean).
    *   *System vs. Custom*: Similar to Accesses, Roles can be default templates (System) or custom combinations created by a tenant.
3. **Groups**: Organizational units to bundle users together (e.g., "Maintenance Team Alpha").
    *   *Columns*: `id`, `name`, `description`, `org_id` (Always required).

### Junction Tables (Many-to-Many)
- **`role_accesses`**: Maps an Access to a Role.
- **`user_roles`**: Directly maps a Role to a User.
- **`user_groups`**: Maps a User to a Group.
- **`group_roles`**: Maps a Role to a Group. 

> **Crucial Concept - Effective Access**: A user's total capabilities are the combination of:
> 1. The Accesses tied to Roles assigned *directly* to them.
> 2. The Accesses tied to Roles assigned to *Groups* they belong to.

---

## The Authentication & Authorization Flow

### 1. Token Verification & DB Lookup
When an API request hits the backend, the `authenticate` middleware (located in `backend/src/middleware/auth.ts`):
1. Extracts and verifies the JSON Web Token (JWT).
2. Uses the `sub` or `id` from the payload to query the database.
3. Eager-loads the user's `Roles`, `Groups`, and nested `Accesses`.

### 2. Calculating "Effective Access"
Instead of forcing the application layer to resolve complex inherited permissions, the middleware flattens the hierarchy immediately:
1. It aggregates all `directRoles` and `groupRoles`.
2. It aggregates all underlying `Accesses` into a single `effectiveAccesses` array.
3. It attaches `req.user.effectiveRoles` and `req.user.effectiveAccesses` to the request object.

*Legacy Support*: The User model's `toJSON()` method ensures `user.Role` always points to their primary/first role so older frontend code (like `hasRole()`) does not break.

### 3. Applying Security Guards (Middleware)
Two distinct factory middlewares exist to protect endpoints:

#### `requireRole(roles: string[])`
Ensures the user has at least one of the exact Role names requested.
```typescript
// Example: Only super_admin or org_admin can hit this endpoint
router.post('/', requireRole(['super_admin', 'org_admin']), controller.create);
```

#### `requirePermission(permission: string)`
Ensures the user possesses the specific granular access string (e.g., `work_order:create`). Super Admins automatically bypass this check.
```typescript
// Example: Any user with the 'work_order:create' capability
router.post('/', requirePermission('work_order:create'), controller.create);
```

---

## Multi-Tenancy Rules

All Repositories and Services in the RBAC module (`role`, `access`, `group`) adhere to strict multi-tenant boundaries using `req.user.org_id`.

**Visibility Rule**:
When querying for Roles or Accesses, the repository searches for:
```javascript
where: {
    [Op.or]: [
        { org_id: req.user.org_id }, // Custom items belonging to this tenant
        { is_system: true }          // Global items provided by Spartans
    ]
}
```

**Modification Rule**:
Users (including Org Admins) **cannot** update or delete an entity where `is_system === true`. System entities are immutable globally to prevent tenants from breaking core platform functionalities.

---

## API Endpoints

The new RBAC system introduces several foundational API boundaries:

### Users & Profiles
*   `GET /api/users/me` - Fetch the current authenticated user profile.
*   `PUT /api/users/me` - Update personal info (first name, last name, phone).
*   `PUT /api/users/me/password` - Update password (requires validating old hash).
*   `PUT /api/users/:user_id/roles` - Directly attach/detach roles for a specific user.

### Roles
*   `GET /api/roles` - List System Roles + Tenant Custom Roles.
*   `POST /api/roles` - Create a new Custom Role (automatically scoped to `org_id`).
*   `PUT /api/roles/:role_id` - Update a Role name/description.
*   `DELETE /api/roles/:role_id` - Delete a Custom Role.
*   `PUT /api/roles/:role_id/accesses` - Provide an array of `access_ids` to bind granular permissions to a Role.

### Groups
*   `GET /api/groups` - List tenant Groups.
*   `POST /api/groups` - Create a new Group.
*   `PUT /api/groups/:group_id` - Update Group details.
*   `DELETE /api/groups/:group_id` - Delete a Group.
*   `PUT /api/groups/:group_id/members` - Provide an array of `user_ids` to assign to the Group.
*   `PUT /api/groups/:group_id/roles` - Provide an array of `role_ids` to map specific capabilities to the Group.

### Accesses
*   `GET /api/accesses` - List System Accesses + Tenant Custom Accesses.
*   `POST /api/accesses` - Create a new Custom Access (Super Admin/Org Admin only).
*   `PUT /api/accesses/:access_id` - Update Access.
*   `DELETE /api/accesses/:access_id` - Delete Custom Access.

---

## Frontend Integration

The frontend maps to these endpoints using centralized React Query hooks located in `frontend/src/hooks/api/useRBAC.ts`.

### Pages
*   `ProfilePage.tsx`: Self-serve area for updating user details and changing passwords.
*   `RolesPage.tsx`: Admin view for managing available Roles.
*   `GroupsPage.tsx`: Admin view for clustering users.
*   `AccessesPage.tsx`: View for defining explicit system capabilities.
