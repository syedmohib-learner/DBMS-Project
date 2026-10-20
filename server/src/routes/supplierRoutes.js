const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', supplierController.getSuppliers);
router.post('/', authorize(['owner']), supplierController.createSupplier);
router.put('/:id', authorize(['owner']), supplierController.updateSupplier);
router.delete('/:id', authorize(['owner']), supplierController.deleteSupplier);

module.exports = router;
