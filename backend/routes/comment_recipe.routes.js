const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment_recipe.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rota para obter comentários de uma receita (pública)
router.get('/recipe/:recipeId', commentController.getRecipeComments);

// Rotas protegidas que exigem autenticação
router.post('/:recipeId', authenticate, commentController.addComment);
router.delete('/:id', authenticate, commentController.deleteComment);
router.put('/:id', authenticate, commentController.updateComment);

module.exports = router;
