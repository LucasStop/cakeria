const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.findAll);
router.get('/image/:id', productController.getImage); 
router.get('/slug/:slug', productController.findBySlug);
router.get('/category/:categoryId', productController.findByCategory);
router.get('/:id', productController.findOne);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

module.exports = router;
