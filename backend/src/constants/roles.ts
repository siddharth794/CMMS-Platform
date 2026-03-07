/**
 * Centralized RBAC Role Constants
 * Single source of truth for all role-based access control.
 * All comparisons are done in lowercase via requireRole() middleware.
 */

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ORG_ADMIN: 'org_admin',
    FACILITY_MANAGER: 'facility_manager',
    TECHNICIAN: 'technician',
    REQUESTOR: 'requestor',
} as const;

/** Super Admin + Org Admin */
export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN];

/** Admin roles + Facility Manager */
export const MANAGER_ROLES = [...ADMIN_ROLES, ROLES.FACILITY_MANAGER];

/** All operational roles that can create/interact with Work Orders */
export const ALL_WO_ROLES = [...MANAGER_ROLES, ROLES.TECHNICIAN, ROLES.REQUESTOR];

export type RoleName = typeof ROLES[keyof typeof ROLES];
