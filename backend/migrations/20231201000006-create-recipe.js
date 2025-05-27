'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recipe', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      ingredients: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      prep_time: {
        type: Sequelize.INTEGER,
        comment: 'Tempo de preparo em minutos',
      },
      cook_time: {
        type: Sequelize.INTEGER,
        comment: 'Tempo de cozimento em minutos',
      },
      servings: {
        type: Sequelize.INTEGER,
      },
      difficulty: {
        type: Sequelize.ENUM('Fácil', 'Médio', 'Difícil'),
        defaultValue: 'Médio',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'category',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('rascunho', 'publicado'),
        defaultValue: 'publicado',
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recipe');
  },
};
