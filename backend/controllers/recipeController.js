const { Recipe, User, Category, Comment } = require('../models');
const { Op } = require('sequelize');

// Verificação de propriedade da receita
const checkOwnership = async (recipeId, userId) => {
  const recipe = await Recipe.findByPk(recipeId);
  if (!recipe) return false;
  return recipe.userId === userId;
};

module.exports = {
  // Listar receitas publicadas com filtros
  getAllRecipes: async (req, res) => {
    try {
      const { search, category, sort = 'newest', page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;
      
      // Construir query de filtros
      const where = { status: 'publicado' };
      
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (category) {
        where.categoryId = category;
      }
      
      // Ordenação
      let order = [['createdAt', 'DESC']]; // Padrão: mais recentes
      
      if (sort === 'oldest') {
        order = [['createdAt', 'ASC']];
      } else if (sort === 'popular') {
        order = [['views', 'DESC']];
      }
      
      const { count, rows: recipes } = await Recipe.findAndCountAll({
        where,
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ],
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      res.json({
        recipes,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      });
    } catch (error) {
      console.error('Erro ao listar receitas:', error);
      res.status(500).json({ message: 'Erro ao listar receitas' });
    }
  },
  
  // Obter detalhes de uma receita por ID
  getRecipeById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const recipe = await Recipe.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { 
            model: Comment, 
            as: 'comments',
            include: [
              { model: User, as: 'author', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }
      
      // Incrementar contador de visualizações
      await recipe.increment('views');
      
      res.json(recipe);
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      res.status(500).json({ message: 'Erro ao buscar receita' });
    }
  },
  
  // Buscar receita por slug
  getRecipeBySlug: async (req, res) => {
    try {
      const { slug } = req.params;
      
      const recipe = await Recipe.findOne({ 
        where: { slug, status: 'publicado' },
        include: [
          { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { 
            model: Comment, 
            as: 'comments',
            include: [
              { model: User, as: 'author', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }
      
      // Incrementar contador de visualizações
      await recipe.increment('views');
      
      res.json(recipe);
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      res.status(500).json({ message: 'Erro ao buscar receita' });
    }
  },
  
  // Criar nova receita
  createRecipe: async (req, res) => {
    try {
      const { 
        title, description, ingredients, instructions, 
        prepTime, cookTime, servings, difficulty, imageUrl, categoryId 
      } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
      
      const newRecipe = await Recipe.create({
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        difficulty,
        imageUrl,
        categoryId,
        userId: req.user.id
      });
      
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          message: 'Erro de validação', 
          errors: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      res.status(500).json({ message: 'Erro ao criar receita' });
    }
  },
  
  // Atualizar receita
  updateRecipe: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        title, description, ingredients, instructions, 
        prepTime, cookTime, servings, difficulty, imageUrl, categoryId, status 
      } = req.body;
      
      // Verificar se o usuário é dono da receita
      if (!req.user || !(await checkOwnership(id, req.user.id))) {
        return res.status(403).json({ message: 'Não autorizado a editar esta receita' });
      }
      
      const recipe = await Recipe.findByPk(id);
      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }
      
      await recipe.update({
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        difficulty,
        imageUrl,
        categoryId,
        status: status || recipe.status
      });
      
      res.json(recipe);
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          message: 'Erro de validação', 
          errors: error.errors.map(e => ({ field: e.path, message: e.message }))
        });
      }
      res.status(500).json({ message: 'Erro ao atualizar receita' });
    }
  },
  
  // Excluir receita
  deleteRecipe: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário é dono da receita
      if (!req.user || !(await checkOwnership(id, req.user.id))) {
        return res.status(403).json({ message: 'Não autorizado a excluir esta receita' });
      }
      
      const recipe = await Recipe.findByPk(id);
      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }
      
      await recipe.destroy();
      
      res.json({ message: 'Receita excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      res.status(500).json({ message: 'Erro ao excluir receita' });
    }
  },
  
  // Listar receitas do usuário logado
  getUserRecipes: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
      
      const recipes = await Recipe.findAll({
        where: { userId: req.user.id },
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.json(recipes);
    } catch (error) {
      console.error('Erro ao listar receitas do usuário:', error);
      res.status(500).json({ message: 'Erro ao listar receitas do usuário' });
    }
  }
};
