const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, restrictTo, checkDoctorActive } = require('../middleware/authMiddleware');

// Public routes
router.get('/', doctorController.getDoctors);

// Protected routes — apply auth per-route so public routes remain public
router.get('/me', verifyToken, restrictTo('doctor'), checkDoctorActive, doctorController.getMe);
router.put('/me', verifyToken, restrictTo('doctor'), doctorController.updateMe);

// Admin only
router.patch('/:id/verify', verifyToken, restrictTo('admin'), doctorController.verifyDoctor);
router.patch('/:id/status', verifyToken, restrictTo('admin'), doctorController.toggleDoctorStatus);
router.delete('/:id', verifyToken, restrictTo('admin'), doctorController.deleteDoctor);

// Public — must be LAST so it doesn't catch /me
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
