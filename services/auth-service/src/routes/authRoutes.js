const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../../../../shared/authUtils');
const { verifyInternalToken } = require('../middleware/internalMiddleware');

const router = express.Router();

const requireAdmin = (req, res, next) => {
	if (req.user?.role !== 'admin') {
		return res.status(403).json({
			success: false,
			error: {
				code: 'FORBIDDEN',
				message: 'You do not have permission to perform this action',
			},
		});
	}

	next();
};

router.post('/register', authController.register);
router.patch('/admin/users/:id/verify', verifyToken, requireAdmin, authController.updateDoctorVerification);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/internal/users/:id', verifyInternalToken, authController.getUserById);

module.exports = router;
