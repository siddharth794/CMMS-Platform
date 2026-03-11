import { DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { Site, User } from '../models';

async function syncSites() {
    console.log('Synchronizing Site model...');
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Create sites table
        await Site.sync({ alter: true });
        console.log('Sites table synchronized.');

        // 2. Add site_id to Users table if it doesn't exist
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('users');
        if (!tableDescription.site_id) {
            console.log('Adding site_id column to users table...');
            await queryInterface.addColumn('users', 'site_id', {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'sites',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            console.log('site_id column added to users table.');
        } else {
            console.log('site_id column already exists in users table.');
        }

        console.log('Successfully synchronized sites and users tables.');
    } catch (error) {
        console.error('Failed to sync tables:', error);
    } finally {
        await sequelize.close();
    }
}

syncSites();
