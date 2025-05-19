'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('senha123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const newUserPassword = await bcrypt.hash('123456', 10);

    return queryInterface.bulkInsert(
      'user',
      [
        {
          name: 'Dev Cakeria',
          email: 'dev@cakeria.com',
          password: newUserPassword,
          cpf: '222.333.444-55',
          type: 'admin',
          phone: '(11) 95555-5555',
          last_login: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Lucas Stopinski',
          email: 'lucas@gmail.com',
          password: newUserPassword,
          cpf: '333.444.555-66',
          type: 'client',
          phone: '(11) 94444-4444',
          last_login: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Renan Herculano',
          email: 'renan@gmail.com',
          password: newUserPassword,
          cpf: '444.555.666-77',
          type: 'client',
          phone: '(11) 93333-3333',
          last_login: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Eduardo Fabri',
          email: 'eduardo@gmail.com',
          password: newUserPassword,
          cpf: '555.666.777-88',
          type: 'client',
          phone: '(11) 92222-2222',
          last_login: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'João Victor',
          email: 'joao@gmail.com',
          password: newUserPassword,
          cpf: '666.777.888-99',
          type: 'client',
          phone: '(11) 91111-1111',
          last_login: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('user', null, {});
  },
};
