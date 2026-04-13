const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');

// Public routes
router.get('/', doctorController.getDoctors);

// Apply verifyToken middleware to all routes below
router.use(verifyToken);

// Protected routes (Doctor only)
router.get('/me', restrictTo('doctor'), doctorController.getMe);
router.put('/me', restrictTo('doctor'), doctorController.updateMe);

// Protected routes (Admin only)
router.patch('/:id/verify', restrictTo('admin'), doctorController.verifyDoctor);

// Public route with dynamic id must come after /me and /:id/verify
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
