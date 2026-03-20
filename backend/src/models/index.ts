import { Sequelize, DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Organization extends Model { public id!: string; public name!: string; public owner_name?: string; public website_url?: string; public email?: string; public phone?: string; }
Organization.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    owner_name: { type: DataTypes.STRING },
    website_url: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    address: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'organizations', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class Site extends Model {
  public id!: string;
  public name!: string;
  public org_id!: string;
  public manager_id!: string | null;
}
Site.init({
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  org_id:      { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  address:     { type: DataTypes.TEXT },
  city:        { type: DataTypes.STRING(100) },
  state:       { type: DataTypes.STRING(100) },
  zip_code:    { type: DataTypes.STRING(20) },
  country:     { type: DataTypes.STRING(100) },
  phone:       { type: DataTypes.STRING(20) },
  description: { type: DataTypes.TEXT },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  manager_id:  { type: DataTypes.UUID, allowNull: true },
}, { sequelize, tableName: 'sites', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class Role extends Model { public id!: number; public name!: string; public org_id?: string; public is_system_role!: boolean; }
Role.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    org_id: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500) },
    is_system_role: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'roles', timestamps: true, createdAt: 'created_at', updatedAt: false, paranoid: true, deletedAt: 'deleted_at' });

class Access extends Model { public id!: string; public name!: string; public module!: string; public is_system!: boolean; public org_id?: string; }
Access.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    module: { type: DataTypes.STRING },
    org_id: { type: DataTypes.UUID, allowNull: true },
    is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'accesses', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class Group extends Model { public id!: string; public name!: string; public org_id!: string; }
Group.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { sequelize, tableName: 'groups', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class User extends Model { 
    public id!: string; 
    public email!: string; 
    public password_hash!: string; 
    public org_id!: string;
    public site_id?: string | null;
    
    toJSON() {
        const values = this.get({ plain: true });
        if (values.Roles && Array.isArray(values.Roles)) {
            values.Role = values.Roles[0] || null;
            values.role_id = values.Role?.id || null;
        }
        return values;
    }
}
User.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    site_id: { type: DataTypes.UUID, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    username: { type: DataTypes.STRING(100), allowNull: false },
    first_name: { type: DataTypes.STRING(100) },
    last_name: { type: DataTypes.STRING(100) },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login: { type: DataTypes.DATE },
}, { sequelize, tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class Asset extends Model { public id!: string; public name!: string; public site_id?: string | null; }
Asset.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    site_id: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    asset_tag: { type: DataTypes.STRING(100) },
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
}, { 
    sequelize, 
    tableName: 'assets', 
    timestamps: true, 
    createdAt: 'created_at', 
    updatedAt: 'updated_at', 
    paranoid: true, 
    deletedAt: 'deleted_at',
    indexes: [
        {
            unique: true,
            fields: ['org_id', 'asset_tag'],
            name: 'org_asset_tag_unique'
        }
    ]
});

class WorkOrder extends Model { public id!: string; public deleted_at?: Date | null; public site_id?: string | null; }
WorkOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    site_id: { type: DataTypes.UUID, allowNull: true },
    wo_number: { type: DataTypes.STRING(50), unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    asset_id: { type: DataTypes.UUID },
    assignee_id: { type: DataTypes.UUID },
    requester_id: { type: DataTypes.UUID },
    status: { type: DataTypes.ENUM('new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled'), defaultValue: 'new' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    location: { type: DataTypes.STRING(100) },
    scheduled_start: { type: DataTypes.DATE },
    scheduled_end: { type: DataTypes.DATE },
    actual_start: { type: DataTypes.DATE },
    actual_end: { type: DataTypes.DATE },
    estimated_hours: { type: DataTypes.INTEGER },
    actual_hours: { type: DataTypes.INTEGER },
    notes: { type: DataTypes.TEXT },
    resolution_notes: { type: DataTypes.TEXT },
    is_pm_generated: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: 'work_orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class PMSchedule extends Model { 
    public id!: string; 
    public org_id!: string;
    public site_id?: string | null;
    public schedule_logic!: string; 
    public is_paused!: boolean; 
    public name!: string; 
}
PMSchedule.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    site_id: { type: DataTypes.UUID, allowNull: true },
    asset_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    schedule_logic: { type: DataTypes.ENUM('FIXED', 'FLOATING'), defaultValue: 'FIXED' },
    is_paused: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'pm_schedules', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class PMTrigger extends Model { public id!: string; public pm_schedule_id!: string; public trigger_type!: string; public cron_expression?: string; public meter_interval?: number; public lead_time_days!: number; }
PMTrigger.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pm_schedule_id: { type: DataTypes.UUID, allowNull: false },
    trigger_type: { type: DataTypes.ENUM('TIME', 'METER'), defaultValue: 'TIME' },
    cron_expression: { type: DataTypes.STRING(100) }, // e.g., '0 0 1 * *'
    meter_interval: { type: DataTypes.INTEGER },
    lead_time_days: { type: DataTypes.INTEGER, defaultValue: 7 }, // Generate 7 days before
}, { sequelize, tableName: 'pm_triggers', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class PMTemplate extends Model { public id!: string; public pm_schedule_id!: string; public priority!: string; public estimated_hours?: number; public assignee_id?: string; }
PMTemplate.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pm_schedule_id: { type: DataTypes.UUID, allowNull: false },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    estimated_hours: { type: DataTypes.INTEGER },
    assignee_id: { type: DataTypes.UUID },
}, { sequelize, tableName: 'pm_templates', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

class PMTask extends Model { public id!: string; public pm_schedule_id!: string; public description!: string; }
PMTask.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pm_schedule_id: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'pm_tasks', timestamps: true, createdAt: 'created_at', updatedAt: false });

