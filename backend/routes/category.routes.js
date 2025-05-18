const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const categoryController = require('../controllers/category.controller');

router.get('/', categoryController.findAll);
router.get('/slug/:slug', categoryController.findBySlug);
router.get('/:id', categoryController.findOne);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

// Rotas que precisam de autenticação
// router.post('/', authenticate, categoryController.create);
// router.put('/:id', authenticate, categoryController.update);
// router.delete('/:id', authenticate, categoryController.delete);

module.exports = router;
