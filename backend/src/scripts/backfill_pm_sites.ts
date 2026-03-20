import { PMSchedule, Asset } from '../models';

async function backfillPMSites() {
    console.log('Starting PM Schedule site_id backfill...');
    
    try {
        const schedules = await PMSchedule.findAll({
            where: { site_id: null },
            include: [{ model: Asset, as: 'asset' }]
        });
        
        console.log(`Found ${schedules.length} PM Schedules with missing site_id.`);
        
        let updatedCount = 0;
        for (const pm of (schedules as any[])) {
            if (pm.asset && pm.asset.site_id) {
                pm.site_id = pm.asset.site_id;
                await pm.save();
                updatedCount++;
            } else {
                console.warn(`PM Schedule ${pm.id} (${pm.name}) has no associated asset or asset has no site_id.`);
            }
        }
        
        console.log(`Backfill complete. Updated ${updatedCount} PM Schedules.`);
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
}

backfillPMSites();