class PMPart extends Model { public id!: string; public pm_schedule_id!: string; public inventory_item_id!: string; public quantity_required!: number; }
PMPart.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pm_schedule_id: { type: DataTypes.UUID, allowNull: false },
    inventory_item_id: { type: DataTypes.UUID, allowNull: false },
    quantity_required: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, { sequelize, tableName: 'pm_parts', timestamps: true, createdAt: 'created_at', updatedAt: false });

class PMExecution extends Model { public id!: string; public pm_schedule_id!: string; public work_order_id!: string; public status!: string; }
PMExecution.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pm_schedule_id: { type: DataTypes.UUID, allowNull: false },
    work_order_id: { type: DataTypes.UUID, allowNull: false },
    triggered_by: { type: DataTypes.STRING(50) }, // e.g., 'TIME' or 'METER'
    status: { type: DataTypes.ENUM('generated', 'completed', 'skipped'), defaultValue: 'generated' },
    actual_completion_date: { type: DataTypes.DATE },
}, { sequelize, tableName: 'pm_executions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

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
}, { sequelize, tableName: 'audit_logs', timestamps: true, createdAt: 'created_at', updatedAt: false, paranoid: true, deletedAt: 'deleted_at' });

class InventoryItem extends Model { 
    public id!: string; 
    public org_id!: string; 
    public site_id?: string | null; 
    public name!: string;
    public quantity!: number;
    public is_active!: boolean;
    public readonly deleted_at!: Date | null;
}
InventoryItem.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    site_id: { type: DataTypes.UUID, allowNull: true },
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
}, { sequelize, tableName: 'inventory_items', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class WOComment extends Model { public id!: string; }
WOComment.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    work_order_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'wo_comments', timestamps: true, createdAt: 'created_at', updatedAt: false, paranoid: true, deletedAt: 'deleted_at' });

class Notification extends Model { public id!: string; }
Notification.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    link: { type: DataTypes.STRING },
}, { sequelize, tableName: 'notifications', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at', paranoid: true, deletedAt: 'deleted_at' });

class WorkOrderInventoryItem extends Model { public id!: string; public quantity_used!: number; }
WorkOrderInventoryItem.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    work_order_id: { type: DataTypes.UUID, allowNull: false },
    inventory_item_id: { type: DataTypes.UUID, allowNull: false },
    quantity_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, { sequelize, tableName: 'work_order_inventory_items', timestamps: true, createdAt: 'created_at', updatedAt: false, paranoid: true, deletedAt: 'deleted_at' });

class WOAttachment extends Model { public id!: string; public file_path!: string; }
WOAttachment.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    work_order_id: { type: DataTypes.UUID, allowNull: false },
    file_path: { type: DataTypes.STRING, allowNull: false },
}, { sequelize, tableName: 'wo_attachments', timestamps: true, createdAt: 'created_at', updatedAt: false, paranoid: true, deletedAt: 'deleted_at' });


// Associations
Organization.hasMany(User, { foreignKey: 'org_id' });
User.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(Role, { foreignKey: 'org_id' });
Role.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(Group, { foreignKey: 'org_id' });
Group.belongsTo(Organization, { foreignKey: 'org_id' });

// RBAC Associations
Role.belongsToMany(Access, { through: 'role_accesses', foreignKey: 'role_id', otherKey: 'access_id' });
Access.belongsToMany(Role, { through: 'role_accesses', foreignKey: 'access_id', otherKey: 'role_id' });

User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id' });

User.belongsToMany(Group, { through: 'user_groups', foreignKey: 'user_id', otherKey: 'group_id' });
Group.belongsToMany(User, { through: 'user_groups', foreignKey: 'group_id', otherKey: 'user_id' });

Group.belongsToMany(Role, { through: 'group_roles', foreignKey: 'group_id', otherKey: 'role_id' });
Role.belongsToMany(Group, { through: 'group_roles', foreignKey: 'role_id', otherKey: 'group_id' });

// Old association to remove, but I'll remove it entirely.
// Role.hasMany(User, { foreignKey: 'role_id' });
// User.belongsTo(Role, { foreignKey: 'role_id' });

Organization.hasMany(Asset, { foreignKey: 'org_id' });
Asset.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(WorkOrder, { foreignKey: 'org_id' });
WorkOrder.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(PMSchedule, { foreignKey: 'org_id' });
PMSchedule.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(InventoryItem, { foreignKey: 'org_id' });
InventoryItem.belongsTo(Organization, { foreignKey: 'org_id', as: 'org' });

