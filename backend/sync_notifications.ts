import sequelize from './src/config/database';
import { Notification } from './src/models';

async function sync() {
  await Notification.sync({ alter: true });
  console.log('notifications table synced');
  process.exit(0);
}
sync();
