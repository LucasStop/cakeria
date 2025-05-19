'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user', 'cpf', {
      type: Sequelize.STRING(14),
      allowNull: true,
      unique: true,
      comment: 'CPF do usuário no formato 000.000.000-00',
      after: 'email',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user', 'cpf');
  },
};
