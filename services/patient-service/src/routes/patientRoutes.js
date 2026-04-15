const express = require('express');
const { body } = require('express-validator');
const { 
  getMe, 
  updateMe, 
  getPatientById, 
  uploadPatientReports, 
  getPatientReports, 
  getPatientReportsById,
  deletePatientReport,
  getAllPatients,
  getPrescriptions,
  addPrescription,
  getMedicalHistory,
  updateMedicalHistory,
  addMedicalHistory,
  getPatientMedicalHistory,
} = require('../controllers/patientController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { uploadReports } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');

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

// Patient profile validation rules
const patientValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth (YYYY-MM-DD)'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .customSanitizer(value => String(value || '').toLowerCase())
    .isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('phone').matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Please provide a valid phone number'),
  body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
  body('emergencyContact').matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage('Please provide a valid emergency contact number'),
  validate
];

router.route('/me')
  .get(restrictTo('patient', 'admin'), getMe)
  .put(restrictTo('patient', 'admin'), patientValidation, updateMe);

router.route('/me/reports')
  .get(restrictTo('patient', 'doctor', 'admin'), getPatientReports)
  .post(restrictTo('patient'), uploadReports, uploadPatientReports);

router.route('/me/reports/:reportId')
  .delete(restrictTo('patient'), deletePatientReport);

router.route('/me/prescriptions')
  .get(restrictTo('patient'), getPrescriptions);

router.route('/me/medical-history')
  .get(restrictTo('patient'), getMedicalHistory)
  .put(restrictTo('patient'), updateMedicalHistory);

router.route('/:id')
  .get(restrictTo('admin', 'doctor'), getPatientById);

router.route('/:id/reports')
  .get(restrictTo('doctor', 'admin'), getPatientReportsById);

// Prescription validation rules
const prescriptionValidation = [
  body('doctorName').notEmpty().withMessage('Doctor name is required'),
  body('medication').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medication.*.name').notEmpty().withMessage('Medication name is required'),
  body('medication.*.dosage').notEmpty().withMessage('Dosage is required'),
  validate
];

router.route('/:id/prescriptions')
  .post(restrictTo('doctor', 'admin'), prescriptionValidation, addPrescription);

router.route('/:id/medical-history')
  .get(restrictTo('doctor', 'admin'), getPatientMedicalHistory)
  .post(restrictTo('doctor', 'admin'), addMedicalHistory);

module.exports = router;
