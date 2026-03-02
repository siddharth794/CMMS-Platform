from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
import enum

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class WorkOrderStatus(str, enum.Enum):
    NEW = "new"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AssetType(str, enum.Enum):
    MOVABLE = "movable"
    IMMOVABLE = "immovable"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    roles = relationship("Role", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="organization", cascade="all, delete-orphan")
    pm_schedules = relationship("PMSchedule", back_populates="organization", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="organization", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    permissions = Column(JSON, default=dict)
    is_system_role = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    organization = relationship("Organization", back_populates="roles")
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")
    assigned_work_orders = relationship("WorkOrder", back_populates="assignee", foreign_keys="WorkOrder.assignee_id")
    created_work_orders = relationship("WorkOrder", back_populates="requester", foreign_keys="WorkOrder.requester_id")

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_tag = Column(String(100), unique=True)
    asset_type = Column(String(50), default=AssetType.MOVABLE.value)
    category = Column(String(100))
    description = Column(Text)
    location = Column(String(255))
    manufacturer = Column(String(255))
    model = Column(String(255))
    serial_number = Column(String(255))
    purchase_date = Column(DateTime(timezone=True))
    purchase_cost = Column(String(50))
    warranty_expiry = Column(DateTime(timezone=True))
    status = Column(String(50), default="active")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="assets")
    work_orders = relationship("WorkOrder", back_populates="asset")
    pm_schedules = relationship("PMSchedule", back_populates="asset")

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    wo_number = Column(String(50), unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=True)
    assignee_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    requester_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default=WorkOrderStatus.NEW.value, index=True)
    priority = Column(String(50), default=Priority.MEDIUM.value)
    category = Column(String(100))
    scheduled_start = Column(DateTime(timezone=True))
    scheduled_end = Column(DateTime(timezone=True))
    actual_start = Column(DateTime(timezone=True))
    actual_end = Column(DateTime(timezone=True))
    estimated_hours = Column(Integer)
    actual_hours = Column(Integer)
    notes = Column(Text)
    is_pm_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="work_orders")
    asset = relationship("Asset", back_populates="work_orders")
    assignee = relationship("User", back_populates="assigned_work_orders", foreign_keys=[assignee_id])
    requester = relationship("User", back_populates="created_work_orders", foreign_keys=[requester_id])

class PMSchedule(Base):
    __tablename__ = "pm_schedules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    frequency_type = Column(String(50), default="days")
    frequency_value = Column(Integer, nullable=False)
    priority = Column(String(50), default=Priority.MEDIUM.value)
    estimated_hours = Column(Integer)
    last_generated = Column(DateTime(timezone=True))
    next_due = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="pm_schedules")
    asset = relationship("Asset", back_populates="pm_schedules")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255))
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(36), nullable=False)
    action = Column(String(50), nullable=False)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sku = Column(String(100))
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    min_quantity = Column(Integer, default=0)
    unit = Column(String(50), default="pcs")
    unit_cost = Column(String(50), default="0")
    storage_location = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    organization = relationship("Organization", back_populates="inventory_items")
