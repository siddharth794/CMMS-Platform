import { User, Asset, WorkOrder, Organization, Site, Role, Inventory } from '../../types/models';

export const mockUser: User = {
  id: '1',
  email: 'admin@demo.com',
  first_name: 'John',
  last_name: 'Doe',
  role_id: '1',
  role: { id: '1', name: 'super_admin', description: 'Super Admin' },
  department: 'IT',
  is_active: true,
  site_id: '1',
  site: null,
  org_id: '1',
  Organization: { id: '1', name: 'Demo Organization', is_active: true },
  created_at: '2024-01-01T00:00:00Z',
};

export const mockTechnician: User = {
  id: '2',
  email: 'tech@demo.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role_id: '2',
  role: { id: '2', name: 'technician', description: 'Technician' },
  department: 'Maintenance',
  is_active: true,
  site_id: '1',
  org_id: '1',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockRequester: User = {
  id: '3',
  email: 'request@demo.com',
  first_name: 'Bob',
  last_name: 'Wilson',
  role_id: '3',
  role: { id: '3', name: 'requestor', description: 'Requestor' },
  department: 'Operations',
  is_active: true,
  site_id: '1',
  org_id: '1',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockOrganization: Organization = {
  id: '1',
  name: 'Demo Organization',
  description: 'Demo organization for testing',
  address: '123 Main St',
  owner_name: 'John Doe',
  website_url: 'https://demo.com',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockSite: Site = {
  id: '1',
  name: 'Main Facility',
  org_id: '1',
  manager_id: '1',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  country: 'USA',
  phone: '555-1234',
  description: 'Main facility location',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  manager: mockUser,
  technicians: [mockTechnician],
};

export const mockAsset: Asset = {
  id: '1',
  name: 'HVAC System',
  asset_type: 'equipment',
  category: 'HVAC',
  serial_number: 'SN-12345',
  status: 'operational',
  supplier_id: '1',
  purchase_date: '2023-01-01',
  purchase_cost: '5000',
  warranty_expiry: '2026-01-01',
  expected_life_years: 10,
  qr_code: 'QR-001',
  asset_tag: 'AST-001',
  is_active: true,
  parent_asset_id: null,
  site_id: '1',
  site: mockSite,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockWorkOrder: WorkOrder = {
  id: '1',
  wo_number: 'WO-001',
  title: 'Fix HVAC System',
  description: 'HVAC system needs maintenance',
  status: 'open',
  priority: 'high',
  asset_id: '1',
  asset: mockAsset,
  location: 'Building A',
  requester_id: '3',
  creator: mockRequester,
  assignee_id: '2',
  assignee: mockTechnician,
  due_date: '2024-12-31',
  completed_at: null,
  estimated_hours: 4,
  actual_hours: null,
  is_active: true,
  resolution_notes: null,
  site_id: '1',
  site: mockSite,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockInventory: Inventory = {
  id: '1',
  name: 'Air Filter',
  part_number: 'AF-001',
  description: 'HVAC air filter',
  category: 'HVAC Parts',
  location: 'Storage Room A',
  quantity: 50,
  min_quantity: 10,
  unit_cost: 25.99,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockRole: Role = {
  id: '1',
  name: 'super_admin',
  description: 'Super Administrator',
};

export const mockDashboardData = {
  stats: {
    total_work_orders: 25,
    in_progress_work_orders: 5,
    completed_work_orders: 15,
    pending_work_orders: 5,
    overdue_pms: 2,
    total_assets: 50,
    active_pm_schedules: 10,
    completion_rate: 75,
  },
  wo_by_status: [
    { status: 'new', count: 5 },
    { status: 'open', count: 5 },
    { status: 'in_progress', count: 5 },
    { status: 'completed', count: 15 },
  ],
  wo_by_priority: [
    { priority: 'low', count: 5 },
    { priority: 'medium', count: 10 },
    { priority: 'high', count: 8 },
    { priority: 'critical', count: 2 },
  ],
  recent_work_orders: [mockWorkOrder],
};

export const mockPaginatedResponse = <T>(items: T[], total = items.length) => ({
  data: items,
  total,
});

export const createMockAuthState = (overrides?: Partial<{ user: User | null; token: string | null }>) => ({
  user: mockUser,
  token: 'mock-jwt-token',
  ...overrides,
});

export const waitForLoadingToFinish = async () =>
  new Promise((resolve) => setTimeout(resolve, 100));
