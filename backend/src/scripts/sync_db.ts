import sequelize from '../config/database';
import { WOComment } from '../models';

async function sync() {
  await WOComment.sync({ alter: true });
  console.log('wo_comments table synced');
  process.exit(0);
}
sync();
