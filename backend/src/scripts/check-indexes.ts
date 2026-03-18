import { sequelize } from '../models';

async function check() {
    try {
        const [results]: any = await sequelize.query("SHOW INDEX FROM assets");
        const indexes = results.reduce((acc: any, curr: any) => {
            if (!acc[curr.Key_name]) {
                acc[curr.Key_name] = { columns: [], unique: curr.Non_unique === 0 };
            }
            acc[curr.Key_name].columns.push(curr.Column_name);
            return acc;
        }, {});
        console.log('--- INDEXES ON ASSETS TABLE ---');
        console.log(JSON.stringify(indexes, null, 2));
    } catch (err: any) {
        console.error('Error checking indexes:', err);
    } finally {
        await sequelize.close();
    }
}

check();
