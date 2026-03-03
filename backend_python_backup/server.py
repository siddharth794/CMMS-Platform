from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import get_db, init_db, engine, Base
from models import (
    Organization, User, Role, Asset, WorkOrder, PMSchedule, AuditLog, InventoryItem,
    WorkOrderStatus, Priority
)
from schemas import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse,
    RoleCreate, RoleUpdate, RoleResponse,
    UserCreate, UserUpdate, UserResponse, UserLogin, TokenResponse,
    AssetCreate, AssetUpdate, AssetResponse, AssetBulkImport,
    WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse, WorkOrderStatusUpdate, WorkOrderAssign,
    PMScheduleCreate, PMScheduleUpdate, PMScheduleResponse,
    AnalyticsResponse, DashboardStats, WorkOrdersByStatus, WorkOrdersByPriority,
    AuditLogResponse,
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse, InventoryStats
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_permission, require_roles
)
from email_service import email_service

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Facility Management System")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    logger.info("Shutting down Facility Management System")

app = FastAPI(
    title="Facility Management System API",
    description="Multi-tenant facility management with work orders, assets, and preventive maintenance",
    version="1.0.0",
    lifespan=lifespan
)

api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_wo_number():
    prefix = "WO"
    timestamp = datetime.now().strftime("%Y%m%d")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}-{timestamp}-{random_suffix}"

def generate_asset_tag():
    prefix = "AST"
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{random_suffix}"

async def create_audit_log(
    db: AsyncSession,
    org_id: str,
    user_id: Optional[str],
    user_email: Optional[str],
    entity_type: str,
    entity_id: str,
    action: str,
    old_values: dict = None,
    new_values: dict = None
):
    audit = AuditLog(
        org_id=org_id,
        user_id=user_id,
        user_email=user_email,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_values=old_values,
        new_values=new_values
    )
    db.add(audit)
    await db.commit()

# Health Check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "facility-management-api", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == credentials.email).options(
        selectinload(User.role), selectinload(User.organization)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    access_token = create_access_token(data={"sub": user.id, "org_id": user.org_id, "role": user.role.name if user.role else None})
    
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

# ==================== ORGANIZATION ROUTES ====================
@api_router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(org_data: OrganizationCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Organization).where(Organization.name == org_data.name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Organization name already exists")
    
    org = Organization(**org_data.model_dump())
    db.add(org)
    await db.commit()
    await db.refresh(org)
    
    default_roles = [
        {"name": "Super_Admin", "description": "Full system access", "permissions": {"all": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Org_Admin", "description": "Organization administrator", "permissions": {"all": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Facility_Manager", "description": "Manages facilities and work orders", "permissions": {"work_orders": {"read": True, "write": True}, "assets": {"read": True, "write": True}, "pm_schedules": {"read": True, "write": True}, "analytics": {"read": True}}, "is_system_role": True},
        {"name": "Technician", "description": "Executes work orders", "permissions": {"work_orders": {"read": True, "write": True}, "assets": {"read": True}}, "is_system_role": True},
        {"name": "Requestor", "description": "Creates and tracks work orders", "permissions": {"work_orders": {"read": True, "write": True}, "assets": {"read": True}}, "is_system_role": True},
    ]
    
    for role_data in default_roles:
        role = Role(org_id=org.id, **role_data)
        db.add(role)
    
    await db.commit()
    return OrganizationResponse.model_validate(org)

@api_router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = 0, limit: int = 100,
    current_user: User = Depends(require_roles(["super_admin"]))
):
    db = current_user._sa_instance_state.session
    stmt = select(Organization).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [OrganizationResponse.model_validate(org) for org in result.scalars().all()]

@api_router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.org_id != org_id and current_user.role.name.lower() != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalars().first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse.model_validate(org)

# ==================== ROLE ROUTES ====================
@api_router.get("/roles", response_model=List[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Role).where(Role.org_id == current_user.org_id, Role.is_active == True)
    result = await db.execute(stmt)
    return [RoleResponse.model_validate(role) for role in result.scalars().all()]

@api_router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    role = Role(org_id=current_user.org_id, **role_data.model_dump())
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)

@api_router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int, role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    result = await db.execute(select(Role).where(Role.id == role_id, Role.org_id == current_user.org_id))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system_role:
        raise HTTPException(status_code=400, detail="Cannot modify system roles")
    
    for key, value in role_data.model_dump(exclude_unset=True).items():
        setattr(role, key, value)
    
    await db.commit()
    await db.refresh(role)
    return RoleResponse.model_validate(role)

# ==================== USER ROUTES ====================
@api_router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(User).where(User.org_id == current_user.org_id).options(selectinload(User.role)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [UserResponse.model_validate(user) for user in result.scalars().all()]

@api_router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    role_result = await db.execute(select(Role).where(Role.id == user_data.role_id, Role.org_id == current_user.org_id))
    if not role_result.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))
    user_dict["org_id"] = current_user.org_id
    
    user = User(**user_dict)
    db.add(user)
    await db.commit()
    
    stmt = select(User).where(User.id == user.id).options(selectinload(User.role))
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "User", user.id, "create", None, {"email": user.email})
    
    return UserResponse.model_validate(user)

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(User).where(User.id == user_id, User.org_id == current_user.org_id).options(selectinload(User.role))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str, user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    stmt = select(User).where(User.id == user_id, User.org_id == current_user.org_id).options(selectinload(User.role))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    stmt = select(User).where(User.id == user_id, User.org_id == current_user.org_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    await db.commit()
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "User", user_id, "delete")
    return {"message": "User deactivated"}

