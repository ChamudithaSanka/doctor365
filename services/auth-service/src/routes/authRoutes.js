const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../../../../shared/authUtils');
const { verifyInternalToken } = require('../middleware/internalMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/internal/users/:id', verifyInternalToken, authController.getUserById);

module.exports = router;
