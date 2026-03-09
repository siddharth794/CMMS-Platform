import sequelize from '../config/database';
import { PMSchedule, PMTrigger, PMTemplate, PMTask, PMPart, PMExecution } from '../models';

async function sync() {
  try {
    await PMSchedule.sync({ alter: true });
    console.log('pm_schedules table synced');
    
    await PMTrigger.sync({ alter: true });
    console.log('pm_triggers table synced');

    await PMTemplate.sync({ alter: true });
    console.log('pm_templates table synced');

    await PMTask.sync({ alter: true });
    console.log('pm_tasks table synced');

    await PMPart.sync({ alter: true });
    console.log('pm_parts table synced');

    await PMExecution.sync({ alter: true });
    console.log('pm_executions table synced');

    process.exit(0);
  } catch (error) {
    console.error('Error syncing DB:', error);
    process.exit(1);
  }
}
sync();