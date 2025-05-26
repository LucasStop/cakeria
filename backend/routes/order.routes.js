const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, orderController.findAll);
router.get('/user/:userId', authenticate, orderController.findByUser);
router.get('/:id', authenticate, orderController.findOne);
router.post('/', authenticate, orderController.create);
router.put('/:id', authenticate, orderController.update);
router.delete('/:id', authenticate, orderController.delete);

module.exports = router;
