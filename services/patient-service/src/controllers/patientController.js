const Patient = require('../models/Patient');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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

const getPatientById = async (req, res, next) => {
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

    console.log(`[downloadReport] reportId: ${reportId}`);

    // Must cast to ObjectId — querying subdocument _id with a plain string won't match
    let reportObjectId;
    try {
      reportObjectId = new mongoose.Types.ObjectId(reportId);
    } catch {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid report ID format' },
      });
    }

    const patient = await Patient.findOne({ 'reports._id': reportObjectId });

    if (!patient) {
      console.log(`[downloadReport] No patient found with report _id: ${reportId}`);
      return res.status(404).json({
        success: false,
        error: { code: 'REPORT_NOT_IN_DB', message: 'Report record not found in database' },
      });
    }

    // Patients can only access their own reports; doctors/admins can access any
    if (req.user.role === 'patient' && patient.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to access this report' },
      });
    }

    const report = patient.reports.id(reportObjectId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: { code: 'REPORT_SUBDOC_MISSING', message: 'Report subdocument not found' },
      });
    }

    const absolutePath = path.resolve(report.filePath);
    console.log(`[downloadReport] Resolved file path: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      console.error(`[downloadReport] File not on disk: ${absolutePath}`);
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_ON_DISK', message: 'Physical file not found on server' },
      });
    }

    res.set('Content-Type', report.mimeType);
    res.set(
      'Content-Disposition',
      download === 'true'
        ? `attachment; filename="${report.originalName}"`
        : `inline; filename="${report.originalName}"`
    );

    res.sendFile(absolutePath);
  } catch (error) {
    console.error(`[downloadReport] Unexpected error:`, error);
    next(error);
  }
};

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

// @desc    Get prescriptions for a specific patient by ID (Doctor / Admin view)
// @route   GET /:id/prescriptions
// @access  Private (Doctor, Admin)
const getPatientPrescriptions = async (req, res, next) => {
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
      data: patient.prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

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

    patient.medicalHistory.push({
      date: new Date(date),
      condition,
      treatment,
      doctorName: req.body.doctorName || 'Unknown Doctor',
    });

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
  getPatientPrescriptions,
  addPrescription,
  getMedicalHistory,
  updateMedicalHistory,
  addMedicalHistory,
  getPatientMedicalHistory,
};