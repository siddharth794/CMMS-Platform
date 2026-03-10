'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE work_orders 
      MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled') 
      DEFAULT 'new';
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: Reverting an ENUM could fail if there are rows containing 'pending_review'.
    // We would generally update those rows to 'in_progress' or 'open' before downgrading, but this handles the schema change.
    await queryInterface.sequelize.query(`
      ALTER TABLE work_orders 
      MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled') 
      DEFAULT 'new';
    `);
  }
};
