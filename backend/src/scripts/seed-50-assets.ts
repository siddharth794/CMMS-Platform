import { Asset, sequelize } from '../models';

const ORG_ID = '81808758-8f23-426d-ba0e-581f44a257ab';

async function seedAssets() {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        console.log(`Seeding 50 assets for Organization ID: ${ORG_ID}`);

        const assetsData = [];
        const categories = ['HVAC', 'Vehicles', 'IT Equipment', 'Plumbing', 'Electrical'];
        const locations = ['Roof', 'Warehouse 1', 'Server Room', 'Basement', 'Main Floor'];

        for (let i = 1; i <= 50; i++) {
            const isMovable = i % 2 === 0;
            const category = categories[i % categories.length];
            const location = locations[i % locations.length];

            assetsData.push({
                org_id: ORG_ID,
                name: `Demo Asset ${i}`,
                asset_tag: `ASSET-${Date.now()}-${i.toString().padStart(3, '0')}`,
                asset_type: isMovable ? 'movable' : 'immovable',
                category: category,
                location: location,
                manufacturer: 'Generic Manufacturer',
                model: `Model-X${i}`,
                status: 'active'
            });
        }

        // Use bulkCreate for efficient insertion of multiple records
        const createdAssets = await Asset.bulkCreate(assetsData);

        console.log(`${createdAssets.length} Assets created successfully.`);

        console.log('\n--- Seeding Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding assets data:', error);
        process.exit(1);
    }
}

seedAssets();
