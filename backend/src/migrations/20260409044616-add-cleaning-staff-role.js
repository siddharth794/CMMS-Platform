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

      // 2. Create the "Cleaning_Staff" role for each organization.
      const orgs = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      if (orgs.length === 0) {
        await transaction.commit();
        return;
      }

      // roles.id is INTEGER AUTO_INCREMENT — do NOT specify id, let MySQL handle it
      const insertedRoleIds = [];

      for (const org of orgs) {
        const existingRole = await queryInterface.sequelize.query(
          `SELECT id FROM roles WHERE org_id = :orgId AND name = 'Cleaning_Staff';`,
          { replacements: { orgId: org.id }, type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        if (existingRole.length === 0) {
          await queryInterface.sequelize.query(
            `INSERT INTO roles (org_id, name, description, is_system_role, is_active, created_at)
             VALUES (:org_id, :name, :description, :is_system_role, :is_active, :created_at);`,
            {
              replacements: {
                org_id: org.id,
                name: 'Cleaning_Staff',
                description: 'Executes area-based checklists',
                is_system_role: true,
                is_active: true,
                created_at: new Date()
              },
              type: queryInterface.sequelize.QueryTypes.INSERT,
              transaction
            }
          );

          // Query back the auto-incremented id
          const [inserted] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE org_id = :orgId AND name = 'Cleaning_Staff';`,
            { replacements: { orgId: org.id }, type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
          );
          if (inserted) {
            insertedRoleIds.push(inserted.id);
          }
        }
      }

      // 3. Map Accesses to the new roles
      if (insertedRoleIds.length > 0) {
        const accessRows = await queryInterface.sequelize.query(
          `SELECT id, name FROM accesses WHERE name IN ('area:view', 'area_tasks:execute', 'checklist:execute');`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
        );

        for (const roleId of insertedRoleIds) {
          for (const access of accessRows) {
            await queryInterface.sequelize.query(
              `INSERT IGNORE INTO role_accesses (role_id, access_id, created_at, updated_at) VALUES (:role_id, :access_id, :created_at, :updated_at)`,
              {
                replacements: { role_id: roleId, access_id: access.id, created_at: new Date(), updated_at: new Date() },
                type: queryInterface.sequelize.QueryTypes.INSERT,
                transaction
              }
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
      // Delete role_accesses for Cleaning_Staff roles first
      await queryInterface.sequelize.query(
        `DELETE ra FROM role_accesses ra
         INNER JOIN roles r ON ra.role_id = r.id
         WHERE r.name = 'Cleaning_Staff' AND r.is_system_role = true;`,
        { transaction }
      );

      // Delete the accesses
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
