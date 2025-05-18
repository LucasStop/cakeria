'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Primeiro renomeamos a coluna image_url para image
    await queryInterface.renameColumn('products', 'image_url', 'image');

    // 2. Alteramos suas propriedades e a mudamos para BLOB
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.BLOB('medium'), // MEDIUMBLOB - até 16MB
      allowNull: true,
      comment: 'Imagem do produto em formato binário'
    });

    // 3. Movemos a coluna para depois de category_id
    await queryInterface.sequelize.query(`
      ALTER TABLE products 
      MODIFY COLUMN image MEDIUMBLOB 
      AFTER category_id
    `);

    // 4. Adicionamos o campo slug
    await queryInterface.addColumn('products', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true,
      defaultValue: '',
      after: 'name',
    });
    
    // 5. Adicionamos o campo is_active
    await queryInterface.addColumn('products', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'created_at',
    });
    
    // 6. Geramos slugs para os produtos existentes
    const products = await queryInterface.sequelize.query(
      'SELECT id, name FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    for (const product of products) {
      const slug = product.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-')     // Substitui espaços por hífens
        .replace(/--+/g, '-')     // Remove hífens duplicados
        .trim();
      
      await queryInterface.sequelize.query(
        `UPDATE products SET slug = '${slug}' WHERE id = ${product.id}`
      );
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    // 1. Removemos o campo is_active
    await queryInterface.removeColumn('products', 'is_active');
    
    // 2. Removemos o campo slug
    await queryInterface.removeColumn('products', 'slug');

    // 3. Movemos a coluna image de volta para sua posição original (após expiry_date)
    await queryInterface.sequelize.query(`
      ALTER TABLE products 
      MODIFY COLUMN image MEDIUMBLOB 
      AFTER expiry_date
    `);
    
    // 4. Revertemos o tipo para string
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL da imagem do produto'
    });
    
    // 5. Renomeamos de volta para o nome original
    await queryInterface.renameColumn('products', 'image', 'image_url');
  }
};
