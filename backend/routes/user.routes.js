const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Rota pública para criar usuários (registro)
router.post('/', userController.create);

// Rotas que precisam de autenticação
router.get('/', authenticate, userController.findAll);
router.get('/:id', authenticate, userController.findOne);
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, userController.delete);
router.get('/', userController.findAll);
router.get('/:id', userController.findOne);

module.exports = router;
