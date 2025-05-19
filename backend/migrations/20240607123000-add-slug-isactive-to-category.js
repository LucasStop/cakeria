'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('category', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
      defaultValue: '',
      after: 'name',
    });
    await queryInterface.addColumn('category', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'slug',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('category', 'slug');
    await queryInterface.removeColumn('category', 'is_active');
  },
};
