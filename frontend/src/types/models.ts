export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role?: Role;
  Role?: Role; // sometimes capitalized in the current code
  department?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  description?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  status: string;
  supplier_id?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  expected_life_years?: number;
  qr_code?: string;
  asset_tag?: string;
  is_active: boolean;
  parent_asset_id?: string;
  created_at?: string;
}

export interface WorkOrder {
  id: string;
  wo_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  asset_id?: string;
  asset?: Asset;
  location?: string;
  requester_id: string;
  creator?: User;
  assignee_id?: string;
  assignee?: User;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  address?: string;
  owner_name?: string;
  website_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inventory {
  id: string;
  name: string;
  part_number: string;
  description?: string;
  category?: string;
  location?: string;
  quantity: number;
  min_quantity?: number;
  unit_cost?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
