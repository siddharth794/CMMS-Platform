import { sequelize } from '../models';

async function cleanup() {
    try {
        console.log('--- Cleaning up extra indexes ---');
        const indexesToDrop = ['asset_tag', 'asset_tag_2', 'asset_tag_3', 'asset_tag_4', 'assets_asset_tag_unique'];
        
        for (const idx of indexesToDrop) {
            try {
                console.log(`Dropping index: ${idx}...`);
                await sequelize.query(`DROP INDEX \`${idx}\` ON assets`);
                console.log(`Successfully dropped ${idx}`);
            } catch (err: any) {
                console.log(`Could not drop ${idx} (maybe it doesn't exist): ${err.message}`);
            }
        }
        console.log('--- Cleanup completed ---');
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await sequelize.close();
    }
}

cleanup();
