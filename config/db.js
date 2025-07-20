const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 50, // Increase as needed for your DB server
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;