'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, buscar os IDs das categorias
    const categories = await queryInterface.sequelize.query('SELECT id, name FROM categories;', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    // Mapear nomes para IDs
    const categoriesMap = {};
    categories.forEach(cat => {
      categoriesMap[cat.name] = cat.id;
    });

    // Função para ler a imagem e converter em buffer
    const getImageBuffer = imagePath => {
      return fs.readFileSync(path.join(__dirname, '../../frontend/public/imgs', imagePath)); // Supondo que as imagens estão na pasta "images"
    };

    // Inserir produtos com referências às categorias
    await queryInterface.bulkInsert(
      'products',
      [
        {
          name: 'Bolo de Chocolate',
          description: 'Delicioso bolo de chocolate com cobertura de ganache',
          price: 45.9,
          // image: getImageBuffer("bolo-chocolate.png"), // Convertendo imagem para buffer
          category_id: categoriesMap['Bolos Tradicionais'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Bolo de Casamento',
          description: 'Bolo de três andares com decoração personalizada',
          price: 350.0,
          // image: getImageBuffer("bolo-casamento.png"), // Convertendo imagem para buffer
          category_id: categoriesMap['Bolos Decorados'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Torta de Limão',
          description: 'Torta de limão com merengue',
          price: 39.9,
          // image: getImageBuffer("torta-limao.png"), // Convertendo imagem para buffer
          category_id: categoriesMap['Tortas'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        // ... outros produtos
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  },
};
