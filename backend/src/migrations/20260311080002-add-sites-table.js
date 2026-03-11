'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Create sites table
    await queryInterface.createTable('sites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT
      },
      city: {
        type: Sequelize.STRING(100)
      },
      state: {
        type: Sequelize.STRING(100)
      },
      zip_code: {
        type: Sequelize.STRING(20)
      },
      country: {
        type: Sequelize.STRING(100)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      manager_id: {
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 2. Add site_id to users
    await queryInterface.addColumn('users', 'site_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'sites',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 3. Add unique constraint on name and org_id
    await queryInterface.addConstraint('sites', {
      fields: ['name', 'org_id'],
      type: 'unique',
      name: 'unique_site_name_per_org'
    });

    // 4. Add unique constraint on manager_id (1 FM -> 1 Site)
    // Actually, SQLite doesn't strictly need it if we handle it in app, but we will add it.
    // Wait, manager_id is nullable, unique constraints in postgres allow multiple nulls, in MySQL it depends.
    // It's safer to just handle it at app level or add it. I'll add the constraint.
    await queryInterface.addConstraint('sites', {
      fields: ['manager_id'],
      type: 'unique',
      name: 'unique_manager_per_site'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove site_id from users
    await queryInterface.removeColumn('users', 'site_id');
    
    // Drop sites table (constraints will be dropped automatically)
    await queryInterface.dropTable('sites');
  }
};
