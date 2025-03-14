'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, buscar os IDs dos usuários
    const users = await queryInterface.sequelize.query(
      'SELECT id, name FROM users;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (users.length === 0) return;

    await queryInterface.bulkInsert('addresses', [
      {
        user_id: users[0].id,
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567',
        country: 'Brasil',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: users[0].id,
        street: 'Avenida Brasil, 789',
        city: 'Rio de Janeiro',
        state: 'RJ',
        postal_code: '20940-070',
        country: 'Brasil',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: users[1].id,
        street: 'Rua dos Pinheiros, 456',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '05422-010',
        country: 'Brasil',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('addresses', null, {});
  }
};
