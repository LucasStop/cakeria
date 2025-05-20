'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'category',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Category.associate = function (models) {
    Category.hasMany(models.Product, {
      foreignKey: 'category_id',
      as: 'product',
    });
  };

  return Category;
};
