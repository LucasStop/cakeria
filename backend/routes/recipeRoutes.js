const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/auth');

// Rotas públicas
router.get('/recipes', recipeController.getAllRecipes);
router.get('/recipes/:id', recipeController.getRecipeById);
router.get('/recipes/slug/:slug', recipeController.getRecipeBySlug);
router.get('/recipes/:recipeId/comments', commentController.getRecipeComments);

// Rotas protegidas (requer autenticação)
router.use(authMiddleware);
router.post('/recipes', recipeController.createRecipe);
router.put('/recipes/:id', recipeController.updateRecipe);
router.delete('/recipes/:id', recipeController.deleteRecipe);
router.get('/user/recipes', recipeController.getUserRecipes);
router.post('/recipes/:recipeId/comments', commentController.addComment);
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;
