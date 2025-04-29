'use strict';

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      street: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      number: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      neighborhood: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      complement: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: 'addresses',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Address.associate = function (models) {
    Address.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Address;
};
