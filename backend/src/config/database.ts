import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'cmms_dev',
    process.env.DB_USER || 'cmms_user',
    process.env.DB_PASS || 'cmms_password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
    }
);

export default sequelize;
