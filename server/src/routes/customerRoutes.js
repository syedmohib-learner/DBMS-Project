const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.post('/:id/payments', customerController.recordPayment);
router.get('/:id/ledger', customerController.getCustomerLedger);

module.exports = router;
