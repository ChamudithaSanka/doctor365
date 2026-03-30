const express = require('express');
const { 
  getMe, 
  updateMe, 
  getPatientById, 
  uploadPatientReports, 
  getPatientReports, 
  deletePatientReport,
  getAllPatients,
  getPrescriptions,
  addPrescription
} = require('../controllers/patientController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { uploadReports } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Health check route - unauthenticated for Kubernetes probes
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'patient-service',
  });
});

// Apply verifyToken middleware to all routes below in this router
router.use(verifyToken);

router.route('/')
  .get(restrictTo('admin'), getAllPatients);

router.route('/me')
  .get(restrictTo('patient', 'admin'), getMe)
  .put(restrictTo('patient', 'admin'), updateMe);

router.route('/me/reports')
  .get(restrictTo('patient', 'doctor', 'admin'), getPatientReports)
  .post(restrictTo('patient'), uploadReports, uploadPatientReports);

router.route('/me/reports/:reportId')
  .delete(restrictTo('patient'), deletePatientReport);

router.route('/me/prescriptions')
  .get(restrictTo('patient'), getPrescriptions);

router.route('/:id')
  .get(restrictTo('admin', 'doctor'), getPatientById);

router.route('/:id/prescriptions')
  .post(restrictTo('doctor', 'admin'), addPrescription);

module.exports = router;
