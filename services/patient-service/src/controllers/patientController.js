const Patient = require('../models/Patient');
const fs = require('fs');
const path = require('path');

// @desc    Get current patient profile
// @route   GET /me
// @access  Private (Patient, Admin)
const getMe = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient profile not found. Please complete your profile setup.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
      message: 'Patient profile retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or create current patient profile
// @route   PUT /me
// @access  Private (Patient, Admin)
const updateMe = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      phone,
      address,
      city,
      country,
      emergencyContact,
      medicalHistorySummary,
    } = req.body;

    const profileData = {
      userId: req.user.userId,
      firstName,
      lastName,
      email: email || req.user.email,
      dateOfBirth,
      gender,
      phone,
      address,
      city,
      country,
      emergencyContact,
      medicalHistorySummary,
    };

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: profileData },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: patient,
      message: 'Patient profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile by ID
// @route   GET /:id
// @access  Private (Admin, Doctor)
const getPatientById = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    let patient;

    // We first try to find by MongoDB _id, if the provided ID is a valid ObjectId
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }

    // If not found by _id, try to find by userId (from auth)
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient profile not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
      message: 'Patient profile retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload medical reports
// @route   POST /me/reports
// @access  Private (Patient)
const uploadPatientReports = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'No files uploaded',
        },
      });
    }

    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient profile not found',
        },
      });
    }

    const newReports = req.files.map((file, index) => ({
      title: (Array.isArray(title) ? title[index] : title) || file.originalname,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      filePath: file.path,
    }));

    patient.reports.push(...newReports);
    await patient.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} report(s) uploaded successfully`,
      data: patient.reports,
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    next(error);
  }
};

// @desc    Get all reports for current patient
// @route   GET /me/reports
// @access  Private (Patient, Doctor, Admin)
const getPatientReports = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient profile not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: patient.reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports for a specific patient by ID (Doctor / Admin view)
// @route   GET /:id/reports
// @access  Private (Doctor, Admin)
const getPatientReportsById = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    let patient;

    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: patient.reports,
      patientName: `${patient.firstName} ${patient.lastName}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific report
// @route   DELETE /me/reports/:reportId
// @access  Private (Patient)
const deletePatientReport = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Patient profile not found',
        },
      });
    }

    const reportIndex = patient.reports.findIndex(
      (r) => r.id === req.params.reportId || r._id.toString() === req.params.reportId
    );

    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
    }

    const report = patient.reports[reportIndex];
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    patient.reports.splice(reportIndex, 1);
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download/View a specific report
// @route   GET /reports/:reportId/file
// @access  Private (Patient, Doctor, Admin)
const downloadReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { download } = req.query;

    const patient = await Patient.findOne({ 'reports._id': reportId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found' },
      });
    }

    if (req.user.role === 'patient' && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to access this report' },
      });
    }

    const report = patient.reports.id(reportId);
    if (!report || !fs.existsSync(report.filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Physical file not found on server' },
      });
    }

    res.set('Content-Type', report.mimeType);

    if (download === 'true') {
      res.download(report.filePath, report.originalName);
    } else {
      res.sendFile(path.resolve(report.filePath));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients
// @route   GET /
// @access  Private (Admin)
const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Patient.countDocuments();
    const patients = await Patient.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      count: patients.length,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions for current patient
// @route   GET /me/prescriptions
// @access  Private (Patient)
const getPrescriptions = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: patient.prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions for a specific patient by ID
// @route   GET /:id/prescriptions
// @access  Private (Doctor, Admin)
const getPatientPrescriptionsById = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    let patient;

    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }

    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: patient.prescriptions || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a prescription to a patient
// @route   POST /:id/prescriptions
// @access  Private (Doctor, Admin)
const addPrescription = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { doctorName, medication, instructions, diagnosis } = req.body;

    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    patient.prescriptions.push({
      doctorName,
      doctorId: req.user.userId,
      diagnosis: diagnosis || '',
      medication,
      instructions,
      date: new Date(),
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Prescription added successfully',
      data: patient.prescriptions[patient.prescriptions.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle patient active status (enable/disable)
// @route   PATCH /:id/status
// @access  Private (Admin)
const togglePatientStatus = async (req, res, next) => {
  try {
    const patientId = req.params.id;

    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    patient.isActive = !patient.isActive;
    await patient.save();

    res.status(200).json({
      success: true,
      message: `Patient ${patient.isActive ? 'enabled' : 'disabled'} successfully`,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical history for current patient
// @route   GET /me/medical-history
// @access  Private (Patient)
const getMedicalHistory = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.userId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        medicalHistory: patient.medicalHistory || [],
        medicalHistorySummary: patient.medicalHistorySummary || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medical history for current patient
// @route   PUT /me/medical-history
// @access  Private (Patient)
const updateMedicalHistory = async (req, res, next) => {
  try {
    const { medicalHistory } = req.body;

    if (!Array.isArray(medicalHistory)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Medical history must be an array' },
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { medicalHistory } },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical history updated successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add medical history for a patient (doctor adds for patient)
// @route   POST /:id/medical-history
// @access  Private (Doctor, Admin)
const addMedicalHistory = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { date, condition, treatment } = req.body;

    if (!date || !condition || !treatment) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Date, condition, and treatment are required' },
      });
    }

    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }
    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    const medicalHistoryEntry = {
      date: new Date(date),
      condition,
      treatment,
      doctorName: req.body.doctorName || 'Unknown Doctor',
    };

    patient.medicalHistory.push(medicalHistoryEntry);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Medical history added successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a patient
// @route   DELETE /:id
// @access  Private (Admin)
const deletePatient = async (req, res, next) => {
  try {
    const patientId = req.params.id;

    let patient;
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findByIdAndDelete(patientId);
    }
    if (!patient) {
      patient = await Patient.findOneAndDelete({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical history for a patient (doctor/admin reads another patient's history)
// @route   GET /:id/medical-history
// @access  Private (Doctor, Admin)
const getPatientMedicalHistory = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    let patient;

    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }

    if (!patient) {
      patient = await Patient.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient profile not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientId: patient._id,
        userId: patient.userId,
        medicalHistory: patient.medicalHistory || [],
        medicalHistorySummary: patient.medicalHistorySummary || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  updateMe,
  getPatientById,
  uploadPatientReports,
  getPatientReports,
  getPatientReportsById,
  deletePatientReport,
  downloadReport,
  getAllPatients,
  getPrescriptions,
  getPatientPrescriptionsById,
  addPrescription,
  togglePatientStatus,
  deletePatient,
  getMedicalHistory,
  updateMedicalHistory,
  addMedicalHistory,
  getPatientMedicalHistory,
};
