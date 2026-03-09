'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('organizations');
    
    if (!tableInfo.owner_name) {
      await queryInterface.addColumn('organizations', 'owner_name', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'name'
      });
    }

    if (!tableInfo.website_url) {
      await queryInterface.addColumn('organizations', 'website_url', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'owner_name'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('organizations', 'owner_name');
    await queryInterface.removeColumn('organizations', 'website_url');
  }
};
