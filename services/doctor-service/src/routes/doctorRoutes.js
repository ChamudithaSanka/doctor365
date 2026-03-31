const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken } = require('../../../../shared/authUtils');
const { isAdmin, isDoctor } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);

// Protected routes (Doctor only)
router.get('/me', verifyToken, isDoctor, doctorController.getMe);
router.post('/me', verifyToken, isDoctor, doctorController.updateMe);
router.put('/me', verifyToken, isDoctor, doctorController.updateMe);

// Protected routes (Admin only)
router.patch('/:id/verify', verifyToken, isAdmin, doctorController.verifyDoctor);

module.exports = router;
