import { Asset, Organization, sequelize } from '../models';

async function verify() {
    try {
        console.log('--- Starting Verification ---');
        
        // 1. Create two test organizations
        const org1 = await Organization.create({ name: 'Verify Org Unique 1' });
        const org2 = await Organization.create({ name: 'Verify Org Unique 2' });
        console.log('Orgs created:', org1.id, org2.id);

        const testTag = 'VERIFY-TAG-' + Math.random().toString(36).substring(7).toUpperCase();

        // 2. Create asset in Org 1
        await Asset.create({ 
            org_id: org1.id, 
            name: 'Asset 1', 
            asset_tag: testTag 
        });
        console.log(`First asset created in Org 1 with tag: ${testTag}`);

        // 3. Try to create asset with SAME tag in Org 1 (SHOULD FAIL)
        try {
            await Asset.create({ 
                org_id: org1.id, 
                name: 'Asset 2', 
                asset_tag: testTag 
            });
            console.error('ERROR: Duplicate tag allowed in same Org!');
        } catch (err: any) {
            console.log('SUCCESS: Prevented duplicate tag in same Org:', err.name);
        }

        // 4. Try to create asset with SAME tag in Org 2 (SHOULD SUCCEED)
        try {
            await Asset.create({ 
                org_id: org2.id, 
                name: 'Asset 3', 
                asset_tag: testTag 
            });
            console.log('SUCCESS: Allowed same tag in different Org.');
        } catch (err: any) {
            console.error('ERROR: Same tag not allowed in different Org!', err);
        }

        // Cleanup
        console.log('Cleaning up...');
        await Asset.destroy({ where: { asset_tag: testTag }, force: true });
        await Organization.destroy({ where: { id: [org1.id, org2.id] }, force: true });
        console.log('--- Verification Completed ---');

    } catch (error) {
        console.error('Verification failed with error:', error);
    } finally {
        await sequelize.close();
    }
}

verify();
