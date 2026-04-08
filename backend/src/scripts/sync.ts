import { sequelize } from '../models';

async function sync() {
  await sequelize.sync({ alter: true });
  console.log("Database synchronized.");
}

sync();
