export const WO_STATUS = {
  NEW: 'new',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const WO_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  FACILITY_MANAGER: 'facility_manager',
  TECHNICIAN: 'technician',
  REQUESTER: 'requestor', // or 'requester' based on the system
} as const;

export const ASSET_STATUS = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  BROKEN: 'broken',
  RETIRED: 'retired',
} as const;
