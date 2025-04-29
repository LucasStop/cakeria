'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'cpf', {
      type: Sequelize.STRING(14),
      allowNull: true,
      unique: true,
      comment: 'CPF do usuário no formato 000.000.000-00',
      after: 'email' // Adiciona a coluna CPF após a coluna phone
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'cpf');
  },
};
