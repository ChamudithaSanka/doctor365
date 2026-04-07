const express = require('express');
const {
  initiatePayHereCheckout,
  handlePayHereNotify,
  createPayment,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
} = require('../controllers/paymentController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public callback endpoint from PayHere
router.post('/payhere/notify', handlePayHereNotify);

// Apply verifyToken middleware to all routes below
router.use(verifyToken);

// Initialize checkout for PayHere (patient only)
router.post('/checkout/payhere', restrictTo('patient'), initiatePayHereCheckout);

// Create payment (patient only)
router.post('/', restrictTo('patient'), createPayment);

// Get my payments (patient)
router.get('/me', restrictTo('patient'), getMyPayments);

// Get payment by ID (patient/admin)
router.get('/:id', restrictTo('patient', 'admin'), getPaymentById);

// Update payment status (admin callback)
router.patch('/:id/status', restrictTo('admin'), updatePaymentStatus);

module.exports = router;
