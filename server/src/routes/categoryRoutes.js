const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', authorize(['owner']), categoryController.createCategory);
router.put('/:id', authorize(['owner']), categoryController.updateCategory);
router.delete('/:id', authorize(['owner']), categoryController.deleteCategory);

module.exports = router;
