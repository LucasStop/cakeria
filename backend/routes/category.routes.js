const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

// Rotas públicas
router.get('/', categoryController.findAll);
router.get('/slug/:slug', categoryController.findBySlug);
router.get('/:id', categoryController.findOne);

// Rotas que precisam de autenticação
router.post('/', authenticate, categoryController.create);
router.put('/:id', authenticate, categoryController.update);
router.delete('/:id', authenticate, categoryController.delete);

module.exports = router;
