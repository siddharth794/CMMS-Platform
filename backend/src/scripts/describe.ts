import { sequelize } from '../models';

async function describeRole() {
    console.log('Connecting...');
    await sequelize.authenticate();
    const [results] = await sequelize.query('SHOW CREATE TABLE roles;');
    console.log(results[0]);
}
describeRole().catch(console.error).finally(() => process.exit(0));