# ==================== ASSET ROUTES ====================
@api_router.get("/assets", response_model=List[AssetResponse])
async def list_assets(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.org_id == current_user.org_id, Asset.is_active == True)
    
    if search:
        stmt = stmt.where(or_(Asset.name.ilike(f"%{search}%"), Asset.asset_tag.ilike(f"%{search}%"), Asset.location.ilike(f"%{search}%")))
    if asset_type:
        stmt = stmt.where(Asset.asset_type == asset_type)
    if status:
        stmt = stmt.where(Asset.status == status)
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [AssetResponse.model_validate(asset) for asset in result.scalars().all()]

@api_router.post("/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset_dict = asset_data.model_dump()
    asset_dict["org_id"] = current_user.org_id
    if not asset_dict.get("asset_tag"):
        asset_dict["asset_tag"] = generate_asset_tag()
    
    asset = Asset(**asset_dict)
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "Asset", asset.id, "create", None, {"name": asset.name})
    
    return AssetResponse.model_validate(asset)

@api_router.post("/assets/bulk", response_model=List[AssetResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_assets(
    bulk_data: AssetBulkImport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    created_assets = []
    for asset_data in bulk_data.assets:
        asset_dict = asset_data.model_dump()
        asset_dict["org_id"] = current_user.org_id
        if not asset_dict.get("asset_tag"):
            asset_dict["asset_tag"] = generate_asset_tag()
        
        asset = Asset(**asset_dict)
        db.add(asset)
        created_assets.append(asset)
    
    await db.commit()
    
    for asset in created_assets:
        await db.refresh(asset)
    
    return [AssetResponse.model_validate(asset) for asset in created_assets]

@api_router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Asset).where(Asset.id == asset_id, Asset.org_id == current_user.org_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)

@api_router.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str, asset_data: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == asset_id, Asset.org_id == current_user.org_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    old_values = {"name": asset.name, "status": asset.status}
    
    for key, value in asset_data.model_dump(exclude_unset=True).items():
        setattr(asset, key, value)
    
    await db.commit()
    await db.refresh(asset)
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "Asset", asset_id, "update", old_values, asset_data.model_dump(exclude_unset=True))
    
    return AssetResponse.model_validate(asset)

@api_router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Asset).where(Asset.id == asset_id, Asset.org_id == current_user.org_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.is_active = False
    await db.commit()
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "Asset", asset_id, "delete")
    return {"message": "Asset deactivated"}

