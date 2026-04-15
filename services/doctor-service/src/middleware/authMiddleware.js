const jwt = require('jsonwebtoken');
const { verifyToken, restrictTo } = require('../../../../shared/authUtils');
const Doctor = require('../models/Doctor');

// Middleware to check if doctor account is active
const checkDoctorActive = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.userId });
      
      if (!doctor || doctor.isActive === false) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled and you cannot access the service.',
          },
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  restrictTo,
  checkDoctorActive,
};
