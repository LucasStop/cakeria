const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer();

// Rota pública para criar usuários (registro)
router.post('/', upload.single('image'), userController.create);

// Rotas que precisam de autenticação
router.get('/', authenticate, userController.findAll);
router.get('/:id', authenticate, userController.findOne);
router.put('/:id', authenticate, upload.single('image'), userController.update);
router.delete('/:id', authenticate, userController.delete);
router.get('/:id/image', authenticate, userController.getUserImage);

module.exports = router;
