const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.get('/', doctorController.getDoctors);

// Protected routes — apply auth per-route so public routes remain public
router.get('/me', verifyToken, restrictTo('doctor'), doctorController.getMe);
router.put('/me', verifyToken, restrictTo('doctor'), doctorController.updateMe);

// Admin only
router.post('/admin', verifyToken, restrictTo('admin'), doctorController.createDoctor);
router.patch('/:id/verify', verifyToken, restrictTo('admin'), doctorController.verifyDoctor);

// Public — must be LAST so it doesn't catch /me or /admin
router.get('/:id', doctorController.getDoctorById);

module.exports = router;