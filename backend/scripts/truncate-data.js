const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
});

async function truncateData() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Limpando dados das tabelas...');    await sequelize.query('TRUNCATE TABLE order_product');
    await sequelize.query('TRUNCATE TABLE order');
    await sequelize.query('TRUNCATE TABLE product');
    await sequelize.query('TRUNCATE TABLE category');
    await sequelize.query('TRUNCATE TABLE comment_recipe');
    await sequelize.query('TRUNCATE TABLE recipe');
    await sequelize.query('TRUNCATE TABLE address');
    await sequelize.query('TRUNCATE TABLE user');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Dados removidos com sucesso! A estrutura das tabelas foi mantida.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar dados do banco de dados:', error);
    process.exit(1);
  }
}

truncateData();
