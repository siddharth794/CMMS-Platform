'use strict';

/**
 * Adds site_id FK to users, assets, work_orders, inventory_items, pm_schedules.
 * Removes legacy pm_schedules columns and adds schedule_logic + is_paused to match the model.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- Add site_id to users ---
    await queryInterface.addColumn('users', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // --- Add site_id to assets ---
    await queryInterface.addColumn('assets', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // --- Add site_id to work_orders ---
    await queryInterface.addColumn('work_orders', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // --- Add site_id to inventory_items ---
    await queryInterface.addColumn('inventory_items', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // --- Update pm_schedules: add new columns ---
    await queryInterface.addColumn('pm_schedules', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'sites', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('pm_schedules', 'schedule_logic', {
      type: Sequelize.ENUM('FIXED', 'FLOATING'),
      defaultValue: 'FIXED'
    });

    await queryInterface.addColumn('pm_schedules', 'is_paused', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    // --- Remove legacy pm_schedules columns ---
    await queryInterface.removeColumn('pm_schedules', 'frequency_type');
    await queryInterface.removeColumn('pm_schedules', 'frequency_value');
    await queryInterface.removeColumn('pm_schedules', 'priority');
    await queryInterface.removeColumn('pm_schedules', 'estimated_hours');
    await queryInterface.removeColumn('pm_schedules', 'last_generated');
    await queryInterface.removeColumn('pm_schedules', 'next_due');
  },

  async down(queryInterface, Sequelize) {
    // Re-add legacy columns
    await queryInterface.addColumn('pm_schedules', 'frequency_type', {
      type: Sequelize.STRING(50),
      defaultValue: 'days'
    });
    await queryInterface.addColumn('pm_schedules', 'frequency_value', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await queryInterface.addColumn('pm_schedules', 'priority', {
      type: Sequelize.STRING(50),
      defaultValue: 'medium'
    });
    await queryInterface.addColumn('pm_schedules', 'estimated_hours', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('pm_schedules', 'last_generated', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('pm_schedules', 'next_due', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // Remove new columns
    await queryInterface.removeColumn('pm_schedules', 'is_paused');
    await queryInterface.removeColumn('pm_schedules', 'schedule_logic');
    await queryInterface.removeColumn('pm_schedules', 'site_id');

    // Remove site_id from other tables
    await queryInterface.removeColumn('inventory_items', 'site_id');
    await queryInterface.removeColumn('work_orders', 'site_id');
    await queryInterface.removeColumn('assets', 'site_id');
    await queryInterface.removeColumn('users', 'site_id');
  }
};
