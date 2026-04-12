const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Health check - public
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'appointment-service',
  });
});

// Apply verifyToken middleware to all routes below
router.use(verifyToken);
// Get all appointments (admin only)
router.get('/', restrictTo('admin'), getMyAppointments);
// Create appointment (patient only)
router.post('/', restrictTo('patient'), createAppointment);

// Get my appointments (patient/doctor)
router.get('/me', restrictTo('patient', 'doctor', 'admin'), getMyAppointments);

// Update appointment status (doctor/admin)
router.patch('/:id/status', restrictTo('doctor', 'admin'), updateAppointmentStatus);

// Get appointment by ID (patient/doctor/admin)
router.get('/:id', restrictTo('patient', 'doctor', 'admin'), getAppointmentById);

// Update appointment (patient)
router.put('/:id', restrictTo('patient'), updateAppointment);

// Delete appointment (patient)
router.delete('/:id', restrictTo('patient'), deleteAppointment);

module.exports = router;
