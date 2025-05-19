'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'category',
      [
        {
          name: 'Bolos',
          description: 'Deliciosos bolos para todas as ocasiões',
          slug: 'bolos',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Tortas',
          description: 'Tortas doces e salgadas para todos os gostos',
          slug: 'tortas',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Cupcakes',
          description: 'Pequenos bolos individuais com coberturas variadas',
          slug: 'cupcakes',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Doces',
          description: 'Diversos tipos de doces para festas e comemorações',
          slug: 'doces',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Salgados',
          description: 'Salgados para festas e eventos',
          slug: 'salgados',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Bebidas',
          description: 'Bebidas para acompanhar nossos produtos',
          slug: 'bebidas',
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('category', null, {});
  },
};
