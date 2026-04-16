const jwt = require('jsonwebtoken');
const { verifyToken, restrictTo } = require('../../../../shared/authUtils');
const Patient = require('../models/Patient');

// Middleware to check if patient account is active
const checkPatientActive = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.userId });
      
      if (!patient || patient.isActive === false) {
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
  checkPatientActive,
};
