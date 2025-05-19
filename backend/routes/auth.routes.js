const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/login', authController.login);

router.post('/refresh', authController.refresh);

// Rota para verificar o token e retornar dados do usuário
router.get('/verify', authMiddleware, authController.verify);

module.exports = router;
