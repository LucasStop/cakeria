const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rotas públicas
router.get('/', recipeController.getAll);
router.get('/:id', recipeController.getById);

// Rotas protegidas que requerem autenticação
router.post('/', authenticate, recipeController.create);
router.put('/:id', authenticate, recipeController.update);
router.delete('/:id', authenticate, recipeController.delete);

module.exports = router;
