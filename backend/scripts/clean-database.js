const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
});

async function dropTables() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados.');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Removendo tabelas...');
    await sequelize.query('DROP TABLE IF EXISTS order_product');
    await sequelize.query('DROP TABLE IF EXISTS order');
    await sequelize.query('DROP TABLE IF EXISTS product');
    await sequelize.query('DROP TABLE IF EXISTS category');
    await sequelize.query('DROP TABLE IF EXISTS comment_recipe');
    await sequelize.query('DROP TABLE IF EXISTS recipe');
    await sequelize.query('DROP TABLE IF EXISTS address');
    await sequelize.query('DROP TABLE IF EXISTS user');
    await sequelize.query('DROP TABLE IF EXISTS admins');

    await sequelize.query('DROP TABLE IF EXISTS `ENUM_user_type`');
    await sequelize.query('DROP TABLE IF EXISTS `ENUM_order_status`');

    await sequelize.query('DROP TABLE IF EXISTS SequelizeMeta');
    console.log('Tabela SequelizeMeta removida para permitir novas migrações');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Estrutura do banco de dados removida com sucesso!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao remover tabelas do banco de dados:', error);
    process.exit(1);
  }
}

dropTables();
