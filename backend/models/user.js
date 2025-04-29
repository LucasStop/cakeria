'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('client', 'admin'),
        allowNull: false,
        defaultValue: 'client',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Data e hora do último login do usuário',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  User.associate = function (models) {
    User.hasMany(models.Address, {
      foreignKey: 'user_id',
      as: 'addresses',
    });

    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders',
    });
  };

  return User;
};
