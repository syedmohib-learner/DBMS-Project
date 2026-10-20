const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, authorize(['owner']), authController.getUsers);
router.post('/users', authenticate, authorize(['owner']), authController.createUser);
router.put('/users/:id', authenticate, authorize(['owner']), authController.updateUser);

module.exports = router;
