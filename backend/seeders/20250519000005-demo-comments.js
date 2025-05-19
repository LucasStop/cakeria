'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, vamos obter os IDs dos usuários e receitas que criamos
    const users = await queryInterface.sequelize.query('SELECT id, email FROM user;');

    const recipes = await queryInterface.sequelize.query('SELECT id, title FROM recipe;');

    const userRows = users[0];
    const recipeRows = recipes[0];

    // Criar mapas de emails/títulos para IDs
    const userMap = {};
    userRows.forEach(user => {
      userMap[user.email] = user.id;
    });

    const recipeMap = {};
    recipeRows.forEach(recipe => {
      recipeMap[recipe.title] = recipe.id;
    });

    return queryInterface.bulkInsert(
      'comment_recipe',
      [
        {
          content:
            'Esse Red Velvet ficou perfeito! A cobertura de cream cheese complementa muito bem o sabor do bolo.',
          user_id: userMap['dev@cakeria'],
          recipe_id: recipeMap['Bolo Red Velvet'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content:
            'Adorei essa receita! O pão de queijo ficou crocante por fora e macio por dentro.',
          user_id: userMap['lucas@gmail.com'],
          recipe_id: recipeMap['Pão de Queijo Mineiro'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content:
            'Fiz o pudim para o domingo em família e todos pediram a receita. Sucesso total!',
          user_id: userMap['renan@gmail.com'],
          recipe_id: recipeMap['Pudim de Leite Condensado'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content:
            'O brigadeirão ficou incrível! Tentei adicionar um pouco de café na mistura e deu um toque especial.',
          user_id: userMap['eduardo@gmail.com'],
          recipe_id: recipeMap['Brigadeirão'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content:
            'Experimentei fazer com morangos frescos e ficou ainda melhor! Recomendo a todos.',
          user_id: userMap['joao@gmail.com'],
          recipe_id: recipeMap['Cheesecake de Frutas Vermelhas'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content:
            'Perfeito para o café da tarde! Fiz pequenas modificações na receita e adorei o resultado.',
          user_id: userMap['lucas@gmail.com'],
          recipe_id: recipeMap['Cheesecake de Frutas Vermelhas'],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          content: 'Essa receita salvou meu fim de semana! Muito fácil de fazer e deliciosa.',
          user_id: userMap['joao@gmail.com'],
          recipe_id: recipeMap['Pudim de Leite Condensado'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('comment_recipe', null, {});
  },
};