# ==================== WORK ORDER ROUTES ====================
@api_router.get("/work-orders", response_model=List[WorkOrderResponse])
async def list_work_orders(
    skip: int = 0, limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(WorkOrder).where(WorkOrder.org_id == current_user.org_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    
    role_name = current_user.role.name.lower() if current_user.role else ""
    if role_name == "technician":
        stmt = stmt.where(WorkOrder.assignee_id == current_user.id)
    elif role_name == "requestor":
        stmt = stmt.where(WorkOrder.requester_id == current_user.id)
    
    if status:
        stmt = stmt.where(WorkOrder.status == status)
    if priority:
        stmt = stmt.where(WorkOrder.priority == priority)
    if assignee_id:
        stmt = stmt.where(WorkOrder.assignee_id == assignee_id)
    if asset_id:
        stmt = stmt.where(WorkOrder.asset_id == asset_id)
    
    stmt = stmt.order_by(desc(WorkOrder.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [WorkOrderResponse.model_validate(wo) for wo in result.scalars().all()]

@api_router.post("/work-orders", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    wo_data: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wo_dict = wo_data.model_dump()
    wo_dict["org_id"] = current_user.org_id
    wo_dict["requester_id"] = current_user.id
    wo_dict["wo_number"] = generate_wo_number()
    wo_dict["status"] = WorkOrderStatus.NEW.value
    
    if wo_dict.get("asset_id"):
        asset_result = await db.execute(select(Asset).where(Asset.id == wo_dict["asset_id"], Asset.org_id == current_user.org_id))
        if not asset_result.scalars().first():
            raise HTTPException(status_code=400, detail="Invalid asset")
    
    wo = WorkOrder(**wo_dict)
    db.add(wo)
    await db.commit()
    
    stmt = select(WorkOrder).where(WorkOrder.id == wo.id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    result = await db.execute(stmt)
    wo = result.scalars().first()
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "WorkOrder", wo.id, "create", None, {"wo_number": wo.wo_number, "title": wo.title})
    
    return WorkOrderResponse.model_validate(wo)

@api_router.get("/work-orders/{wo_id}", response_model=WorkOrderResponse)
async def get_work_order(wo_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.org_id == current_user.org_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    result = await db.execute(stmt)
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderResponse.model_validate(wo)

@api_router.put("/work-orders/{wo_id}", response_model=WorkOrderResponse)
async def update_work_order(
    wo_id: str, wo_data: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.org_id == current_user.org_id)
    result = await db.execute(stmt)
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    old_status = wo.status
    
    for key, value in wo_data.model_dump(exclude_unset=True).items():
        setattr(wo, key, value)
    
    if wo_data.status and wo_data.status != old_status:
        if wo_data.status == WorkOrderStatus.IN_PROGRESS.value and not wo.actual_start:
            wo.actual_start = datetime.now(timezone.utc)
        elif wo_data.status == WorkOrderStatus.COMPLETED.value and not wo.actual_end:
            wo.actual_end = datetime.now(timezone.utc)
    
    await db.commit()
    
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    result = await db.execute(stmt)
    wo = result.scalars().first()
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "WorkOrder", wo_id, "update", {"status": old_status}, wo_data.model_dump(exclude_unset=True))
    
    return WorkOrderResponse.model_validate(wo)

@api_router.patch("/work-orders/{wo_id}/status", response_model=WorkOrderResponse)
async def update_work_order_status(
    wo_id: str, status_data: WorkOrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.org_id == current_user.org_id)
    result = await db.execute(stmt)
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    old_status = wo.status
    wo.status = status_data.status.value
    
    if status_data.notes:
        wo.notes = (wo.notes or "") + f"\n[{datetime.now(timezone.utc).isoformat()}] Status changed to {status_data.status.value}: {status_data.notes}"
    
    if status_data.status == WorkOrderStatus.IN_PROGRESS and not wo.actual_start:
        wo.actual_start = datetime.now(timezone.utc)
    elif status_data.status == WorkOrderStatus.COMPLETED and not wo.actual_end:
        wo.actual_end = datetime.now(timezone.utc)
    
    await db.commit()
    
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    result = await db.execute(stmt)
    wo = result.scalars().first()
    
    if wo.requester and wo.requester.email:
        await email_service.send_work_order_status_change(
            wo.requester.email, wo.wo_number, wo.title, old_status, wo.status, current_user.email
        )
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "WorkOrder", wo_id, "status_change", {"status": old_status}, {"status": wo.status})
    
    return WorkOrderResponse.model_validate(wo)

@api_router.patch("/work-orders/{wo_id}/assign", response_model=WorkOrderResponse)
async def assign_work_order(
    wo_id: str, assign_data: WorkOrderAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.org_id == current_user.org_id)
    result = await db.execute(stmt)
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    assignee_result = await db.execute(select(User).where(User.id == assign_data.assignee_id, User.org_id == current_user.org_id))
    assignee = assignee_result.scalars().first()
    if not assignee:
        raise HTTPException(status_code=400, detail="Invalid assignee")
    
    wo.assignee_id = assign_data.assignee_id
    if wo.status == WorkOrderStatus.NEW.value:
        wo.status = WorkOrderStatus.OPEN.value
    
    await db.commit()
    
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    )
    result = await db.execute(stmt)
    wo = result.scalars().first()
    
    await email_service.send_work_order_assignment(assignee.email, wo.wo_number, wo.title, current_user.email)
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "WorkOrder", wo_id, "assign", None, {"assignee_id": assign_data.assignee_id})
    
    return WorkOrderResponse.model_validate(wo)

@api_router.delete("/work-orders/{wo_id}")
async def delete_work_order(
    wo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    stmt = select(WorkOrder).where(WorkOrder.id == wo_id, WorkOrder.org_id == current_user.org_id)
    result = await db.execute(stmt)
    wo = result.scalars().first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    wo.status = WorkOrderStatus.CANCELLED.value
    await db.commit()
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "WorkOrder", wo_id, "cancel")
    return {"message": "Work order cancelled"}

# ==================== PM SCHEDULE ROUTES ====================
@api_router.get("/pm-schedules", response_model=List[PMScheduleResponse])
async def list_pm_schedules(
    skip: int = 0, limit: int = 100,
    asset_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(PMSchedule).where(PMSchedule.org_id == current_user.org_id, PMSchedule.is_active == True).options(selectinload(PMSchedule.asset))
    
    if asset_id:
        stmt = stmt.where(PMSchedule.asset_id == asset_id)
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [PMScheduleResponse.model_validate(pm) for pm in result.scalars().all()]

@api_router.post("/pm-schedules", response_model=PMScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_pm_schedule(
    pm_data: PMScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    asset_result = await db.execute(select(Asset).where(Asset.id == pm_data.asset_id, Asset.org_id == current_user.org_id))
    if not asset_result.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid asset")
    
    pm_dict = pm_data.model_dump()
    pm_dict["org_id"] = current_user.org_id
    
    pm = PMSchedule(**pm_dict)
    db.add(pm)
    await db.commit()
    
    stmt = select(PMSchedule).where(PMSchedule.id == pm.id).options(selectinload(PMSchedule.asset))
    result = await db.execute(stmt)
    pm = result.scalars().first()
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "PMSchedule", pm.id, "create", None, {"name": pm.name})
    
    return PMScheduleResponse.model_validate(pm)

@api_router.get("/pm-schedules/{pm_id}", response_model=PMScheduleResponse)
async def get_pm_schedule(pm_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(PMSchedule).where(PMSchedule.id == pm_id, PMSchedule.org_id == current_user.org_id).options(selectinload(PMSchedule.asset))
    result = await db.execute(stmt)
    pm = result.scalars().first()
    if not pm:
        raise HTTPException(status_code=404, detail="PM schedule not found")
    return PMScheduleResponse.model_validate(pm)

@api_router.put("/pm-schedules/{pm_id}", response_model=PMScheduleResponse)
async def update_pm_schedule(
    pm_id: str, pm_data: PMScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    stmt = select(PMSchedule).where(PMSchedule.id == pm_id, PMSchedule.org_id == current_user.org_id)
    result = await db.execute(stmt)
    pm = result.scalars().first()
    if not pm:
        raise HTTPException(status_code=404, detail="PM schedule not found")
    
    for key, value in pm_data.model_dump(exclude_unset=True).items():
        setattr(pm, key, value)
    
    await db.commit()
    
    stmt = select(PMSchedule).where(PMSchedule.id == pm_id).options(selectinload(PMSchedule.asset))
    result = await db.execute(stmt)
    pm = result.scalars().first()
    
    return PMScheduleResponse.model_validate(pm)

@api_router.delete("/pm-schedules/{pm_id}")
async def delete_pm_schedule(
    pm_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin", "facility_manager"]))
):
    stmt = select(PMSchedule).where(PMSchedule.id == pm_id, PMSchedule.org_id == current_user.org_id)
    result = await db.execute(stmt)
    pm = result.scalars().first()
    if not pm:
        raise HTTPException(status_code=404, detail="PM schedule not found")
    
    pm.is_active = False
    await db.commit()
    return {"message": "PM schedule deactivated"}

# ==================== ANALYTICS ROUTES ====================
@api_router.get("/analytics/dashboard", response_model=AnalyticsResponse)
async def get_dashboard_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.org_id
    
    wo_query = select(WorkOrder).where(WorkOrder.org_id == org_id)
    if start_date:
        wo_query = wo_query.where(WorkOrder.created_at >= start_date)
    if end_date:
        wo_query = wo_query.where(WorkOrder.created_at <= end_date)
    
    total_wo_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id))
    total_wo = total_wo_result.scalar() or 0
    
    completed_wo_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id, WorkOrder.status == WorkOrderStatus.COMPLETED.value))
    completed_wo = completed_wo_result.scalar() or 0
    
    pending_wo_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id, WorkOrder.status.in_([WorkOrderStatus.NEW.value, WorkOrderStatus.OPEN.value])))
    pending_wo = pending_wo_result.scalar() or 0
    
    in_progress_wo_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id, WorkOrder.status == WorkOrderStatus.IN_PROGRESS.value))
    in_progress_wo = in_progress_wo_result.scalar() or 0
    
    total_assets_result = await db.execute(select(func.count(Asset.id)).where(Asset.org_id == org_id, Asset.is_active == True))
    total_assets = total_assets_result.scalar() or 0
    
    active_pm_result = await db.execute(select(func.count(PMSchedule.id)).where(PMSchedule.org_id == org_id, PMSchedule.is_active == True))
    active_pm = active_pm_result.scalar() or 0
    
    overdue_pm_result = await db.execute(select(func.count(PMSchedule.id)).where(PMSchedule.org_id == org_id, PMSchedule.is_active == True, PMSchedule.next_due < datetime.now(timezone.utc)))
    overdue_pm = overdue_pm_result.scalar() or 0
    
    completion_rate = (completed_wo / total_wo * 100) if total_wo > 0 else 0
    
    wo_by_status = []
    for status_val in WorkOrderStatus:
        count_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id, WorkOrder.status == status_val.value))
        count = count_result.scalar() or 0
        wo_by_status.append(WorkOrdersByStatus(status=status_val.value, count=count))
    
    wo_by_priority = []
    for priority_val in Priority:
        count_result = await db.execute(select(func.count(WorkOrder.id)).where(WorkOrder.org_id == org_id, WorkOrder.priority == priority_val.value))
        count = count_result.scalar() or 0
        wo_by_priority.append(WorkOrdersByPriority(priority=priority_val.value, count=count))
    
    recent_wo_stmt = select(WorkOrder).where(WorkOrder.org_id == org_id).options(
        selectinload(WorkOrder.asset),
        selectinload(WorkOrder.assignee).selectinload(User.role),
        selectinload(WorkOrder.requester).selectinload(User.role)
    ).order_by(desc(WorkOrder.created_at)).limit(10)
    recent_wo_result = await db.execute(recent_wo_stmt)
    recent_work_orders = [WorkOrderResponse.model_validate(wo) for wo in recent_wo_result.scalars().all()]
    
    return AnalyticsResponse(
        stats=DashboardStats(
            total_work_orders=total_wo,
            completed_work_orders=completed_wo,
            pending_work_orders=pending_wo,
            in_progress_work_orders=in_progress_wo,
            completion_rate=round(completion_rate, 1),
            total_assets=total_assets,
            active_pm_schedules=active_pm,
            overdue_pms=overdue_pm
        ),
        wo_by_status=wo_by_status,
        wo_by_priority=wo_by_priority,
        recent_work_orders=recent_work_orders
    )

