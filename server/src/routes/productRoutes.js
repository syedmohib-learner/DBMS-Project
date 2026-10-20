const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/low-stock', productController.getLowStockProducts);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authorize(['owner']), productController.createProduct);
router.put('/:id', authorize(['owner']), productController.updateProduct);
router.delete('/:id', authorize(['owner']), productController.deleteProduct);

module.exports = router;
