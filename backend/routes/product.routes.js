const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rotas públicas
router.get('/', productController.findAll);
router.get('/image/:id', productController.getImage); 
router.get('/slug/:slug', productController.findBySlug);
router.get('/category/:categoryId', productController.findByCategory);
router.get('/:id', productController.findOne);

// Rotas protegidas que requerem autenticação
router.post('/', authenticate, productController.create);
router.put('/:id', authenticate, productController.update);
router.delete('/:id', authenticate, productController.delete);

module.exports = router;