# ==================== AUDIT LOG ROUTES ====================
@api_router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = 0, limit: int = 100,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "org_admin"]))
):
    stmt = select(AuditLog).where(AuditLog.org_id == current_user.org_id)
    
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    
    stmt = stmt.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [AuditLogResponse.model_validate(log) for log in result.scalars().all()]

# ==================== INVENTORY ROUTES ====================
@api_router.get("/inventory", response_model=List[InventoryItemResponse])
async def list_inventory(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InventoryItem).where(InventoryItem.org_id == current_user.org_id, InventoryItem.is_active == True)
    
    if search:
        stmt = stmt.where(or_(
            InventoryItem.name.ilike(f"%{search}%"),
            InventoryItem.sku.ilike(f"%{search}%"),
            InventoryItem.storage_location.ilike(f"%{search}%")
        ))
    if category:
        stmt = stmt.where(InventoryItem.category == category)
    if low_stock_only:
        stmt = stmt.where(InventoryItem.quantity <= InventoryItem.min_quantity)
    
    stmt = stmt.order_by(InventoryItem.name).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [InventoryItemResponse.model_validate(item) for item in result.scalars().all()]

@api_router.get("/inventory/stats", response_model=InventoryStats)
async def get_inventory_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.org_id
    
    # Total items count
    total_result = await db.execute(
        select(func.count(InventoryItem.id)).where(InventoryItem.org_id == org_id, InventoryItem.is_active == True)
    )
    total_items = total_result.scalar() or 0
    
    # Low stock count
    low_stock_result = await db.execute(
        select(func.count(InventoryItem.id)).where(
            InventoryItem.org_id == org_id,
            InventoryItem.is_active == True,
            InventoryItem.quantity <= InventoryItem.min_quantity,
            InventoryItem.min_quantity > 0
        )
    )
    low_stock_count = low_stock_result.scalar() or 0
    
    # Calculate total value
    items_result = await db.execute(
        select(InventoryItem).where(InventoryItem.org_id == org_id, InventoryItem.is_active == True)
    )
    items = items_result.scalars().all()
    total_value = sum(float(item.unit_cost or 0) * item.quantity for item in items)
    
    return InventoryStats(
        total_items=total_items,
        low_stock_count=low_stock_count,
        total_value=round(total_value, 2)
    )

