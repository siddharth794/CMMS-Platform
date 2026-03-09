// ─── Auth DTOs ────────────────────────────────────────────────────
export interface LoginDTO {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: any; // Full Sequelize user instance for backward compat
}

// ─── User DTOs ────────────────────────────────────────────────────
export interface CreateUserDTO {
    email: string;
    password: string;
    role_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    org_id?: string;
}

export interface UpdateUserDTO {
    role_id?: number;
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    password?: string;
    is_active?: boolean;
}

export interface UserListQuery {
    skip?: number;
    limit?: number;
    record_status?: string;
}

// ─── Organization DTOs ────────────────────────────────────────────
export interface CreateOrganizationDTO {
    name: string;
    description?: string;
    address?: string;
    owner_name?: string;
    website_url?: string;
    email?: string;
    phone?: string;
}

// ─── Role DTOs ────────────────────────────────────────────────────
export interface CreateRoleDTO {
    name: string;
    description?: string;
    permissions?: Record<string, any>;
}

export interface UpdateRoleDTO {
    name?: string;
    description?: string;
    permissions?: Record<string, any>;
}

// ─── Asset DTOs ───────────────────────────────────────────────────
export interface CreateAssetDTO {
    name: string;
    asset_tag?: string;
    asset_type?: 'movable' | 'immovable';
    category?: string;
    description?: string;
    location?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    purchase_cost?: string;
    warranty_expiry?: string;
    status?: string;
}

export interface UpdateAssetDTO {
    name?: string;
    asset_tag?: string;
    asset_type?: 'movable' | 'immovable';
    category?: string;
    description?: string;
    location?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    purchase_cost?: string;
    warranty_expiry?: string;
    status?: string;
}

export interface AssetListQuery {
    skip?: number;
    limit?: number;
    search?: string;
    asset_type?: string;
    status?: string;
    record_status?: string;
}

// ─── Inventory DTOs ───────────────────────────────────────────────
export interface CreateInventoryItemDTO {
    name: string;
    description?: string;
    sku?: string;
    category: string;
    quantity: number;
    min_quantity?: number;
    unit?: string;
    unit_cost?: string;
    storage_location: string;
}

export interface UpdateInventoryItemDTO {
    name?: string;
    description?: string;
    sku?: string;
    category?: string;
    quantity?: number;
    min_quantity?: number;
    unit?: string;
    unit_cost?: string;
    storage_location?: string;
}

export interface InventoryListQuery {
    skip?: number;
    limit?: number;
    search?: string;
    category?: string;
    low_stock_only?: string;
    record_status?: string;
}

// ─── Work Order DTOs ──────────────────────────────────────────────
export interface CreateWorkOrderDTO {
    title: string;
    description?: string;
    asset_id?: string;
    assignee_id?: string;
    priority?: string;
    location?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    estimated_hours?: number;
}

export interface UpdateWorkOrderDTO {
    title?: string;
    description?: string;
    asset_id?: string | null;
    assignee_id?: string;
    status?: string;
    priority?: string;
    location?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    estimated_hours?: number;
    actual_hours?: number;
    notes?: string;
}

export interface WorkOrderListQuery {
    skip?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignee_id?: string;
    asset_id?: string;
    search?: string;
    record_status?: string;
}

export interface StatusUpdateDTO {
    status: string;
    notes?: string;
}

export interface AssignDTO {
    assignee_id: string;
}

export interface CommentDTO {
    message: string;
}

export interface InventoryUsageDTO {
    inventory_item_id: string;
    quantity_used: number;
}

// ─── PM Schedule DTOs ─────────────────────────────────────────────
export interface CreatePMScheduleDTO {
    asset_id: string;
    name: string;
    description?: string;
    schedule_logic?: string;
    is_paused?: boolean;
    triggers: {
        trigger_type?: string;
        cron_expression?: string;
        meter_interval?: number;
        lead_time_days?: number;
    }[];
    template: {
        priority?: string;
        estimated_hours?: number;
        assignee_id?: string;
    };
    tasks?: { description: string }[];
    parts?: { inventory_item_id: string; quantity_required: number }[];
}

export interface UpdatePMScheduleDTO extends Partial<CreatePMScheduleDTO> {
    is_active?: boolean;
}

// ─── Access DTOs ──────────────────────────────────────────────────
export interface CreateAccessDTO {
    name: string;
    description?: string;
    module?: string;
}

export type UpdateAccessDTO = Partial<CreateAccessDTO>;
