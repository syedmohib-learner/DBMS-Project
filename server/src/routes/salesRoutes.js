const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', salesController.getSales);
router.get('/:id', salesController.getSaleById);
router.post('/', salesController.createSale);
router.patch('/:id/void', authorize(['owner']), salesController.voidSale);

module.exports = router;
