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
      cpf: {
        type: DataTypes.STRING(14),
        allowNull: true,
        unique: true,
        validate: {
          is: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/, // Validação para o formato 000.000.000-00
        },
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: false,
        validate: {
          len: [6, 256], // Senha deve ter entre 6 e 256 caracteres
        },
      },
      type: {
        type: DataTypes.ENUM('client', 'admin'),
        allowNull: false,
        defaultValue: 'client',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: /^\(\d{2}\) \d{4,5}-\d{4}$/, // Validação para o formato (00) 0000-0000 ou (00) 00000-0000
        },
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Data e hora do último login do usuário',
      },
      image: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
        comment: 'Imagem do usuário em formato binário (BLOB)',
      },
    },
    {
      tableName: 'user',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  User.associate = function (models) {
    User.hasMany(models.Address, {
      foreignKey: 'user_id',
      as: 'address',
    });

    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'order',
    });
  };

  return User;
};
