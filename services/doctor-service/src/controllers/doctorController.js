const Doctor = require('../models/Doctor');

const DEFAULT_AUTH_SERVICE_URL = 'http://auth-service:5001';

const deleteAuthUser = async (userId, role) => {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || DEFAULT_AUTH_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    const error = new Error('INTERNAL_SERVICE_TOKEN is not configured');
    error.status = 500;
    throw error;
  }

  const response = await fetch(
    `${authServiceUrl}/auth/internal/users/${userId}?role=${encodeURIComponent(role)}`,
    {
      method: 'DELETE',
      headers: {
        'x-internal-token': internalToken,
      },
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'Failed to delete auth user');
    error.status = response.status;
    throw error;
  }
};

// @desc    Get all doctors (Public)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    let query = {};

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { hospitalOrClinic: new RegExp(search, 'i') }
      ];
    }

    const doctors = await Doctor.find(query).select('-__v');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
      message: 'Doctors retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Get doctor by ID (Public)
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { userId: req.params.id }] }
      : { userId: req.params.id };

    const doctor = await Doctor.findOne(query);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
      message: 'Doctor details retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current doctor profile
// @route   GET /api/doctors/me
// @access  Private (Doctor)
const getMe = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor profile not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
      message: 'Doctor profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or create doctor profile
// @route   PUT /api/doctors/me
// @access  Private (Doctor)
const updateMe = async (req, res, next) => {
  try {
    const profileData = {
      ...req.body,
      userId: req.user.userId
    };

    // Ensure isVerified cannot be set by the doctor themselves
    delete profileData.isVerified;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: profileData },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: doctor,
      message: 'Doctor profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a doctor (Admin only)
// @route   PATCH /api/doctors/:id/verify
// @access  Private (Admin)
const verifyDoctor = async (req, res, next) => {
  try {
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'isVerified must be a boolean' }
      });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { userId: req.params.id }] }
      : { userId: req.params.id };

    const doctor = await Doctor.findOneAndUpdate(
      query,
      { isVerified },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
      message: `Doctor verified status updated to ${isVerified}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle doctor active status (enable/disable)
// @route   PATCH /api/doctors/:id/status
// @access  Private (Admin)
const toggleDoctorStatus = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { userId: req.params.id }] }
      : { userId: req.params.id };

    const doctor = await Doctor.findOne(query);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found' }
      });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.status(200).json({
      success: true,
      data: doctor,
      message: `Doctor ${doctor.isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
const deleteDoctor = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);

    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { userId: req.params.id }] }
      : { userId: req.params.id };

    const doctor = await Doctor.findOne(query);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found' }
      });
    }

    await deleteAuthUser(doctor.userId, 'doctor');
    await Doctor.findByIdAndDelete(doctor._id);

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getMe,
  updateMe,
  verifyDoctor,
  toggleDoctorStatus,
  deleteDoctor
};
