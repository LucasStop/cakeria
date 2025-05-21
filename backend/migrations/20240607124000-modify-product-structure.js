'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('product', 'image_url', 'image');

    await queryInterface.changeColumn('product', 'image', {
      type: Sequelize.BLOB('medium'), 
      allowNull: true,
      comment: 'Imagem do produto em formato binário',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE product 
      MODIFY COLUMN image MEDIUMBLOB 
      AFTER category_id
    `);

    await queryInterface.addColumn('product', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
      defaultValue: '',
      after: 'name',
    });

    await queryInterface.addColumn('product', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'created_at',
    });

    const products = await queryInterface.sequelize.query('SELECT id, name FROM product', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    for (const product of products) {
      const slug = product.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') 
        .replace(/\s+/g, '-')  
        .replace(/--+/g, '-') 
        .trim();

      await queryInterface.sequelize.query(
        `UPDATE product SET slug = '${slug}' WHERE id = ${product.id}`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('product', 'is_active');

    await queryInterface.removeColumn('product', 'slug');

    await queryInterface.sequelize.query(`
      ALTER TABLE product 
      MODIFY COLUMN image MEDIUMBLOB 
      AFTER expiry_date
    `);

    await queryInterface.changeColumn('product', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL da imagem do produto',
    });

    await queryInterface.renameColumn('product', 'image', 'image_url');
  },
};
