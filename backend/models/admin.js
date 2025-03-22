"use strict";

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    "Admin",
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
      
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          
          is: /^\(\d{2}\) \d{5}-\d{4}$/,  
        },
      },
      password: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
    },
    {
      tableName: "admins",
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Admin.associate = function (models) {
    //Relacionamentos futuros
  };

  return Admin;
};
