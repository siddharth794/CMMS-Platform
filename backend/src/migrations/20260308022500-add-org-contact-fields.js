'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('organizations');
    
    if (!tableInfo.email) {
      await queryInterface.addColumn('organizations', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'website_url'
      });
    }

    if (!tableInfo.phone) {
      await queryInterface.addColumn('organizations', 'phone', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'email'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('organizations', 'email');
    await queryInterface.removeColumn('organizations', 'phone');
  }
};
