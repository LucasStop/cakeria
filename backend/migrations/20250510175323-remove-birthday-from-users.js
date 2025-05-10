'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'birthdate');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'birthdate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
};
