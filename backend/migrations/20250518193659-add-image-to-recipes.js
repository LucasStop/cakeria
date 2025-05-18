'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('recipes', 'image', {
      type: Sequelize.BLOB('long'),
      allowNull: true,
      comment: 'Imagem da receita em formato binário (BLOB)',
      after: 'id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('recipes', 'image');
  },
};
