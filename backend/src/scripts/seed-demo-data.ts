import { Asset, InventoryItem, WorkOrder, User, sequelize, WorkOrderInventoryItem, Organization } from '../models';

async function seedDemoData() {
    try {
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        // Dynamically get the first organization
        const organization: any = await Organization.findOne();
        if (!organization) {
            console.error('No organization found. Please run the base seed script first.');
            process.exit(1);
        }
        const ORG_ID = organization.id;

        console.log(`Seeding demo data for Organization: ${organization.name} (ID: ${ORG_ID})`);

        // Get a user to act as requester and assignee (if available)
        const users: any = await User.findAll({ where: { org_id: ORG_ID }, limit: 2 });
        const requesterId = users.length > 0 ? users[0].id : null;
        const assigneeId = users.length > 1 ? users[1].id : (users.length > 0 ? users[0].id : null);

        // 1. Seed Assets
        console.log('Seeding Assets...');
        const assetsData = [
            {
                org_id: ORG_ID,
                name: 'HVAC Unit 01',
                asset_tag: `HVAC - ${Date.now()}-01`,
                asset_type: 'immovable',
                category: 'HVAC',
                location: 'Roof - Main Building',
                manufacturer: 'Carrier',
                model: 'X-200',
                status: 'active'
            },
            {
                org_id: ORG_ID,
                name: 'Forklift A',
                asset_tag: `FL - ${Date.now()}-01`,
                asset_type: 'movable',
                category: 'Vehicles',
                location: 'Warehouse 1',
                manufacturer: 'Toyota',
                model: 'Electric Forklift',
                status: 'active'
            },
            {
                org_id: ORG_ID,
                name: 'Main Server Rack',
                asset_tag: `IT - ${Date.now()}-01`,
                asset_type: 'immovable',
                category: 'IT Equipment',
                location: 'Server Room',
                manufacturer: 'Dell',
                status: 'active'
            }
        ];

        const createdAssets = [];
        for (const data of assetsData) {
            const asset: any = await Asset.create(data);
            createdAssets.push(asset);
        }
        console.log(`${createdAssets.length} Assets created.`);

        // 2. Seed Inventory Items
        console.log('Seeding Inventory Items...');
        const inventoryData = [
            {
                org_id: ORG_ID,
                name: 'Air Filter 20x20',
                sku: `SKU - AF - ${Date.now()}`,
                category: 'HVAC Parts',
                quantity: 50,
                min_quantity: 10,
                unit: 'pcs',
                unit_cost: '15.50',
                storage_location: 'Shelf A1'
            },
            {
                org_id: ORG_ID,
                name: 'Hydraulic Fluid',
                sku: `SKU - HF - ${Date.now()}`,
                category: 'Vehicle Fluids',
                quantity: 20,
                min_quantity: 5,
                unit: 'gallons',
                unit_cost: '45.00',
                storage_location: 'Warehouse 1 - Chemical Storage'
            },
            {
                org_id: ORG_ID,
                name: 'Server Power Supply',
                sku: `SKU - SPS - ${Date.now()}`,
                category: 'IT Parts',
                quantity: 5,
                min_quantity: 2,
                unit: 'pcs',
                unit_cost: '120.00',
                storage_location: 'IT Storage Room'
            }
        ];

        const createdInventory = [];
        for (const data of inventoryData) {
            const item: any = await InventoryItem.create(data);
            createdInventory.push(item);
        }
        console.log(`${createdInventory.length} Inventory items created.`);

        // 3. Seed Work Orders
        console.log('Seeding Work Orders...');
        const woData = [
            {
                org_id: ORG_ID,
                wo_number: `WO - ${Date.now()} - 1`,
                title: 'Routine HVAC Maintenance',
                description: 'Replace air filters and check system pressure.',
                asset_id: createdAssets[0].id,
                requester_id: requesterId,
                assignee_id: assigneeId,
                status: 'in_progress',
                priority: 'medium',
                location: createdAssets[0].location,
                estimated_hours: 2
            },
            {
                org_id: ORG_ID,
                wo_number: `WO - ${Date.now()} -2`,
                title: 'Forklift Battery Check',
                description: 'Check battery fluid levels and overall performance.',
                asset_id: createdAssets[1].id,
                requester_id: requesterId,
                assignee_id: assigneeId,
                status: 'open',
                priority: 'low',
                location: createdAssets[1].location,
                estimated_hours: 1
            },
            {
                org_id: ORG_ID,
                wo_number: `WO - ${Date.now()} -3`,
                title: 'Replace Failing Power Supply',
                description: 'Server rack power supply is showing warnings, replace immediately.',
                asset_id: createdAssets[2].id,
                requester_id: requesterId,
                assignee_id: assigneeId,
                status: 'new',
                priority: 'critical',
                location: createdAssets[2].location,
                estimated_hours: 3
            }
        ];

        const createdWO = [];
        for (const data of woData) {
            const wo: any = await WorkOrder.create(data);
            createdWO.push(wo);
        }
        console.log(`${createdWO.length} Work Orders created.`);

        // Link Inventory to the first Work Order (HVAC Maintenance)
        if (createdWO.length > 0 && createdInventory.length > 0) {
            await WorkOrderInventoryItem.create({
                work_order_id: createdWO[0].id,
                inventory_item_id: createdInventory[0].id,
                quantity_used: 2
            });
            console.log('Linked inventory items to work order.');
        }

        console.log('\n--- Seeding Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding demo data:', error);
        process.exit(1);
    }
}

seedDemoData();