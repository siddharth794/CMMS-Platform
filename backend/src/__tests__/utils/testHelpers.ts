import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../../types/express.d';

export const JWT_SECRET = process.env.JWT_SECRET_KEY || 'test-secret-key';

export const generateToken = (payload: object, expiresIn: string = '24h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
};

export const generateExpiredToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' as any });
};

export const mockAuthenticatedUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'user-123',
  org_id: 'org-123',
  email: 'test@example.com',
  username: 'testuser',
  is_active: true,
  role_id: 1,
  Role: { id: 1, name: 'admin' },
  ...overrides,
});

export const mockAdminUser = () => mockAuthenticatedUser({ Role: { id: 1, name: 'admin' } });
export const mockManagerUser = () => mockAuthenticatedUser({ Role: { id: 2, name: 'manager' } });
export const mockTechnicianUser = () => mockAuthenticatedUser({ Role: { id: 3, name: 'technician' } });
export const mockRequesterUser = () => mockAuthenticatedUser({ Role: { id: 4, name: 'requester' } });

export const createMockUser = (overrides: any = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password_hash: 'hashed_password',
  is_active: true,
  org_id: 'org-123',
  role_id: 'role-1',
  last_login: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  Role: { id: 'role-1', name: 'admin' },
  Organization: { id: 'org-123', name: 'Test Org' },
  ...overrides,
});

export const createMockWorkOrder = (overrides: any = {}) => ({
  id: 'wo-123',
  title: 'Test Work Order',
  description: 'Test description',
  status: 'pending',
  priority: 'medium',
  site_id: 'site-123',
  asset_id: 'asset-123',
  assignee_id: 'user-456',
  requester_id: 'user-789',
  org_id: 'org-123',
  estimated_hours: 2,
  actual_hours: 0,
  resolution_notes: null,
  created_at: new Date(),
  updated_at: new Date(),
  Site: { id: 'site-123', name: 'Test Site' },
  Asset: { id: 'asset-123', name: 'Test Asset' },
  Assignee: { id: 'user-456', first_name: 'Jane', last_name: 'Smith' },
  Requester: { id: 'user-789', first_name: 'Bob', last_name: 'Wilson' },
  ...overrides,
});

export const createMockAsset = (overrides: any = {}) => ({
  id: 'asset-123',
  name: 'Test Asset',
  asset_tag: 'AST-001',
  serial_number: 'SN-12345',
  status: 'active',
  site_id: 'site-123',
  org_id: 'org-123',
  category: 'equipment',
  criticality: 'medium',
  install_date: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  Site: { id: 'site-123', name: 'Test Site' },
  ...overrides,
});

export const createMockInventory = (overrides: any = {}) => ({
  id: 'inv-123',
  name: 'Test Part',
  sku: 'SKU-001',
  quantity: 10,
  unit: 'pcs',
  min_quantity: 5,
  unit_cost: 25.00,
  category: 'parts',
  site_id: 'site-123',
  org_id: 'org-123',
  location: 'Warehouse A',
  created_at: new Date(),
  updated_at: new Date(),
  Site: { id: 'site-123', name: 'Test Site' },
  ...overrides,
});

export const createMockSite = (overrides: any = {}) => ({
  id: 'site-123',
  name: 'Test Site',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  country: 'US',
  zip_code: '12345',
  org_id: 'org-123',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  Organization: { id: 'org-123', name: 'Test Org' },
  ...overrides,
});

export const createMockOrganization = (overrides: any = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  slug: 'test-org',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockRole = (overrides: any = {}) => ({
  id: 'role-1',
  name: 'admin',
  description: 'Administrator role',
  org_id: 'org-123',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockPMSchedule = (overrides: any = {}) => ({
  id: 'pm-123',
  title: 'Test PM Schedule',
  asset_id: 'asset-123',
  site_id: 'site-123',
  frequency_type: 'monthly',
  frequency_value: 1,
  next_due_date: new Date(),
  last_completed_date: null,
  status: 'active',
  org_id: 'org-123',
  created_at: new Date(),
  updated_at: new Date(),
  Asset: { id: 'asset-123', name: 'Test Asset' },
  Site: { id: 'site-123', name: 'Test Site' },
  ...overrides,
});

export const createPaginatedResponse = <T>(items: T[], total: number, page: number = 1, limit: number = 10) => ({
  rows: items,
  count: total,
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  limit,
});