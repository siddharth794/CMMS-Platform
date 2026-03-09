import { Asset, InventoryItem, WorkOrder, User, sequelize } from '../models';

const ORG_ID = '81808758-8f23-426d-ba0e-581f44a257ab';

async function seedExtraDemo() {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        console.log(`Seeding extra demo data for Organization ID: ${ORG_ID}`);

        // 1. Fetch dependencies for Work Orders
        const users: any = await User.findAll({ where: { org_id: ORG_ID }, limit: 2 });
        if (users.length === 0) {
            console.error('No users found for this organization. Please seed users first.');
            process.exit(1);
        }
        const requesterId = users[0].id;
        const assigneeId = users[1] ? users[1].id : users[0].id;

        const assets: any = await Asset.findAll({ where: { org_id: ORG_ID }, limit: 50 });
        if (assets.length === 0) {
            console.error('No assets found for this organization. Please seed assets first.');
            process.exit(1);
        }

        // 2. Seed 50 Inventory Items
        console.log('Seeding 50 Inventory Items...');
        const inventoryData = [];
        const invCategories = ['Mechanical', 'Electrical', 'Cleaning', 'Safety', 'Fasteners'];

        for (let i = 1; i <= 50; i++) {
            inventoryData.push({
                org_id: ORG_ID,
                name: `Demo Part ${i}`,
                sku: `SKU-${Date.now()}-${i.toString().padStart(3, '0')}`,
                category: invCategories[i % invCategories.length],
                description: `Description for demo part ${i}`,
                quantity: Math.floor(Math.random() * 100) + 10,
                min_quantity: 5,
                unit: 'pcs',
                unit_cost: (Math.random() * 50 + 5).toFixed(2),
                storage_location: `Warehouse 1 - Bin ${i}`
            });
        }
        const createdInventory = await InventoryItem.bulkCreate(inventoryData);
        console.log(`${createdInventory.length} Inventory items created.`);

        // 3. Seed 50 Work Orders
        console.log('Seeding 50 Work Orders...');
        const woData = [];
        const statuses: ('new' | 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled')[] =
            ['new', 'open', 'in_progress', 'on_hold', 'completed'];
        const priorities: ('low' | 'medium' | 'high' | 'critical')[] =
            ['low', 'medium', 'high', 'critical'];

        for (let i = 1; i <= 50; i++) {
            const asset = assets[i % assets.length];
            woData.push({
                org_id: ORG_ID,
                wo_number: `WO-${Date.now()}-${i.toString().padStart(3, '0')}`,
                title: `Demo Maintenance Task ${i}`,
                description: `This is a generated demo work order number ${i} for ${asset.name}.`,
                asset_id: asset.id,
                requester_id: requesterId,
                assignee_id: assigneeId,
                status: statuses[i % statuses.length],
                priority: priorities[i % priorities.length],
                location: asset.location || 'Main Site',
                estimated_hours: Math.floor(Math.random() * 8) + 1
            });
        }
        const createdWO = await WorkOrder.bulkCreate(woData);
        console.log(`${createdWO.length} Work Orders created.`);

        console.log('\n--- Extra Seeding Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding extra demo data:', error);
        process.exit(1);
    }
}

seedExtraDemo();
