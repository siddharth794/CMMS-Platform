import sequelize from '../config/database';
import { WorkOrder } from '../models';

async function sync() {
  try {
    await WorkOrder.sync({ alter: true });
    console.log('work_orders table synced successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to sync work_orders table', error);
    process.exit(1);
  }
}
sync();