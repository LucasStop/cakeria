const { Comment, User, Recipe } = require('../models');

module.exports = {
  // Adicionar comentário a uma receita
  addComment: async (req, res) => {
    try {
      const { recipeId } = req.params;
      const { content } = req.body;

      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Verificar se a receita existe
      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: 'Receita não encontrada' });
      }

      const comment = await Comment.create({
        content,
        user_id: req.user.id,
        recipe_id: recipeId,
      });

      // Buscar o comentário com dados do autor
      const commentWithUser = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      });

      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      res.status(500).json({ message: 'Erro ao adicionar comentário' });
    }
  },

  // Remover comentário
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;

      const comment = await Comment.findByPk(id);
      if (!comment) {
        return res.status(404).json({ message: 'Comentário não encontrado' });
      }

      // Verificar se o usuário é o autor do comentário
      if (!req.user || comment.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Não autorizado a excluir este comentário' });
      }

      await comment.destroy();

      res.json({ message: 'Comentário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      res.status(500).json({ message: 'Erro ao excluir comentário' });
    }
  },

  // Listar comentários de uma receita
  getRecipeComments: async (req, res) => {
    try {
      const { recipeId } = req.params;

      const comments = await Comment.findAll({
        where: { recipe_id: recipeId },
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
      });

      res.json(comments);
    } catch (error) {
      console.error('Erro ao listar comentários:', error);
      res.status(500).json({ message: 'Erro ao listar comentários' });
    }
  },
};
