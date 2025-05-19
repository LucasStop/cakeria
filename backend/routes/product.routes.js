const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../utils/upload');

router.get('/', productController.findAll);
router.get('/image/:id', productController.getImage);
router.get('/slug/:slug', productController.findBySlug);
router.get('/category/:categoryId', productController.findByCategory);
router.get('/:id', productController.findOne);

router.post('/', authenticate, upload.single('image'), productController.create);
router.put('/:id', authenticate, upload.single('image'), productController.update);
router.delete('/:id', authenticate, productController.delete);

module.exports = router;
