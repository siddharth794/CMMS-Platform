import { sequelize } from '../models';

async function sync() {
  await sequelize.sync({ force: true });
  console.log("Database synchronized forcefully.");
}

sync();
