import sequelize from '../config/database';
import { Notification } from '../models';

async function sync() {
  await Notification.sync({ alter: true });
  console.log('notifications table synced');
  process.exit(0);
}
sync();
