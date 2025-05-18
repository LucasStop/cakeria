'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('categories', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
      defaultValue: '',
      after: 'name',
    });
    await queryInterface.addColumn('categories', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'slug',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('categories', 'slug');
    await queryInterface.removeColumn('categories', 'is_active');
  },
};
