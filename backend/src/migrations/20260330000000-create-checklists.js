'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('checklists', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      org_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'organizations', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      is_template: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_required: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      
      // Foreign keys for linking
      asset_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'assets', key: 'id' }, onDelete: 'CASCADE' },
      pm_schedule_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'pm_schedules', key: 'id' }, onDelete: 'CASCADE' },
      work_order_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'work_orders', key: 'id' }, onDelete: 'CASCADE' },
      
      created_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    await queryInterface.createTable('checklist_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      checklist_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'checklists', key: 'id' }, onDelete: 'CASCADE' },
      description: { type: Sequelize.STRING(500), allowNull: false },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      is_completed: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      
      completed_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // Indexes for fast lookups
    await queryInterface.addIndex('checklists', ['org_id']);
    await queryInterface.addIndex('checklists', ['asset_id']);
    await queryInterface.addIndex('checklists', ['pm_schedule_id']);
    await queryInterface.addIndex('checklists', ['work_order_id']);
    await queryInterface.addIndex('checklist_items', ['checklist_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checklist_items');
    await queryInterface.dropTable('checklists');
  }
};
