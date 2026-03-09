import { PMGeneratorWorker } from '../workers/pmGenerator.worker';
import { sequelize } from '../models';
import logger from '../config/logger';

async function forceTriggerPMs() {
  try {
    logger.info('Connecting to database...');
    await sequelize.authenticate();
    
    logger.info('Initializing PM Generator Worker...');
    const worker = new PMGeneratorWorker();
    
    logger.info('Forcing evaluation of all active PM schedules...');
    await worker.evaluateAllActivePMs();
    
    logger.info('Process completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to force trigger PMs');
    process.exit(1);
  }
}

forceTriggerPMs();
