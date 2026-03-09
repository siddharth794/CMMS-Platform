import sequelize from '../config/database';

/**
 * One-time migration to:
 * 1. Drop duplicate indexes on the organizations table (fixes "too many keys" error)
 * 2. Add deleted_at columns to all paranoid tables
 */
async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.\n');

        // Step 1: Fix duplicate indexes on organizations table
        console.log('Step 1: Fixing duplicate indexes on organizations table...');
        try {
            const [indexes]: any = await sequelize.query("SHOW INDEX FROM organizations WHERE Column_name = 'name'");
            const uniqueIndexNames = new Set<string>();
            for (const idx of indexes) {
                uniqueIndexNames.add(idx.Key_name);
            }
            // Keep 'name' (the column-level unique) or PRIMARY, drop all others
            let kept = false;
            for (const indexName of uniqueIndexNames) {
                if (indexName === 'PRIMARY') continue;
                if (!kept) {
                    kept = true;
                    console.log(`  Keeping index: ${indexName}`);
                    continue;
                }
                try {
                    await sequelize.query(`DROP INDEX \`${indexName}\` ON organizations`);
                    console.log(`  Dropped duplicate index: ${indexName}`);
                } catch (e: any) {
                    console.log(`  Skipping index ${indexName}: ${e.message}`);
                }
            }
        } catch (e: any) {
            console.log(`  No indexes to fix: ${e.message}`);
        }

        // Step 2: Add deleted_at columns to all paranoid tables
        console.log('\nStep 2: Adding deleted_at columns...');
        const tables = [
            'organizations',
            'users',
            'assets',
            'work_orders',
            'pm_schedules',
            'inventory_items',
            'wo_comments',
            'notifications',
            'work_order_inventory_items',
            'wo_attachments',
        ];

        for (const table of tables) {
            try {
                await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`deleted_at\` DATETIME NULL`);
                console.log(`  Added deleted_at to ${table}`);
            } catch (e: any) {
                if (e.original?.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ${table}: deleted_at column already exists`);
                } else {
                    console.log(`  ${table}: ${e.message}`);
                }
            }
        }

        console.log('\nMigration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
