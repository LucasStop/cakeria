const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer();

// Rotas públicas
router.get('/', recipeController.getAll);
router.get('/:id', recipeController.getById);
router.get('/:id/image', recipeController.getImage);

// Rotas protegidas que requerem autenticação
router.post('/', authenticate, upload.single('image'), recipeController.create);
router.put('/:id', authenticate, upload.single('image'), recipeController.update);
router.delete('/:id', authenticate, recipeController.delete);
router.post('/:id/image', authenticate, upload.single('image'), recipeController.addImage);

module.exports = router;
