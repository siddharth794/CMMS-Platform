'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Ensure the new accesses are inserted into the system
      const newAccesses = [
        { id: uuidv4(), name: 'area:view', module: 'Areas', description: 'View locations, areas, and schedules', created_at: new Date(), updated_at: new Date() },
        { id: uuidv4(), name: 'area:manage', module: 'Areas', description: 'Create and edit floors, areas, and area schedules', created_at: new Date(), updated_at: new Date() },
        { id: uuidv4(), name: 'area_tasks:execute', module: 'Areas', description: 'Verify area QR codes and complete area checklists', created_at: new Date(), updated_at: new Date() }
      ];

      // Use INSERT IGNORE/ON DUPLICATE KEY equivalent to avoid crashes if they exist
      for (const access of newAccesses) {
        await queryInterface.sequelize.query(
          `INSERT INTO accesses (id, name, module, description, created_at, updated_at) 
           SELECT :id, :name, :module, :description, :created_at, :updated_at 
           WHERE NOT EXISTS (SELECT 1 FROM accesses WHERE name = :name);`,
          {
            replacements: access,
            type: queryInterface.sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }

      // 2. We need to create the new "Cleaning_Staff" role for the system.
      const orgs = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (orgs.length === 0) {
        await transaction.commit();
        return;
      }

      const cleaningStaffRoles = [];
      
      for (const org of orgs) {
        // Check if role already exists for this org
        const existingRole = await queryInterface.sequelize.query(
          `SELECT id FROM roles WHERE org_id = :orgId AND name = 'Cleaning_Staff';`,
          { replacements: { orgId: org.id }, type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        if (existingRole.length === 0) {
          const roleId = uuidv4();
          cleaningStaffRoles.push({
            id: roleId,
            org_id: org.id,
            name: 'Cleaning_Staff',
            description: 'Executes area-based checklists',
            is_system_role: true,
            created_at: new Date()
          });
        }
      }

      if (cleaningStaffRoles.length > 0) {
        await queryInterface.bulkInsert('roles', cleaningStaffRoles, { transaction });

        // 3. Map Accesses to the new role
        const roleAccesses = [];
        const accessRows = await queryInterface.sequelize.query(
          `SELECT id, name FROM accesses WHERE name IN ('area:view', 'area_tasks:execute', 'checklist:execute');`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        for (const role of cleaningStaffRoles) {
          for (const access of accessRows) {
            roleAccesses.push({
              role_id: role.id,
              access_id: access.id,
              created_at: new Date()
            });
          }
        }

        if (roleAccesses.length > 0) {
          for (const ra of roleAccesses) {
             await queryInterface.sequelize.query(
              `INSERT IGNORE INTO role_accesses (role_id, access_id, created_at) VALUES (:role_id, :access_id, :created_at)`,
              { replacements: ra, type: queryInterface.sequelize.QueryTypes.INSERT, transaction }
            );
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Delete the accesses from accesses table
      await queryInterface.bulkDelete('accesses', {
        name: ['area:view', 'area:manage', 'area_tasks:execute']
      }, { transaction });

      // Delete the Cleaning_Staff roles
      await queryInterface.bulkDelete('roles', {
        name: 'Cleaning_Staff',
        is_system_role: true
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