@api_router.get("/inventory/categories")
async def get_inventory_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InventoryItem.category).where(
        InventoryItem.org_id == current_user.org_id,
        InventoryItem.is_active == True
    ).distinct()
    result = await db.execute(stmt)
    categories = [row[0] for row in result.all() if row[0]]
    return {"categories": categories}

@api_router.post("/inventory", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item_data: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item_dict = item_data.model_dump()
    item_dict["org_id"] = current_user.org_id
    
    item = InventoryItem(**item_dict)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "InventoryItem", item.id, "create", None, {"name": item.name})
    
    return InventoryItemResponse.model_validate(item)

@api_router.get("/inventory/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(item_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(InventoryItem).where(InventoryItem.id == item_id, InventoryItem.org_id == current_user.org_id)
    result = await db.execute(stmt)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return InventoryItemResponse.model_validate(item)

@api_router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: str, item_data: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InventoryItem).where(InventoryItem.id == item_id, InventoryItem.org_id == current_user.org_id)
    result = await db.execute(stmt)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    old_values = {"name": item.name, "quantity": item.quantity}
    
    for key, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    
    await db.commit()
    await db.refresh(item)
    
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "InventoryItem", item_id, "update", old_values, item_data.model_dump(exclude_unset=True))
    
    return InventoryItemResponse.model_validate(item)

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(InventoryItem).where(InventoryItem.id == item_id, InventoryItem.org_id == current_user.org_id)
    result = await db.execute(stmt)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    item.is_active = False
    await db.commit()
    await create_audit_log(db, current_user.org_id, current_user.id, current_user.email, "InventoryItem", item_id, "delete")
    return {"message": "Inventory item deleted"}

