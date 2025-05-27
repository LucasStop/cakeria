const { User } = require('../models');

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (req.user.type === 'admin') {
      return next();
    }

    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao verificar permissões', error: error.message });
  }
};

exports.isOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (req.user.type === 'admin') {
      return next();
    }

    if (req.resourceType === 'recipe') {
      const { Recipe } = require('../models');
      const recipe = await Recipe.findByPk(req.params.id);

      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }

      if (recipe.userId === req.user.id || recipe.user_id === req.user.id) {
        return next();
      }
    }

    if (req.resourceType === 'comment') {
      const { Comment } = require('../models');
      const comment = await Comment.findByPk(req.params.id);

      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado' });
      }

      if (comment.user_id === req.user.id) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Você não tem permissão para esta operação' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao verificar permissões', error: error.message });
  }
};
