'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = await queryInterface.sequelize.query('SELECT id, name FROM category;');

    const categoryRows = categories[0];

    const categoryMap = {};
    categoryRows.forEach(category => {
      categoryMap[category.name] = category.id;
    });

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    return queryInterface.bulkInsert(
      'product',
      [
        {
          name: 'Bolo de Chocolate',
          description: 'Delicioso bolo de chocolate com cobertura de ganache',
          price: 55.99,
          size: '1kg',
          stock: 10,
          expiry_date: futureDate,
          category_id: categoryMap['Bolos'],
          slug: 'bolo-de-chocolate',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Bolo de Morango',
          description: 'Bolo de baunilha com recheio de morangos frescos e chantilly',
          price: 65.99,
          size: '1kg',
          stock: 8,
          expiry_date: futureDate,
          category_id: categoryMap['Bolos'],
          slug: 'bolo-de-morango',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Torta de Limão',
          description: 'Torta com massa amanteigada, recheio de limão e merengue',
          price: 49.99,
          size: '800g',
          stock: 5,
          expiry_date: futureDate,
          category_id: categoryMap['Tortas'],
          slug: 'torta-de-limao',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Cupcake de Baunilha',
          description: 'Cupcake de baunilha com cobertura de buttercream',
          price: 7.99,
          size: '100g',
          stock: 20,
          expiry_date: futureDate,
          category_id: categoryMap['Cupcakes'],
          slug: 'cupcake-de-baunilha',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Brigadeiros Gourmet',
          description: 'Brigadeiros gourmet com diversos sabores',
          price: 3.5,
          size: '30g',
          stock: 50,
          expiry_date: futureDate,
          category_id: categoryMap['Doces'],
          slug: 'brigadeiros-gourmet',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Coxinha de Frango',
          description: 'Coxinha de frango com massa crocante',
          price: 5.99,
          size: '120g',
          stock: 30,
          expiry_date: futureDate,
          category_id: categoryMap['Salgados'],
          slug: 'coxinha-de-frango',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('product', null, {});
  },
};