# ==================== SEED DATA ROUTE ====================
@api_router.post("/seed-demo-data")
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    existing_org = await db.execute(select(Organization).where(Organization.name == "Demo Facility Corp"))
    if existing_org.scalars().first():
        raise HTTPException(status_code=400, detail="Demo data already exists")
    
    org = Organization(name="Demo Facility Corp", description="Demo organization for testing", address="123 Demo Street, Tech City")
    db.add(org)
    await db.commit()
    await db.refresh(org)
    
    roles_data = [
        {"name": "Super_Admin", "description": "Full system access", "permissions": {"all": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Org_Admin", "description": "Organization administrator", "permissions": {"all": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Facility_Manager", "description": "Manages facilities", "permissions": {"work_orders": {"read": True, "write": True}, "assets": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Technician", "description": "Executes work orders", "permissions": {"work_orders": {"read": True, "write": True}}, "is_system_role": True},
        {"name": "Requestor", "description": "Creates work orders", "permissions": {"work_orders": {"read": True, "write": True}}, "is_system_role": True},
    ]
    
    roles = {}
    for role_data in roles_data:
        role = Role(org_id=org.id, **role_data)
        db.add(role)
        await db.commit()
        await db.refresh(role)
        roles[role.name] = role
    
    users_data = [
        {"email": "admin@demo.com", "username": "admin", "first_name": "Admin", "last_name": "User", "password_hash": get_password_hash("admin123"), "role_id": roles["Super_Admin"].id},
        {"email": "manager@demo.com", "username": "manager", "first_name": "Facility", "last_name": "Manager", "password_hash": get_password_hash("manager123"), "role_id": roles["Facility_Manager"].id},
        {"email": "tech@demo.com", "username": "technician", "first_name": "John", "last_name": "Tech", "password_hash": get_password_hash("tech123"), "role_id": roles["Technician"].id},
        {"email": "requestor@demo.com", "username": "requestor", "first_name": "Jane", "last_name": "Requestor", "password_hash": get_password_hash("request123"), "role_id": roles["Requestor"].id},
    ]
    
    users = []
    for user_data in users_data:
        user = User(org_id=org.id, **user_data)
        db.add(user)
        users.append(user)
    await db.commit()
    
    assets_data = [
        {"name": "HVAC Unit 1", "asset_tag": "AST-HVAC-001", "asset_type": "immovable", "category": "HVAC", "location": "Building A - Floor 1", "manufacturer": "Carrier", "model": "XC-5000", "status": "active"},
        {"name": "Elevator A", "asset_tag": "AST-ELEV-001", "asset_type": "immovable", "category": "Elevator", "location": "Building A", "manufacturer": "Otis", "model": "Gen2", "status": "active"},
        {"name": "Generator 1", "asset_tag": "AST-GEN-001", "asset_type": "immovable", "category": "Power", "location": "Basement", "manufacturer": "Caterpillar", "model": "C15", "status": "active"},
        {"name": "Fire Alarm Panel", "asset_tag": "AST-FIRE-001", "asset_type": "immovable", "category": "Safety", "location": "Security Room", "manufacturer": "Honeywell", "status": "active"},
        {"name": "Water Pump 1", "asset_tag": "AST-PUMP-001", "asset_type": "immovable", "category": "Plumbing", "location": "Utility Room", "manufacturer": "Grundfos", "status": "active"},
    ]
    
    assets = []
    for asset_data in assets_data:
        asset = Asset(org_id=org.id, **asset_data)
        db.add(asset)
        assets.append(asset)
    await db.commit()
    
    for asset in assets:
        await db.refresh(asset)
    
    wo_data = [
        {"title": "HVAC not cooling properly", "description": "Office temperature too high", "asset_id": assets[0].id, "priority": "high", "status": "in_progress", "assignee_id": users[2].id, "requester_id": users[3].id},
        {"title": "Elevator making noise", "description": "Strange grinding sound", "asset_id": assets[1].id, "priority": "medium", "status": "open", "assignee_id": users[2].id, "requester_id": users[3].id},
        {"title": "Generator maintenance", "description": "Scheduled monthly check", "asset_id": assets[2].id, "priority": "low", "status": "new", "requester_id": users[1].id},
        {"title": "Fire alarm test", "description": "Annual fire alarm testing", "asset_id": assets[3].id, "priority": "high", "status": "completed", "assignee_id": users[2].id, "requester_id": users[1].id},
        {"title": "Water leak in basement", "description": "Minor leak near pump", "asset_id": assets[4].id, "priority": "critical", "status": "in_progress", "assignee_id": users[2].id, "requester_id": users[3].id},
    ]
    
    for wo_item in wo_data:
        wo = WorkOrder(org_id=org.id, wo_number=generate_wo_number(), **wo_item)
        db.add(wo)
    await db.commit()
    
    pm_data = [
        {"name": "HVAC Filter Change", "description": "Replace air filters", "asset_id": assets[0].id, "frequency_type": "days", "frequency_value": 30, "priority": "medium", "next_due": datetime.now(timezone.utc) + timedelta(days=15)},
        {"name": "Elevator Inspection", "description": "Safety inspection", "asset_id": assets[1].id, "frequency_type": "days", "frequency_value": 90, "priority": "high", "next_due": datetime.now(timezone.utc) + timedelta(days=45)},
        {"name": "Generator Oil Change", "description": "Change generator oil", "asset_id": assets[2].id, "frequency_type": "days", "frequency_value": 180, "priority": "medium", "next_due": datetime.now(timezone.utc) + timedelta(days=60)},
    ]
    
    for pm_item in pm_data:
        pm = PMSchedule(org_id=org.id, **pm_item)
        db.add(pm)
    await db.commit()
    
    # Seed inventory items
    inventory_data = [
        {"name": "Air Filter 20x25", "sku": "FILTER-001", "category": "Filters", "quantity": 50, "min_quantity": 10, "unit": "pcs", "unit_cost": "15.99", "storage_location": "Warehouse A - Shelf 1"},
        {"name": "HEPA Air Filter", "sku": "FILTER-002", "category": "HVAC", "quantity": 10, "min_quantity": 5, "unit": "pcs", "unit_cost": "45.00", "storage_location": "Warehouse A - Shelf 2"},
        {"name": "Lubricant Oil 5W-30", "sku": "OIL-001", "category": "Lubricants", "quantity": 24, "min_quantity": 6, "unit": "liters", "unit_cost": "12.50", "storage_location": "Storage Room B"},
        {"name": "Elevator Belt", "sku": "BELT-001", "category": "Elevator Parts", "quantity": 3, "min_quantity": 2, "unit": "pcs", "unit_cost": "250.00", "storage_location": "Parts Room"},
        {"name": "Fire Extinguisher", "sku": "SAFETY-001", "category": "Safety Equipment", "quantity": 8, "min_quantity": 4, "unit": "pcs", "unit_cost": "89.99", "storage_location": "Safety Cabinet"},
        {"name": "LED Light Bulbs", "sku": "ELEC-001", "category": "Electrical", "quantity": 100, "min_quantity": 20, "unit": "pcs", "unit_cost": "5.99", "storage_location": "Electrical Storage"},
        {"name": "Pipe Fittings Kit", "sku": "PLUMB-001", "category": "Plumbing", "quantity": 5, "min_quantity": 10, "unit": "kits", "unit_cost": "75.00", "storage_location": "Plumbing Supplies"},
    ]
    
    for inv_item in inventory_data:
        item = InventoryItem(org_id=org.id, **inv_item)
        db.add(item)
    await db.commit()
    
    return {
        "message": "Demo data created successfully",
        "organization": org.name,
        "credentials": {
            "admin": {"email": "admin@demo.com", "password": "admin123"},
            "manager": {"email": "manager@demo.com", "password": "manager123"},
            "technician": {"email": "tech@demo.com", "password": "tech123"},
            "requestor": {"email": "requestor@demo.com", "password": "request123"}
        }
    }

app.include_router(api_router)
