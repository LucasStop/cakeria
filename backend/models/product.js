'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image: {
        type: DataTypes.BLOB('medium'), // MEDIUMBLOB - até 16MB
        allowNull: true,
        // Removemos a validação isUrl já que agora é um binário
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
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'O slug não pode estar vazio',
          },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    },
    {
      tableName: 'product',
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
      as: 'order',
    });
  };
  Product.beforeSave(async (product, options) => {
    if (product.price) {
      product.price = parseFloat(product.price).toFixed(2);
    }

    if (product.expiry_date && !(product.expiry_date instanceof Date)) {
      product.expiry_date = new Date(product.expiry_date);
    }

    // Gerar slug a partir do nome do produto se o nome foi alterado ou se o produto é novo
    if (product.changed('name') || product.isNewRecord) {
      product.slug = product.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/--+/g, '-') // Remove hífens duplicados
        .trim();
    }
  });

  return Product;
};
