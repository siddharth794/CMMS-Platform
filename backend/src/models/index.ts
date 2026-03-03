import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Organization extends Model { public id!: string; public name!: string; }
Organization.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    address: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'organizations', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class Role extends Model { public id!: number; public name!: string; }
Role.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500) },
    permissions: { type: DataTypes.JSON, defaultValue: {} },
    is_system_role: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'roles', timestamps: true, createdAt: 'created_at', updatedAt: false });

class User extends Model { public id!: string; public email!: string; public password_hash!: string; }
User.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    username: { type: DataTypes.STRING(100), allowNull: false },
    first_name: { type: DataTypes.STRING(100) },
    last_name: { type: DataTypes.STRING(100) },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE },
}, { sequelize, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class Asset extends Model { public id!: string; public name!: string; }
Asset.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    asset_tag: { type: DataTypes.STRING(100), unique: true },
    asset_type: { type: DataTypes.ENUM('movable', 'immovable'), defaultValue: 'movable' },
    category: { type: DataTypes.STRING(100) },
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING },
    manufacturer: { type: DataTypes.STRING },
    model: { type: DataTypes.STRING },
    serial_number: { type: DataTypes.STRING },
    purchase_date: { type: DataTypes.DATE },
    purchase_cost: { type: DataTypes.STRING(50) },
    warranty_expiry: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING(50), defaultValue: 'active' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'assets', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class WorkOrder extends Model { public id!: string; }
WorkOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    wo_number: { type: DataTypes.STRING(50), unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    asset_id: { type: DataTypes.UUID },
    assignee_id: { type: DataTypes.UUID },
    requester_id: { type: DataTypes.UUID },
    status: { type: DataTypes.ENUM('new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'), defaultValue: 'new' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    location: { type: DataTypes.STRING(100) },
    scheduled_start: { type: DataTypes.DATE },
    scheduled_end: { type: DataTypes.DATE },
    actual_start: { type: DataTypes.DATE },
    actual_end: { type: DataTypes.DATE },
    estimated_hours: { type: DataTypes.INTEGER },
    actual_hours: { type: DataTypes.INTEGER },
    notes: { type: DataTypes.TEXT },
    is_pm_generated: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'work_orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class PMSchedule extends Model { public id!: string; }
PMSchedule.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    asset_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    frequency_type: { type: DataTypes.STRING(50), defaultValue: 'days' },
    frequency_value: { type: DataTypes.INTEGER, allowNull: false },
    priority: { type: DataTypes.STRING(50), defaultValue: 'medium' },
    estimated_hours: { type: DataTypes.INTEGER },
    last_generated: { type: DataTypes.DATE },
    next_due: { type: DataTypes.DATE, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'pm_schedules', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class AuditLog extends Model { public id!: string; }
AuditLog.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID },
    user_email: { type: DataTypes.STRING },
    entity_type: { type: DataTypes.STRING(100), allowNull: false },
    entity_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    old_values: { type: DataTypes.JSON },
    new_values: { type: DataTypes.JSON },
    ip_address: { type: DataTypes.STRING(50) },
}, { sequelize, tableName: 'audit_logs', timestamps: true, createdAt: 'created_at', updatedAt: false });

class InventoryItem extends Model { public id!: string; }
InventoryItem.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    sku: { type: DataTypes.STRING(100) },
    category: { type: DataTypes.STRING(100), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    min_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    unit: { type: DataTypes.STRING(50), defaultValue: 'pcs' },
    unit_cost: { type: DataTypes.STRING(50), defaultValue: '0' },
    storage_location: { type: DataTypes.STRING, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'inventory_items', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class WOComment extends Model { public id!: string; }
WOComment.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    work_order_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'wo_comments', timestamps: true, createdAt: 'created_at', updatedAt: false });

// Associations
Organization.hasMany(User, { foreignKey: 'org_id' });
User.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(Role, { foreignKey: 'org_id' });
Role.belongsTo(Organization, { foreignKey: 'org_id' });

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

Organization.hasMany(Asset, { foreignKey: 'org_id' });
Asset.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(WorkOrder, { foreignKey: 'org_id' });
WorkOrder.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(PMSchedule, { foreignKey: 'org_id' });
PMSchedule.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(InventoryItem, { foreignKey: 'org_id' });
InventoryItem.belongsTo(Organization, { foreignKey: 'org_id' });

Asset.hasMany(WorkOrder, { foreignKey: 'asset_id' });
WorkOrder.belongsTo(Asset, { foreignKey: 'asset_id' });

Asset.hasMany(PMSchedule, { foreignKey: 'asset_id' });
PMSchedule.belongsTo(Asset, { foreignKey: 'asset_id' });

User.hasMany(WorkOrder, { as: 'assigned_work_orders', foreignKey: 'assignee_id' });
WorkOrder.belongsTo(User, { as: 'assignee', foreignKey: 'assignee_id' });

User.hasMany(WorkOrder, { as: 'created_work_orders', foreignKey: 'requester_id' });
WorkOrder.belongsTo(User, { as: 'requester', foreignKey: 'requester_id' });

WorkOrder.hasMany(WOComment, { as: 'comments', foreignKey: 'work_order_id' });
WOComment.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

User.hasMany(WOComment, { foreignKey: 'user_id' });
WOComment.belongsTo(User, { foreignKey: 'user_id' });

export {
    Organization,
    Role,
    User,
    Asset,
    WorkOrder,
    PMSchedule,
    AuditLog,
    InventoryItem,
    WOComment,
    sequelize
};
