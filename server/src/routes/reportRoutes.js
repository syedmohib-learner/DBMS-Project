const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Dashboard summary can be accessed by both, but profit is only included for owner
router.get('/summary', reportController.getDashboardSummary);

// Financial reports are owner only
router.get('/sales', authorize(['owner']), reportController.getSalesReport);
router.get('/profit', authorize(['owner']), reportController.getProfitReport);
router.get('/top-products', authorize(['owner']), reportController.getTopProducts);

module.exports = router;
