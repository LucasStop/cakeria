"use strict";

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "products",
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Product.associate = function (models) {
    Product.belongsTo(models.Category, {
      foreignKey: "category_id",
      as: "category",
    });

    Product.belongsToMany(models.Order, {
      through: models.order_product,
      foreignKey: "product_id",
      otherKey: "order_id",
      as: "orders",
    });
  };

  return Product;
};