Asset.hasMany(WorkOrder, { foreignKey: 'asset_id', as: 'work_orders' });
WorkOrder.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });

Asset.hasMany(PMSchedule, { foreignKey: 'asset_id', as: 'pm_schedules' });
PMSchedule.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });

PMSchedule.hasMany(PMTrigger, { as: 'triggers', foreignKey: 'pm_schedule_id' });
PMTrigger.belongsTo(PMSchedule, { foreignKey: 'pm_schedule_id' });

PMSchedule.hasOne(PMTemplate, { as: 'template', foreignKey: 'pm_schedule_id' });
PMTemplate.belongsTo(PMSchedule, { foreignKey: 'pm_schedule_id' });

PMSchedule.hasMany(PMTask, { as: 'tasks', foreignKey: 'pm_schedule_id' });
PMTask.belongsTo(PMSchedule, { foreignKey: 'pm_schedule_id' });

PMSchedule.hasMany(PMPart, { as: 'parts', foreignKey: 'pm_schedule_id' });
PMPart.belongsTo(PMSchedule, { foreignKey: 'pm_schedule_id' });

PMPart.belongsTo(InventoryItem, { as: 'item', foreignKey: 'inventory_item_id' });

PMSchedule.hasMany(PMExecution, { as: 'executions', foreignKey: 'pm_schedule_id' });
PMExecution.belongsTo(PMSchedule, { foreignKey: 'pm_schedule_id' });
WorkOrder.hasMany(PMExecution, { foreignKey: 'work_order_id', onDelete: 'CASCADE' });
PMExecution.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

User.hasMany(WorkOrder, { as: 'assigned_work_orders', foreignKey: 'assignee_id' });
WorkOrder.belongsTo(User, { as: 'assignee', foreignKey: 'assignee_id' });

User.hasMany(WorkOrder, { as: 'created_work_orders', foreignKey: 'requester_id' });
WorkOrder.belongsTo(User, { as: 'requester', foreignKey: 'requester_id' });

WorkOrder.hasMany(WOComment, { as: 'comments', foreignKey: 'work_order_id', onDelete: 'CASCADE' });
WOComment.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

User.hasMany(WOComment, { foreignKey: 'user_id' });
WOComment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

WorkOrder.hasMany(WorkOrderInventoryItem, { as: 'used_parts', foreignKey: 'work_order_id', onDelete: 'CASCADE' });
WorkOrderInventoryItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

InventoryItem.hasMany(WorkOrderInventoryItem, { foreignKey: 'inventory_item_id' });
WorkOrderInventoryItem.belongsTo(InventoryItem, { as: 'item', foreignKey: 'inventory_item_id' });

WorkOrder.hasMany(WOAttachment, { as: 'attachments', foreignKey: 'work_order_id', onDelete: 'CASCADE' });
WOAttachment.belongsTo(WorkOrder, { foreignKey: 'work_order_id' });

// Organization -> Sites
Organization.hasMany(Site, { foreignKey: 'org_id' });
Site.belongsTo(Organization, { foreignKey: 'org_id' });

// Site -> Facility Manager (1:1)
Site.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasOne(Site, { as: 'managed_site', foreignKey: 'manager_id' });

// Site -> Technicians (1:N)
Site.hasMany(User, { as: 'technicians', foreignKey: 'site_id' });
User.belongsTo(Site, { as: 'site', foreignKey: 'site_id' });

// Site -> Assets (1:N)
Site.hasMany(Asset, { as: 'assets', foreignKey: 'site_id' });
Asset.belongsTo(Site, { as: 'site', foreignKey: 'site_id' });

// Site -> WorkOrders (1:N)
Site.hasMany(WorkOrder, { as: 'work_orders', foreignKey: 'site_id' });
WorkOrder.belongsTo(Site, { as: 'site', foreignKey: 'site_id' });

// Site -> InventoryItems (1:N)
Site.hasMany(InventoryItem, { as: 'inventory_items', foreignKey: 'site_id' });
InventoryItem.belongsTo(Site, { as: 'site', foreignKey: 'site_id' });
// Site -> PMSchedules (1:N)
Site.hasMany(PMSchedule, { as: 'pm_schedules', foreignKey: 'site_id' });
PMSchedule.belongsTo(Site, { as: 'site', foreignKey: 'site_id' });

// Organization -> PMSchedules (1:N)
Organization.hasMany(PMSchedule, { foreignKey: 'org_id' });
PMSchedule.belongsTo(Organization, { as: 'organization', foreignKey: 'org_id' });


export {
    Organization,
    Site,
    Role,
    Access,
    Group,
    User,
    Asset,
    WorkOrder,
    PMSchedule,
    PMTrigger,
    PMTemplate,
    PMTask,
    PMPart,
    PMExecution,
    AuditLog,
    InventoryItem,
    WOComment,
    Notification,
    WorkOrderInventoryItem,
    WOAttachment,
    sequelize
};
