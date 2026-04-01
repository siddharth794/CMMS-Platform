/**
 * Centralized System Permissions Dictionary
 * Defines all possible actions a user can take across different modules.
 */

export const PERMISSIONS = [
  // Work Orders Module
  { name: 'work_order:view', module: 'Work Orders', description: 'View work orders' },
  { name: 'work_order:create', module: 'Work Orders', description: 'Create new work orders' },
  { name: 'work_order:update', module: 'Work Orders', description: 'Update existing work orders' },
  { name: 'work_order:delete', module: 'Work Orders', description: 'Delete work orders' },
  { name: 'work_order:assign', module: 'Work Orders', description: 'Assign work orders to technicians' },
  
  // Assets Module
  { name: 'asset:view', module: 'Assets', description: 'View asset details and list' },
  { name: 'asset:create', module: 'Assets', description: 'Add new assets to the system' },
  { name: 'asset:update', module: 'Assets', description: 'Update asset specifications' },
  { name: 'asset:delete', module: 'Assets', description: 'Remove assets from the system' },
  
  // Inventory Module
  { name: 'inventory:view', module: 'Inventory', description: 'View inventory items and stock levels' },
  { name: 'inventory:create', module: 'Inventory', description: 'Add new inventory items' },
  { name: 'inventory:update', module: 'Inventory', description: 'Update stock levels and details' },
  { name: 'inventory:delete', module: 'Inventory', description: 'Delete inventory items' },
  
  // Preventative Maintenance (PM) Module
  { name: 'pm:view', module: 'PM Schedules', description: 'View preventative maintenance schedules' },
  { name: 'pm:create', module: 'PM Schedules', description: 'Create PM schedules' },
  { name: 'pm:update', module: 'PM Schedules', description: 'Modify existing PM schedules' },
  { name: 'pm:delete', module: 'PM Schedules', description: 'Delete PM schedules' },

  // Users & RBAC Module
  { name: 'user:view', module: 'Users & Security', description: 'View users, roles, and groups' },
  { name: 'user:create', module: 'Users & Security', description: 'Create new users' },
  { name: 'user:update', module: 'Users & Security', description: 'Update user details and roles' },
  { name: 'user:delete', module: 'Users & Security', description: 'Deactivate or delete users' },
  { name: 'rbac:manage', module: 'Users & Security', description: 'Manage roles, accesses, and groups' },

  // Organization Module
  { name: 'organization:view', module: 'Organization', description: 'View organization details' },
  { name: 'organization:update', module: 'Organization', description: 'Update organization settings' },
  
  // Analytics Module
  { name: 'analytics:view', module: 'Analytics', description: 'View dashboards and reports' },

  // Checklists Module
  { name: 'checklist:manage', module: 'Checklists', description: 'Create and edit checklist templates' },
  { name: 'checklist:execute', module: 'Checklists', description: 'Check off items on work order checklists' }
];

/**
 * Mapping of which default roles get which permissions initially
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Super_Admin: ['*'], // Super Admin automatically gets everything
  Org_Admin: [
    'work_order:view', 'work_order:create', 'work_order:update', 'work_order:delete', 'work_order:assign',
    'asset:view', 'asset:create', 'asset:update', 'asset:delete',
    'inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete',
    'pm:view', 'pm:create', 'pm:update', 'pm:delete',
    'user:view', 'user:create', 'user:update', 'user:delete', 'rbac:manage',
    'organization:view', 'organization:update',
    'analytics:view',
    'checklist:manage', 'checklist:execute'
  ],
  Facility_Manager: [
    'work_order:view', 'work_order:create', 'work_order:update', 'work_order:delete', 'work_order:assign',
    'asset:view', 'asset:create', 'asset:update',
    'inventory:view', 'inventory:create', 'inventory:update',
    'pm:view', 'pm:create', 'pm:update',
    'user:view',
    'analytics:view',
    'checklist:manage', 'checklist:execute'
  ],
  Technician: [
    'work_order:view', 'work_order:update',
    'asset:view',
    'inventory:view', 'inventory:update',
    'checklist:execute'
  ],
  Requestor: [
    'work_order:view', 'work_order:create',
    'asset:view',
    'checklist:execute'
  ]
};
