require('dotenv').config();

// Configurações comuns para todos os ambientes
const commonConfig = {
  timezone: '-03:00', // Horário de São Paulo (UTC-3)
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
};

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    ...commonConfig,
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    ...commonConfig,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    ...commonConfig,
  },
};
