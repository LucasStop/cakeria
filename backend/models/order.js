'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'complete', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'order',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );
  Order.associate = function (models) {
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    Order.belongsToMany(models.Product, {
      through: models.OrderProduct,
      foreignKey: 'order_id',
      otherKey: 'product_id',
      as: 'product',
    });
  };

  return Order;
};
