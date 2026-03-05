import sequelize from './src/config/database';
import { WOAttachment, WorkOrderInventoryItem, Notification } from './src/models';

async function sync() {
  await WOAttachment.sync({ alter: true });
  await WorkOrderInventoryItem.sync({ alter: true });
  await Notification.sync({ alter: true });
  console.log('Tables synced');
  process.exit(0);
}
sync();
