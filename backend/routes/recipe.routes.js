const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rotas públicas
router.get('/', recipeController.getAllRecipes);
router.get('/:id', recipeController.getRecipeById);

// Rotas protegidas que requerem autenticação
router.post('/', authenticate, recipeController.createRecipe);
router.put('/:id', authenticate, recipeController.updateRecipe);
router.delete('/:id', authenticate, recipeController.deleteRecipe);

module.exports = router;
