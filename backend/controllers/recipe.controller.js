const { Recipe, User } = require('../models'); // Corrigido para acessar o modelo Recipe do objeto exportado por models

// Renomear funções para ficarem consistentes com as rotas
exports.getAll = async (req, res) => {
  try {
    const recipe = await Recipe.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      ],
    });
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

    // Incrementar a contagem de visualizações
    if (recipe.views === null || recipe.views === undefined) {
      recipe.views = 1;
    } else {
      recipe.views += 1;
    }

    // Salvar a atualização da contagem de visualizações
    await recipe.save();

    console.log(`Visualizações da receita ${recipe.id} incrementadas para ${recipe.views}`);

    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Garante que o userId seja o do usuário autenticado
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const recipeData = {
      ...req.body,
      userId: req.user.id, // Garante que a receita seja associada ao usuário autenticado
    };

    const recipe = await Recipe.create(recipeData);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const recipeId = req.params.id;

    // Verificar se a receita existe
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

    // Verificar permissões
    if (
      req.user.type !== 'admin' &&
      recipe.userId !== req.user.id &&
      recipe.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta receita' });
    }

    // Não permitir mudar o userId da receita
    const updateData = { ...req.body };
    delete updateData.userId;
    delete updateData.user_id;

    const [updated] = await Recipe.update(updateData, {
      where: { id: recipeId },
    });

    const updatedRecipe = await Recipe.findByPk(recipeId);
    res.status(200).json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const recipeId = req.params.id;

    // Verificar se a receita existe
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

    // Verificar permissões
    if (
      req.user.type !== 'admin' &&
      recipe.userId !== req.user.id &&
      recipe.user_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir esta receita' });
    }

    await recipe.destroy();
    res.status(200).json({ message: 'Receita deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Adicionar método para buscar detalhes do usuário
exports.addImage = async (req, res) => {
  // Implementação para adicionar imagens (será implementada mais tarde)
  res.status(501).json({ message: 'Funcionalidade ainda não implementada' });
};
