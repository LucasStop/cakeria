'use strict';

module.exports = (sequelize, DataTypes) => {
  const order_product = sequelize.define(
    'order_product',
    {
      order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'order',
          key: 'id',
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'product',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'order_product',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  return order_product;
};
