from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class WorkOrderStatusEnum(str, Enum):
    NEW = "new"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AssetTypeEnum(str, Enum):
    MOVABLE = "movable"
    IMMOVABLE = "immovable"

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = {}

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    org_id: str
    is_system_role: bool
    is_active: bool
    created_at: datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    role_id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    role: Optional[RoleResponse] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Asset Schemas
class AssetBase(BaseModel):
    name: str
    asset_tag: Optional[str] = None
    asset_type: Optional[str] = AssetTypeEnum.MOVABLE.value
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
    status: Optional[str] = "active"

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    asset_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[datetime] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class AssetBulkImport(BaseModel):
    assets: List[AssetCreate]

# Work Order Schemas
class WorkOrderBase(BaseModel):
    title: str
    description: Optional[str] = None
    asset_id: Optional[str] = None
    assignee_id: Optional[str] = None
    priority: Optional[str] = PriorityEnum.MEDIUM.value
    category: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    notes: Optional[str] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    asset_id: Optional[str] = None
    assignee_id: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    notes: Optional[str] = None

class WorkOrderResponse(WorkOrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    wo_number: str
    status: str
    requester_id: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    actual_hours: Optional[int] = None
    is_pm_generated: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    asset: Optional[AssetResponse] = None
    assignee: Optional[UserResponse] = None
    requester: Optional[UserResponse] = None

class WorkOrderStatusUpdate(BaseModel):
    status: WorkOrderStatusEnum
    notes: Optional[str] = None

class WorkOrderAssign(BaseModel):
    assignee_id: str

# PM Schedule Schemas
class PMScheduleBase(BaseModel):
    name: str
    description: Optional[str] = None
    asset_id: str
    frequency_type: Optional[str] = "days"
    frequency_value: int
    priority: Optional[str] = PriorityEnum.MEDIUM.value
    estimated_hours: Optional[int] = None
    next_due: datetime

class PMScheduleCreate(PMScheduleBase):
    pass

class PMScheduleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    asset_id: Optional[str] = None
    frequency_type: Optional[str] = None
    frequency_value: Optional[int] = None
    priority: Optional[str] = None
    estimated_hours: Optional[int] = None
    next_due: Optional[datetime] = None
    is_active: Optional[bool] = None

class PMScheduleResponse(PMScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    last_generated: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    asset: Optional[AssetResponse] = None

# Analytics Schemas
class AnalyticsDateFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class DashboardStats(BaseModel):
    total_work_orders: int
    completed_work_orders: int
    pending_work_orders: int
    in_progress_work_orders: int
    completion_rate: float
    total_assets: int
    active_pm_schedules: int
    overdue_pms: int

class WorkOrdersByStatus(BaseModel):
    status: str
    count: int

class WorkOrdersByPriority(BaseModel):
    priority: str
    count: int

class AnalyticsResponse(BaseModel):
    stats: DashboardStats
    wo_by_status: List[WorkOrdersByStatus]
    wo_by_priority: List[WorkOrdersByPriority]
    recent_work_orders: List[WorkOrderResponse]

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    entity_type: str
    entity_id: str
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

# Inventory Schemas
class InventoryItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category: str
    quantity: int = 0
    min_quantity: Optional[int] = 0
    unit: Optional[str] = "pcs"
    unit_cost: Optional[str] = "0"
    storage_location: str

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None
    unit: Optional[str] = None
    unit_cost: Optional[str] = None
    storage_location: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryItemResponse(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class InventoryStats(BaseModel):
    total_items: int
    low_stock_count: int
    total_value: float
