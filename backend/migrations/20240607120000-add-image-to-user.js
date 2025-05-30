'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user', 'image', {
      type: Sequelize.BLOB('long'),
      allowNull: true,
      comment: 'Imagem do usuário em formato binário (BLOB)',
      after: 'id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user', 'image');
  },
};
