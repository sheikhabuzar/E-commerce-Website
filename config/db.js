require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => console.log('[SEQUELIZE]', msg), // Verbose logging
    pool: {
      max: 80,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Add a test connection function
(async () => {
  try {
    await sequelize.authenticate();
    console.log('[SEQUELIZE] Connection has been established successfully.');
  } catch (error) {
    console.error('[SEQUELIZE] Unable to connect to the database:', error);
  }
})();

module.exports = sequelize;