'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists first to avoid errors if partially applied
    const tableInfo = await queryInterface.describeTable('work_orders');
    if (!tableInfo.resolution_notes) {
      await queryInterface.addColumn('work_orders', 'resolution_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'notes' // Optional: placement after the 'notes' column
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('work_orders', 'resolution_notes');
  }
};
