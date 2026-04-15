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
    const { title } = req.body; // Default title if provided
    
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
      // Clean up uploaded files if patient not found
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
    // Cleanup on error
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
    // If patient is looking at own reports, use userId from token
    // If doc/admin is looking, they might pass patientId in query or we might need another route
    // For now, let's assume this route is primarily for the logged-in patient
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

    // Delete file from disk
    const report = patient.reports[reportIndex];
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    // Remove from array
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
        hasPrevPage: page > 1
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
      doctorId: req.user.userId, // Link to the doctor's user ID from the token
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

module.exports = {
  getMe,
  updateMe,
  getPatientById,
  uploadPatientReports,
  getPatientReports,
  deletePatientReport,
  getAllPatients,
  getPrescriptions,
  addPrescription,
  togglePatientStatus,
  deletePatient,
};
