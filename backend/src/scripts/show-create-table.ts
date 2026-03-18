import { sequelize } from '../models';

async function check() {
    try {
        const [results]: any = await sequelize.query("SHOW CREATE TABLE assets");
        console.log('--- CREATE TABLE ASSETS ---');
        console.log(results[0]['Create Table']);
    } catch (err: any) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}
check();
