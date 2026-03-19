'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Find and drop the existing unique index on asset_tag
    // In MySQL, unique: true usually creates an index named column_name (asset_tag)
    // or sometimes asset_tag_unique. We'll try to drop 'asset_tag' first as per createTable usage.
    try {
      await queryInterface.removeIndex('assets', 'asset_tag');
    } catch (err) {}
    try {
      await queryInterface.removeIndex('assets', 'asset_tag_2');
    } catch (err) {}
    try {
      await queryInterface.removeIndex('assets', 'asset_tag_3');
    } catch (err) {}
    try {
      await queryInterface.removeIndex('assets', 'asset_tag_4');
    } catch (err) {}
    try {
      await queryInterface.removeIndex('assets', 'assets_asset_tag_unique');
    } catch (err) {}

    // 2. Add the new composite unique index
    await queryInterface.addIndex('assets', ['org_id', 'asset_tag'], {
      unique: true,
      name: 'org_asset_tag_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Remove the new composite index
    await queryInterface.removeIndex('assets', 'org_asset_tag_unique');

    // 2. Add back the old unique index on asset_tag
    await queryInterface.addIndex('assets', ['asset_tag'], {
      unique: true,
      name: 'asset_tag'
    });
  }
};
