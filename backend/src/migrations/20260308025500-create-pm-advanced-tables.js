'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. pm_triggers
    await queryInterface.createTable('pm_triggers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pm_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pm_schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      trigger_type: {
        type: Sequelize.ENUM('TIME', 'METER'),
        defaultValue: 'TIME'
      },
      cron_expression: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      meter_interval: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      lead_time_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 2. pm_templates
    await queryInterface.createTable('pm_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pm_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pm_schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      estimated_hours: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      assignee_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 3. pm_parts
    await queryInterface.createTable('pm_parts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pm_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pm_schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      inventory_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inventory_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity_required: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 4. pm_executions
    await queryInterface.createTable('pm_executions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pm_schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pm_schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'work_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      triggered_by: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('generated', 'completed', 'skipped'),
        defaultValue: 'generated'
      },
      actual_completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pm_executions');
    await queryInterface.dropTable('pm_parts');
    await queryInterface.dropTable('pm_templates');
    await queryInterface.dropTable('pm_triggers');
  }
};
