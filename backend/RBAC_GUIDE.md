# Role-Based Access Control (RBAC) - Developer Guide

This document explains the Role-Based Access Control (RBAC) and permission system implemented in the CMMS backend. It is designed to help engineers understand how authentication, roles, groups, and fine-grained permissions interact, and how to secure new API endpoints.

---

## 1. Core Concepts

The RBAC system is built on a relational hierarchy to allow both high-level role checks and granular permission-based checks. It supports multi-tenancy natively; all roles and permissions exist within the context of a specific Organization (`org_id`).

### Entity Breakdown

1. **User:** An individual account associated with an Organization.
2. **Access (Permission):** A specific, granular capability (e.g., `create_work_order`, `delete_asset`).
3. **Role:** A named collection of Accesses (e.g., `Manager`, `Technician`).
4. **Group:** A logical collection of Users and Roles. A user in a group inherits all roles assigned to that group.

### How "Effective Roles" Are Calculated

When a user logs in, the `auth.ts` middleware intercepts the JWT and calculates the user's **Effective Roles** and **Effective Accesses**.

`Effective Roles = (Roles directly assigned to the User) + (Roles assigned to any Groups the User belongs to)`

The system merges these automatically so that downstream controllers and services don't have to query the database repeatedly.

---

## 2. The Authentication Middleware

The `authenticate` middleware (in `src/middleware/auth.ts`) is the entry point for RBAC. It decodes the JWT, finds the user in the database, eagerly loads their Roles, Groups, and Accesses, and attaches a robust `user` object to the Express Request (`req.user`).

```typescript
// Inside src/middleware/auth.ts
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // 1. Verify JWT
    // 2. Fetch User along with Roles, Groups, and Accesses
    // 3. Compute 'effectiveRoles' (Direct + Group Inherited)
    // 4. Compute 'effectiveAccesses' (Flattened list of all permissions)
    
    req.user = {
        ...userJSON,
        effectiveRoles: [...],      // Array of Role objects
        effectiveAccesses: [...]    // Array of Access (Permission) objects
    };
    next();
};
```

---

## 3. Securing Endpoints: Two Approaches

The backend provides two distinct middleware functions to protect routes.

### Approach A: Broad Role-Based Checks (`requireRole`)

Use this when you want to restrict an endpoint to high-level system personas (e.g., "Only Managers and Admins can do this").

**Import the middleware and role constants:**
```typescript
import { requireRole } from '../middleware/auth';
import { MANAGER_ROLES, ALL_WO_ROLES } from '../constants/roles'; 
// MANAGER_ROLES = ['super_admin', 'org_admin', 'manager']
```

**Apply it to the Express Route:**
```typescript
// src/routes/workOrders.ts
const router = Router();
router.use(authenticate); // Must run first!

// Restrict deleting a Work Order to Manager roles
router.delete('/:wo_id', requireRole(MANAGER_ROLES), workOrderController.delete);
```

**How it works:**
The middleware checks if the user's `effectiveRoles` array contains any of the role names provided in the `MANAGER_ROLES` array. If not, it returns a `403 Forbidden`.

### Approach B: Granular Permission Checks (`requirePermission`)

Use this for complex scenarios where roles are highly customizable, and you need to ensure the user has the exact database-driven capability (e.g., "User must explicitly have the `delete_asset` permission, regardless of what their role name is").

**Apply it to the Express Route:**
```typescript
import { requirePermission } from '../middleware/auth';

const router = Router();
router.use(authenticate); // Must run first!

// Restrict deleting an Asset to users with explicit permission
router.delete('/:asset_id', requirePermission('delete_asset'), assetController.delete);
```

**How it works:**
1. The middleware checks if the exact string `'delete_asset'` exists in the user's `req.user.effectiveAccesses` array.
2. *Exception:* If the user has a role named `super_admin`, the middleware automatically bypasses the granular check and grants access.

---

## 4. Using RBAC Context in Services

Sometimes, protecting the route isn't enough; the business logic itself needs to behave differently depending on the user's role.

Because the `authenticate` middleware attaches `req.user`, you can extract the role and pass it down to your Services.

### Example: Filtering Work Orders by Role

If a Technician requests a list of work orders, they should only see the ones assigned to them. If a Manager requests the list, they should see all of them for the organization.

**1. Controller extracts the role:**
```typescript
// src/controllers/workOrder.controller.ts
getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Look at the primary role
    const roleName = req.user!.effectiveRoles[0]?.name?.toLowerCase() || '';
    
    // Pass roleName to the service
    const result = await workOrderService.getAll(
        req.user!.org_id, 
        req.user!.id, 
        roleName, 
        req.query
    );
    res.json(result);
}
```

**2. Service adjusts the DB Query:**
```typescript
// src/services/workOrder.service.ts
async getAll(orgId: string, userId: string, roleName: string, query: any): Promise<any> {
    let where: any = { org_id: orgId };

    // Apply strict filtering if the user is a Technician
    if (roleName === 'technician') {
        where.assignee_id = userId; 
    }
    // Apply strict filtering if the user is a Requester
    else if (['requestor', 'requester'].includes(roleName)) {
        where.requester_id = userId;
    }

    // (Managers and Admins bypass these checks and see everything for the org_id)

    return workOrderRepository.findAndCountAll({ where });
}
```

---

## 5. Summary Checklist for Adding New Features

1. **Define the Route:** Add your new endpoint in `src/routes/`.
2. **Apply Auth:** Ensure `router.use(authenticate);` is executed before your endpoint.
3. **Determine Protection Level:**
   - Are you restricting to broad personas? Use `requireRole(['manager', 'admin'])`.
   - Are you restricting to specific capabilities? Use `requirePermission('my_new_permission')`.
4. **Pass Context Down:** In your controller, pass `req.user.org_id` and `req.user.id` to your Service to ensure data is strictly scoped to the tenant (Organization) and the specific action is auditable.
5. **Adjust Logic:** If the feature behavior changes based on who is asking, extract `req.user.effectiveRoles[0]?.name` and pass it to your service to conditionally build your database queries.