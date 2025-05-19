'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primeiro, vamos obter os IDs dos usuários e categorias que criamos
    const users = await queryInterface.sequelize.query('SELECT id, email FROM user;');

    const categories = await queryInterface.sequelize.query('SELECT id, name FROM category;');

    const userRows = users[0];
    const categoryRows = categories[0];

    // Criar mapas de emails/nomes para IDs
    const userMap = {};
    userRows.forEach(user => {
      userMap[user.email] = user.id;
    });

    const categoryMap = {};
    categoryRows.forEach(category => {
      categoryMap[category.name] = category.id;
    });

    return queryInterface.bulkInsert(
      'recipe',
      [
        {
          title: 'Bolo Red Velvet',
          description: 'Delicioso bolo vermelho com cobertura de cream cheese.',
          ingredients:
            '2 xícaras de farinha de trigo\n1 e 1/2 xícaras de açúcar\n1 colher de sopa de cacau em pó\n1 colher de chá de bicarbonato de sódio\n1 colher de chá de sal\n1 xícara de leite de buttermilk\n2 ovos\n1 colher de chá de essência de baunilha\n1 colher de sopa de corante alimentício vermelho\n1/2 xícara de manteiga sem sal derretida\nPara a cobertura: 250g de cream cheese, 1/2 xícara de manteiga, 2 xícaras de açúcar de confeiteiro, 1 colher de chá de baunilha',
          instructions:
            '1. Preaqueça o forno a 180°C e unte duas formas redondas;\n2. Misture os ingredientes secos em uma tigela;\n3. Em outra tigela, bata os ovos, o buttermilk, a baunilha e o corante;\n4. Adicione a manteiga derretida à mistura líquida;\n5. Incorpore os ingredientes secos aos líquidos e misture bem;\n6. Divida a massa entre as formas e asse por 25-30 minutos;\n7. Para a cobertura, bata o cream cheese e a manteiga até ficar cremoso, adicione o açúcar de confeiteiro e a baunilha.',
          prep_time: 30,
          cook_time: 30,
          servings: 12,
          difficulty: 'Médio',
          user_id: userMap['lucas@gmail.com.br'],
          category_id: categoryMap['Bolos'],
          status: 'publicado',
          views: 98,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: 'Pudim de Leite Condensado',
          description: 'Pudim tradicional brasileiro, cremoso e com calda de caramelo.',
          ingredients:
            'Para a calda:\n1 xícara de açúcar\n1/3 xícara de água\nPara o pudim:\n1 lata de leite condensado\n2 latas de leite (medida da lata de leite condensado)\n3 ovos',
          instructions:
            '1. Para a calda, coloque o açúcar em uma forma para pudim e leve ao fogo até derreter e ficar dourado;\n2. Adicione a água cuidadosamente e misture até dissolver o caramelo;\n3. Deixe esfriar;\n4. Para o pudim, bata todos os ingredientes no liquidificador;\n5. Despeje na forma caramelizada;\n6. Cozinhe em banho-maria no forno a 180°C por cerca de 40 minutos;\n7. Deixe esfriar e leve à geladeira por pelo menos 4 horas antes de desenformar.',
          prep_time: 15,
          cook_time: 40,
          servings: 8,
          difficulty: 'Fácil',
          user_id: userMap['renan@gmail.com.br'],
          category_id: categoryMap['Doces'],
          status: 'publicado',
          views: 122,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: 'Pão de Queijo Mineiro',
          description: 'Tradicional pão de queijo mineiro, fofinho por dentro e crocante por fora.',
          ingredients:
            '500g de polvilho azedo\n1 xícara de leite\n1/2 xícara de óleo\n2 ovos\n200g de queijo minas meia cura ralado\n1 colher de chá de sal',
          instructions:
            '1. Em uma panela, ferva o leite com o óleo e o sal;\n2. Escalde o polvilho com esta mistura quente e mexa bem;\n3. Deixe esfriar um pouco e adicione os ovos, misturando bem;\n4. Por último, adicione o queijo ralado e misture até formar uma massa homogênea;\n5. Modele bolinhas com as mãos untadas com óleo;\n6. Coloque em uma forma e leve ao forno preaquecido a 180°C por cerca de 30 minutos ou até dourar.',
          prep_time: 20,
          cook_time: 30,
          servings: 25,
          difficulty: 'Médio',
          user_id: userMap['eduardo@gmail.com.br'],
          category_id: categoryMap['Salgados'],
          status: 'publicado',
          views: 87,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: 'Brigadeirão',
          description: 'Sobremesa cremosa de chocolate, uma versão de pudim de brigadeiro.',
          ingredients:
            '2 latas de leite condensado\n4 colheres de sopa de chocolate em pó\n1 xícara de leite\n4 ovos\n1 colher de sopa de manteiga\n100g de chocolate granulado para decorar',
          instructions:
            '1. Preaqueça o forno a 180°C;\n2. Coloque todos os ingredientes no liquidificador, exceto o chocolate granulado, e bata bem;\n3. Unte uma forma com furo central com manteiga e polvilhe com chocolate em pó;\n4. Despeje a mistura na forma;\n5. Asse em banho-maria por aproximadamente 45 minutos;\n6. Deixe esfriar completamente antes de desenformar;\n7. Decore com chocolate granulado.',
          prep_time: 15,
          cook_time: 45,
          servings: 10,
          difficulty: 'Fácil',
          user_id: userMap['joao@gmail.com.br'],
          category_id: categoryMap['Doces'],
          status: 'publicado',
          views: 76,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: 'Cheesecake de Frutas Vermelhas',
          description: 'Cheesecake cremoso com cobertura de frutas vermelhas frescas.',
          ingredients:
            'Para a base:\n200g de biscoitos tipo digestivo\n100g de manteiga derretida\nPara o recheio:\n500g de cream cheese\n1 xícara de açúcar\n3 ovos\n1 colher de sopa de essência de baunilha\n1 colher de sopa de suco de limão\nPara a cobertura:\n2 xícaras de frutas vermelhas mistas (morango, framboesa, mirtilo)\n1/2 xícara de açúcar\n2 colheres de sopa de água\n1 colher de sopa de amido de milho dissolvido em 2 colheres de sopa de água',
          instructions:
            '1. Preaqueça o forno a 160°C;\n2. Triture os biscoitos e misture com a manteiga derretida;\n3. Pressione esta mistura no fundo de uma forma de fundo removível;\n4. Bata o cream cheese e o açúcar até ficar cremoso;\n5. Adicione os ovos um a um, batendo bem após cada adição;\n6. Adicione a baunilha e o suco de limão;\n7. Despeje sobre a base de biscoito;\n8. Asse em banho-maria por 50-60 minutos;\n9. Para a cobertura, cozinhe as frutas com o açúcar e a água por 5 minutos;\n10. Adicione o amido de milho dissolvido e cozinhe até engrossar;\n11. Deixe esfriar e despeje sobre o cheesecake frio.',
          prep_time: 30,
          cook_time: 60,
          servings: 12,
          difficulty: 'Médio',
          user_id: userMap['dev@cakeria.com.br'],
          category_id: categoryMap['Tortas'],
          status: 'publicado',
          views: 130,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('recipe', null, {});
  },
};
