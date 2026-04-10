const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);

// Apply verifyToken middleware to all routes below
router.use(verifyToken);

// Protected routes (Doctor only)
router.get('/me', restrictTo('doctor'), doctorController.getMe);
router.put('/me', restrictTo('doctor'), doctorController.updateMe);

// Protected routes (Admin only)
router.post('/admin', verifyToken, restrictTo('admin'), doctorController.createDoctor);
router.patch('/:id/verify', restrictTo('admin'), doctorController.verifyDoctor);

module.exports = router;
