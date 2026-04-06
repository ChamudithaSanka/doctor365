const express = require('express');
const {
  createPayment,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
} = require('../controllers/paymentController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { verifyAdminToken } = require('../middleware/callbackMiddleware');

const router = express.Router();

// Apply verifyToken middleware to all routes below
router.use(verifyToken);

// Create payment (patient only)
router.post('/', restrictTo('patient'), createPayment);

// Get my payments (patient)
router.get('/me', restrictTo('patient'), getMyPayments);

// Get payment by ID (patient/admin)
router.get('/:id', restrictTo('patient', 'admin'), getPaymentById);

// Update payment status (admin callback)
router.patch('/:id/status', restrictTo('admin'), updatePaymentStatus);

module.exports = router;
