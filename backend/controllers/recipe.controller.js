const { Recipe, User, sequelize } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { category, author, status, difficulty } = req.query;

    const whereConditions = {};

    if (status) {
      whereConditions.status = status;
    } else {
      whereConditions.status = 'publicado';
    }

    if (difficulty) {
      whereConditions.difficulty = difficulty;
    }

    const includeConditions = [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: sequelize.models.Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
    ];

    if (category) {
      includeConditions[1].where = {
        [sequelize.Op.or]: [{ id: isNaN(category) ? null : category }, { slug: category }],
      };
    }

    if (author) {
      includeConditions[0].where = {
        id: author,
      };
    }

    const recipes = await Recipe.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(recipes);
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    res.status(500).json({
      message: 'Erro ao buscar receitas',
      error: error.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: sequelize.models.Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

    if (recipe.views === null || recipe.views === undefined) {
      recipe.views = 1;
    } else {
      recipe.views += 1;
    }

    await recipe.save();


    res.status(200).json(recipe);
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    res.status(500).json({
      message: 'Erro ao buscar receita',
      error: error.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    const {
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      category_id,
      status,
    } = req.body;

    if (!title || !description || !ingredients || !instructions) {
      return res.status(400).json({
        message: 'Campos obrigatórios ausentes',
        requiredFields: ['title', 'description', 'ingredients', 'instructions'],
      });
    }

    if (category_id) {
      const category = await sequelize.models.Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({
          message: 'Categoria não encontrada',
          error: `A categoria com ID ${category_id} não existe`,
        });
      }
    }

    let image = null;
    if (req.file && req.file.buffer) {
      image = req.file.buffer;
    }
    const recipeData = {
      title,
      description,
      ingredients,
      instructions,
      prepTime: prepTime || null,
      cookTime: cookTime || null,
      servings: servings || null,
      difficulty: difficulty || 'Médio',
      user_id: req.user.id,
      category_id: category_id || null,
      status: status || 'publicado',
      image,
    };

    const recipe = await Recipe.create(recipeData);
    const recipeWithAuthor = await Recipe.findByPk(recipe.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: sequelize.models.Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    res.status(201).json(recipeWithAuthor);
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    res.status(400).json({
      message: 'Erro ao criar receita',
      error: error.message,
      details: error.errors?.map(e => e.message) || [],
    });
  }
};

exports.update = async (req, res) => {
  try {
    const recipeId = req.params.id;

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }
    const isOwner = recipe.user_id === req.user.id;

    if (req.user.type !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta receita' });
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      category_id,
      status,
    } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (prepTime !== undefined) updateData.prepTime = prepTime;
    if (cookTime !== undefined) updateData.cookTime = cookTime;
    if (servings !== undefined) updateData.servings = servings;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (category_id !== undefined) {
      if (category_id) {
        const category = await sequelize.models.Category.findByPk(category_id);
        if (!category) {
          return res.status(400).json({
            message: 'Categoria não encontrada',
            error: `A categoria com ID ${category_id} não existe`,
          });
        }
      }
      updateData.category_id = category_id;
    }
    if (status !== undefined) updateData.status = status;

    if (req.file && req.file.buffer) {
      updateData.image = req.file.buffer;
    }
    delete updateData.user_id;

    await recipe.update(updateData);
    const updatedRecipe = await Recipe.findByPk(recipeId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: sequelize.models.Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    res.status(200).json(updatedRecipe);
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(400).json({
      message: 'Erro ao atualizar receita',
      error: error.message,
      details: error.errors?.map(e => e.message) || [],
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const recipe = await Recipe.findByPk(recipeId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: sequelize.models.Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }
    const isOwner = recipe.user_id === req.user.id;

    if (req.user.type !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta receita' });
    }

    const commentCount = await recipe.countComment_recipe();



    await recipe.destroy();

    res.status(200).json({
      message: 'Receita deletada com sucesso',
      recipeTitle: recipe.title,
      commentsRemoved: commentCount,
    });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    res.status(500).json({
      message: 'Erro ao excluir receita',
      error: error.message,
    });
  }
};

exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByPk(id, { attributes: ['id', 'title', 'image'] });

    if (!recipe || !recipe.image) {
      return res.status(404).json({ message: 'Imagem da receita não encontrada' });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(recipe.image);
  } catch (error) {
    console.error('Erro ao buscar imagem da receita:', error);
    res.status(500).json({
      message: 'Erro ao buscar imagem da receita',
      error: error.message,
    });
  }
};

exports.addImage = async (req, res) => {
  try {
    const recipeId = req.params.id;

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }
    const isOwner = recipe.user_id === req.user.id;

    if (req.user.type !== 'admin' && !isOwner) {
      return res
        .status(403)
        .json({ message: 'Você não tem permissão para modificar esta receita' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Nenhuma imagem fornecida' });
    }

    recipe.image = req.file.buffer;
    await recipe.save();

    res.status(200).json({
      message: 'Imagem adicionada com sucesso à receita',
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
  } catch (error) {
    console.error('Erro ao adicionar imagem à receita:', error);
    res.status(500).json({
      message: 'Erro ao adicionar imagem à receita',
      error: error.message,
    });
  }
};
