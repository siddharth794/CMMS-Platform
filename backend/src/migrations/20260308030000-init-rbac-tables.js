'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create accesses table
    await queryInterface.createTable('accesses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      module: { type: Sequelize.STRING },
      org_id: { type: Sequelize.UUID, allowNull: true },
      is_system: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 2. Create role_accesses junction table
    await queryInterface.createTable('role_accesses', {
      role_id: { type: Sequelize.INTEGER, allowNull: false },
      access_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    
    await queryInterface.addConstraint('role_accesses', {
      fields: ['role_id', 'access_id'],
      type: 'primary key',
      name: 'role_accesses_pkey'
    });

    // 3. Create user_roles junction table
    await queryInterface.createTable('user_roles', {
      user_id: { type: Sequelize.UUID, allowNull: false },
      role_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    
    await queryInterface.addConstraint('user_roles', {
      fields: ['user_id', 'role_id'],
      type: 'primary key',
      name: 'user_roles_pkey'
    });

    // 4. Migrate users.role_id data to user_roles
    await queryInterface.sequelize.query(`
      INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
      SELECT id, role_id, NOW(), NOW() FROM users WHERE role_id IS NOT NULL;
    `);

    // 5. Remove role_id from users table
    await queryInterface.removeColumn('users', 'role_id');
    
    // 6. Remove permissions column from roles table
    await queryInterface.removeColumn('roles', 'permissions');

    // 7. Create groups table
    await queryInterface.createTable('groups', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      org_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // 8. Create user_groups junction table
    await queryInterface.createTable('user_groups', {
      user_id: { type: Sequelize.UUID, allowNull: false },
      group_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('user_groups', {
      fields: ['user_id', 'group_id'],
      type: 'primary key',
      name: 'user_groups_pkey'
    });

    // 9. Create group_roles junction table
    await queryInterface.createTable('group_roles', {
      group_id: { type: Sequelize.UUID, allowNull: false },
      role_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('group_roles', {
      fields: ['group_id', 'role_id'],
      type: 'primary key',
      name: 'group_roles_pkey'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('group_roles');
    await queryInterface.dropTable('user_groups');
    await queryInterface.dropTable('groups');

    // Re-add columns
    await queryInterface.addColumn('roles', 'permissions', { type: Sequelize.JSON, defaultValue: {} });
    await queryInterface.addColumn('users', 'role_id', { type: Sequelize.INTEGER, allowNull: true });
    
    // Reverse Data Migration
    await queryInterface.sequelize.query(`
      UPDATE users u
      JOIN (
        SELECT user_id, MIN(role_id) as role_id FROM user_roles GROUP BY user_id
      ) ur ON u.id = ur.user_id
      SET u.role_id = ur.role_id;
    `);

    // Require role_id
    await queryInterface.changeColumn('users', 'role_id', { type: Sequelize.INTEGER, allowNull: false });
    
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('role_accesses');
    await queryInterface.dropTable('accesses');
  }
};
