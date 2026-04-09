'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Create floors table
      await queryInterface.createTable('floors', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        org_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        site_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'sites',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        level: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 2. Create areas table
      await queryInterface.createTable('areas', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        org_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        floor_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'floors',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        type: {
          type: Sequelize.ENUM('washroom', 'food_court', 'corridor', 'parking', 'other'),
          defaultValue: 'other'
        },
        qr_code_hash: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          unique: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 3. Create area_checklist_schedules table
      await queryInterface.createTable('area_checklist_schedules', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        org_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        area_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'areas',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        checklist_template_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'checklists',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        cron_expression: {
          type: Sequelize.STRING,
          allowNull: false
        },
        assigned_group_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'groups',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 4. Create area_checklist_executions table
      await queryInterface.createTable('area_checklist_executions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        org_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        schedule_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'area_checklist_schedules',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        area_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'areas',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        checklist_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'checklists',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED'),
          defaultValue: 'PENDING'
        },
        scheduled_for: {
          type: Sequelize.DATE,
          allowNull: false
        },
        started_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        completed_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        completed_by: {
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
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // 5. Add foreign keys to checklists table
      const checklistsDesc = await queryInterface.describeTable('checklists');
      
      if (!checklistsDesc.area_id) {
        await queryInterface.addColumn('checklists', 'area_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'areas',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }

      if (!checklistsDesc.area_execution_id) {
        await queryInterface.addColumn('checklists', 'area_execution_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'area_checklist_executions',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const checklistsDesc = await queryInterface.describeTable('checklists');

      // 1. Remove foreign keys from checklists table
      if (checklistsDesc.area_execution_id) {
        await queryInterface.removeColumn('checklists', 'area_execution_id', { transaction });
      }
      if (checklistsDesc.area_id) {
        await queryInterface.removeColumn('checklists', 'area_id', { transaction });
      }

      // 2. Drop new tables in reverse order
      await queryInterface.dropTable('area_checklist_executions', { transaction });
      await queryInterface.dropTable('area_checklist_schedules', { transaction });
      await queryInterface.dropTable('areas', { transaction });
      await queryInterface.dropTable('floors', { transaction });

      // 3. Drop Custom Types (Only applicable for PostgreSQL, MySQL handles ENUMs inline)
      // MySQL does not use DROP TYPE for ENUMs since they are column-level
      // The DROP TABLE commands above already destroy the associated ENUMs in MySQL.

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
