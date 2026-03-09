import sequelize from '../config/database';
import { WOAttachment } from '../models';

async function sync() {
  await WOAttachment.sync({ alter: true });
  console.log('wo_attachments table synced');
  process.exit(0);
}
sync();
