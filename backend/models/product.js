'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'O nome do produto é obrigatório',
          },
          len: {
            args: [3, 100],
            msg: 'O nome deve ter entre 3 e 100 caracteres',
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'A descrição do produto é obrigatória',
          },
          len: {
            args: [3, 500],
            msg: 'A descrição deve ter entre 3 e 500 caracteres',
          },
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: 'O preço deve ser um valor decimal válido',
          },
          min: {
            args: [0.01],
            msg: 'O preço deve ser maior que zero',
          },
        },
      },
      size: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'O tamanho/peso do produto é obrigatório',
          },
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: {
            msg: 'O estoque deve ser um número inteiro',
          },
          min: {
            args: [0],
            msg: 'O estoque não pode ser negativo',
          },
        },
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: {
            msg: 'Data de validade inválida',
          },
          isAfter: {
            args: new Date().toISOString().split('T')[0],
            msg: 'A data de validade deve ser futura',
          },
        },
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: {
            msg: 'A URL da imagem deve ser válida',
            allowEmpty: true,
          },
        },
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Product.associate = function (models) {
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });

    Product.belongsToMany(models.Order, {
      through: models.order_product,
      foreignKey: 'product_id',
      otherKey: 'order_id',
      as: 'orders',
    });
  };

  Product.beforeSave(async (product, options) => {
    if (product.price) {
      product.price = parseFloat(product.price).toFixed(2);
    }

    if (product.expiry_date && !(product.expiry_date instanceof Date)) {
      product.expiry_date = new Date(product.expiry_date);
    }
  });

  return Product;
};
