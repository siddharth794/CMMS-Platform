import { sequelize } from '../models';

async function dropAll() {
    console.log('Connecting...');
    await sequelize.authenticate();
    console.log('Disabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('Dropping all tables...');
    await sequelize.drop();
    console.log('Enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Done!');
}
dropAll().catch(console.error).finally(() => process.exit(0));
