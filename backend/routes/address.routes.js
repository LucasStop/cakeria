const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, addressController.findAll);
router.get('/:id', authenticate, addressController.findOne);
router.get('/user/:userId', authenticate, addressController.findByUser);
router.post('/', authenticate, addressController.create);
router.put('/:id', authenticate, addressController.update);
router.delete('/:id', authenticate, addressController.delete);

module.exports = router;
