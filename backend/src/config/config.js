const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'cmms_user',
    password: process.env.DB_PASSWORD || 'cmms_password',
    database: process.env.DB_NAME || 'cmms_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USER || 'cmms_user',
    password: process.env.DB_PASSWORD || 'cmms_password',
    database: process.env.DB_NAME_TEST || 'cmms_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER || 'cmms_user',
    password: process.env.DB_PASSWORD || 'cmms_password',
    database: process.env.DB_NAME || 'cmms_prod',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql'
  }
};
