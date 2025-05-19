'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query('SELECT id, email FROM user;');

    const userRows = users[0];

    const userMap = {};
    userRows.forEach(user => {
      userMap[user.email] = user.id;
    });

    return queryInterface.bulkInsert(
      'address',
      [
        {
          user_id: userMap['dev@cakeria.com.br'],
          street: 'Avenida Tecnológica',
          number: '42',
          neighborhood: 'Parque Digital',
          complement: 'Bloco B, Sala 101',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '04001-001',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: userMap['lucas@gmail.com.br'],
          street: 'Rua dos Desenvolvedores',
          number: '123',
          neighborhood: 'Jardim Código',
          complement: 'Apto 303',
          city: 'Curitiba',
          state: 'PR',
          postal_code: '80000-123',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: userMap['renan@gmail.com.br'],
          street: 'Rua da Programação',
          number: '456',
          neighborhood: 'Vila JavaScript',
          complement: 'Casa 2',
          city: 'Porto Alegre',
          state: 'RS',
          postal_code: '90000-456',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: userMap['eduardo@gmail.com.br'],
          street: 'Alameda dos Sistemas',
          number: '789',
          neighborhood: 'Parque Database',
          complement: 'Bloco A, Apto 101',
          city: 'Florianópolis',
          state: 'SC',
          postal_code: '88000-789',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: userMap['joao@gmail.com.br'],
          street: 'Avenida do Frontend',
          number: '1010',
          neighborhood: 'Jardim Web',
          complement: 'Casa',
          city: 'Brasília',
          state: 'DF',
          postal_code: '70000-000',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('address', null, {});
  },
};
