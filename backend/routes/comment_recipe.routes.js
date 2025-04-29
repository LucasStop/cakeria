const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment_recipe.controller');

router.post('/:recipeId', commentController.addComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router; // Adicionando a exportação que estava faltando
