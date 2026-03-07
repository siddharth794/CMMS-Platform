'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if tables already exist to make this baseline migration safe
    // for both fresh databases and existing ones that used sequelize.sync() previously.
    const tableNames = await queryInterface.showAllTables();
    const hasOrgTable = tableNames.includes('organizations');

    if (hasOrgTable) {
        // If the organizations table exists, assume the schema is already present
        // (This prevents errors if the user already ran the app with sequelize.sync())
        console.log('Database already contains schema. Marking initial migration as completed.');
        return;
    }

    // organizations
    await queryInterface.createTable('organizations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      address: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // roles
    await queryInterface.createTable('roles', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(500) },
      permissions: { type: Sequelize.JSON, defaultValue: {} },
      is_system_role: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      role_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      username: { type: Sequelize.STRING(100), allowNull: false },
      first_name: { type: Sequelize.STRING(100) },
      last_name: { type: Sequelize.STRING(100) },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING(20) },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      last_login: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // assets
    await queryInterface.createTable('assets', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      asset_tag: { type: Sequelize.STRING(100), unique: true },
      asset_type: { type: Sequelize.ENUM('movable', 'immovable'), defaultValue: 'movable' },
      category: { type: Sequelize.STRING(100) },
      description: { type: Sequelize.TEXT },
      location: { type: Sequelize.STRING },
      manufacturer: { type: Sequelize.STRING },
      model: { type: Sequelize.STRING },
      serial_number: { type: Sequelize.STRING },
      purchase_date: { type: Sequelize.DATE },
      purchase_cost: { type: Sequelize.STRING(50) },
      warranty_expiry: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(50), defaultValue: 'active' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // pm_schedules
    await queryInterface.createTable('pm_schedules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      asset_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'assets', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      frequency_type: { type: Sequelize.STRING(50), defaultValue: 'days' },
      frequency_value: { type: Sequelize.INTEGER, allowNull: false },
      priority: { type: Sequelize.STRING(50), defaultValue: 'medium' },
      estimated_hours: { type: Sequelize.INTEGER },
      last_generated: { type: Sequelize.DATE },
      next_due: { type: Sequelize.DATE, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // audit_logs
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      user_email: { type: Sequelize.STRING },
      entity_type: { type: Sequelize.STRING(100), allowNull: false },
      entity_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING(50), allowNull: false },
      old_values: { type: Sequelize.JSON },
      new_values: { type: Sequelize.JSON },
      ip_address: { type: Sequelize.STRING(50) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // inventory_items
    await queryInterface.createTable('inventory_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      sku: { type: Sequelize.STRING(100) },
      category: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      min_quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
      unit: { type: Sequelize.STRING(50), defaultValue: 'pcs' },
      unit_cost: { type: Sequelize.STRING(50), defaultValue: '0' },
      storage_location: { type: Sequelize.STRING, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // work_orders
    await queryInterface.createTable('work_orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      wo_number: { type: Sequelize.STRING(50), unique: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      asset_id: { type: Sequelize.UUID, references: { model: 'assets', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      assignee_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      requester_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'), defaultValue: 'new' },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
      location: { type: Sequelize.STRING(100) },
      scheduled_start: { type: Sequelize.DATE },
      scheduled_end: { type: Sequelize.DATE },
      actual_start: { type: Sequelize.DATE },
      actual_end: { type: Sequelize.DATE },
      estimated_hours: { type: Sequelize.INTEGER },
      actual_hours: { type: Sequelize.INTEGER },
      notes: { type: Sequelize.TEXT },
      is_pm_generated: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // wo_comments
    await queryInterface.createTable('wo_comments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      work_order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'work_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      message: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      link: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // work_order_inventory_items
    await queryInterface.createTable('work_order_inventory_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      work_order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'work_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      inventory_item_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'inventory_items', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      quantity_used: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });

    // wo_attachments
    await queryInterface.createTable('wo_attachments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      work_order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'work_orders', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      file_path: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop all tables in reverse order of creation
    await queryInterface.dropTable('wo_attachments');
    await queryInterface.dropTable('work_order_inventory_items');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('wo_comments');
    await queryInterface.dropTable('work_orders');
    await queryInterface.dropTable('inventory_items');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('pm_schedules');
    await queryInterface.dropTable('assets');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('organizations');
  }
};
