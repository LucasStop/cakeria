'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'categories',
      [
        {
          name: 'Bolos Tradicionais',
          description: 'Bolos clássicos para qualquer ocasião',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Bolos Decorados',
          description: 'Bolos artísticos com decorações personalizadas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Tortas',
          description: 'Tortas doces e salgadas para festas e eventos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Doces Finos',
          description: 'Docinhos gourmet para eventos especiais',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Sobremesas Geladas',
          description: 'Sobremesas refrescantes e geladas',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  },
};
