import { sequelize } from '../models';

async function check() {
    try {
        const [results]: [any, any] = await sequelize.query("SHOW INDEX FROM assets") as any;
        const uniqueIndexes = results
            .filter((r: any) => r.Non_unique === 0)
            .map((r: any) => `${r.Key_name}: ${r.Column_name}`);
        console.log('UNIQUE_INDEXES_START');
        uniqueIndexes.forEach((idx: string) => console.log(idx));
        console.log('UNIQUE_INDEXES_END');
    } catch (err: any) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}
check();
