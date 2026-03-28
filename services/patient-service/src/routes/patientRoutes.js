const express = require('express');
const { getMe, updateMe, getPatientById, uploadPatientReports, getPatientReports, deletePatientReport } = require('../controllers/patientController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { uploadReports } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply verifyToken middleware to all routes in this router
router.use(verifyToken);

router.route('/me')
  .get(restrictTo('patient', 'admin'), getMe)
  .put(restrictTo('patient', 'admin'), updateMe);

router.route('/me/reports')
  .get(restrictTo('patient', 'doctor', 'admin'), getPatientReports)
  .post(restrictTo('patient'), uploadReports, uploadPatientReports);

router.route('/me/reports/:reportId')
  .delete(restrictTo('patient'), deletePatientReport);

router.route('/:id')
  .get(restrictTo('admin', 'doctor'), getPatientById);

module.exports = router;
