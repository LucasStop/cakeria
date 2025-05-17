const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comments_recipes.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rota para obter comentários de uma receita (pública)
router.get('/recipe/:recipeId', commentController.getRecipeComments);

// Rotas protegidas que exigem autenticação
router.post('/:recipeId', authenticate, commentController.addComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
