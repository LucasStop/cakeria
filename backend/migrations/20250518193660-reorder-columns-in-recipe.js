'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('recipe', 'category_id', {
      type: Sequelize.INTEGER,
      after: 'id',
    });

    await queryInterface.changeColumn('recipe', 'user_id', {
      type: Sequelize.INTEGER,
      after: 'category_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('recipe', 'user_id', {
      type: Sequelize.INTEGER,
      after: 'id',
    });

    await queryInterface.changeColumn('recipe', 'category_id', {
      type: Sequelize.INTEGER,
      after: 'user_id',
    });
  },
};
