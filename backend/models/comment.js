'use strict';

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      recipe_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'comment_recipe',
      timestamps: true,
      underscored: true,
    }
  );

  Comment.associate = function (models) {
    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author',
    });

    Comment.belongsTo(models.Recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe',
    });
  };

  return Comment;
};
