'use strict';

const { sequelize } = require('../models');

async function testTimezone() {
  try {
    const result = await sequelize.query('SELECT NOW() as current_time', {
      type: sequelize.QueryTypes.SELECT,
    });

    console.log('Horário no banco de dados:', result[0].current_time);
    console.log(
      'Horário local do Node.js:',
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    );
    console.log('Timezone configurado no Sequelize:', sequelize.options.timezone);

    const { User } = require('../models');
    const now = new Date();
    console.log('Horário antes de salvar:', now);

    const tempUser = await User.create({
      name: 'Teste Timezone',
      email: `teste-${Date.now()}@example.com`,
      password: 'teste123',
      type: 'client',
    });

    console.log('Horário salvo no created_at:', tempUser.created_at);

    await tempUser.destroy({ force: true });

    await sequelize.close();
  } catch (error) {
    console.error('Erro ao testar timezone:', error);
  }
}

testTimezone();
