const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// As per SDS, Purchases are managed by Owner
router.get('/', authorize(['owner']), purchaseController.getPurchases);
router.get('/:id', authorize(['owner']), purchaseController.getPurchaseById);
router.post('/', authorize(['owner']), purchaseController.createPurchase);

module.exports = router;
