const { Recipe, User } = require('../models'); // Corrigido para acessar o modelo Recipe do objeto exportado por models

// Renomear funções para ficarem consistentes com as rotas
exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
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
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create(req.body);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const [updated] = await Recipe.update(req.body, {
      where: { id: req.params.id },
    });

    if (updated === 0) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

    const updatedRecipe = await Recipe.findByPk(req.params.id);
    res.status(200).json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const deleted = await Recipe.destroy({
      where: { id: req.params.id },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Receita não encontrada' });
    }

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
