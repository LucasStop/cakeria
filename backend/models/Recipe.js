'use strict';

module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define(
    'Recipe',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ingredients: {
        type: DataTypes.TEXT,
        allowNull: false,
        // Remover qualquer conversão automática para JSON
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: false,
        // Remover qualquer conversão automática para JSON
      },
      prepTime: {
        type: DataTypes.INTEGER,
        comment: 'Tempo de preparo em minutos',
      },
      cookTime: {
        type: DataTypes.INTEGER,
        comment: 'Tempo de cozimento em minutos',
      },
      servings: {
        type: DataTypes.INTEGER,
      },
      difficulty: {
        type: DataTypes.ENUM('Fácil', 'Médio', 'Difícil'),
        defaultValue: 'Médio',
      },
      // image_id: {
      //   type: DataTypes.STRING,
      // },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Categories',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('rascunho', 'publicado'),
        defaultValue: 'publicado',
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'recipes',
      timestamps: true,
      underscored: true,
    }
  );

  Recipe.associate = function (models) {
    Recipe.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author',
    });

    Recipe.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });

    Recipe.hasMany(models.Comment, {
      foreignKey: 'recipe_id',
      as: 'comments_recipes',
    });
  };

  return Recipe;
};
