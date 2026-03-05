import sequelize from './src/config/database';
import { WorkOrderInventoryItem } from './src/models';

async function sync() {
  await WorkOrderInventoryItem.sync({ alter: true });
  console.log('work_order_inventory_items table synced');
  process.exit(0);
}
sync();
