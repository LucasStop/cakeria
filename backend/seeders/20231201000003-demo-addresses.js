'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query('SELECT id, name FROM users;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    if (users.length === 0) return;

    await queryInterface.bulkInsert(
      'addresses',
      [
        {
          user_id: users[0].id,
          street: 'Rua das Flores',
          number: '11',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: users[0].id,
          street: 'Avenida Brasil',
          number: '12',
          city: 'Rio de Janeiro',
          state: 'RJ',
          postal_code: '20940-070',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: users[1].id,
          street: 'Rua dos Pinheiros',
          number: '13',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '05422-010',
          country: 'Brasil',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('addresses', null, {});
  },
};
