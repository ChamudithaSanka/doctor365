const express = require('express');
const router = express.Router();
const {
  createSession,
  getUserSessions,
  getSessionByAppointmentId,
  getSessionById,
  startSession,
  endSession,
  addPatientFeedback,
  cancelSession,
} = require('../controllers/telemedicineController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Health check - public
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'telemedicine-service',
  });
});

// Apply verifyToken middleware to all routes below
router.use(verifyToken);

// Create session (doctor only)
router.post('/', restrictTo('doctor'), createSession);

// Get all sessions for current user
router.get('/', restrictTo('patient', 'doctor', 'admin'), getUserSessions);

// Get session by appointment ID
router.get('/appointment/:appointmentId', restrictTo('patient', 'doctor', 'admin'), getSessionByAppointmentId);

// Get session by ID
router.get('/:id', restrictTo('patient', 'doctor', 'admin'), getSessionById);

// Start session (doctor only)
router.patch('/:id/start', restrictTo('doctor'), startSession);

// End session (doctor only)
router.patch('/:id/end', restrictTo('doctor'), endSession);

// Add patient feedback
router.patch('/:id/feedback', restrictTo('patient'), addPatientFeedback);

// Cancel session (doctor only)
router.patch('/:id/cancel', restrictTo('doctor'), cancelSession);

module.exports = router;
