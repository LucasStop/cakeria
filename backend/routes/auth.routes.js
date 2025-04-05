const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rota de autenticação
router.post('/login', authController.login);

module.exports = router;
