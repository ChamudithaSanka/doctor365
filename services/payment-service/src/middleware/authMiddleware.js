const jwt = require('jsonwebtoken');
const { verifyToken, restrictTo } = require('../../../../shared/authUtils');

const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:5002';
const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003';

// Middleware to check if user account is active
const checkAccountActive = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    if (req.user.role === 'patient') {
      const response = await fetch(`${patientServiceUrl}/api/patients/me`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.isActive === false) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCOUNT_DISABLED',
              message: 'Your account has been disabled and you cannot access this service.',
            },
          });
        }
      }
    } else if (req.user.role === 'doctor') {
      const response = await fetch(`${doctorServiceUrl}/api/doctors/me`, {
        headers: {
          'Authorization': `Bearer ${req.headers.authorization?.replace('Bearer ', '')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.isActive === false) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCOUNT_DISABLED',
              message: 'Your account has been disabled and you cannot access this service.',
            },
          });
        }
      }
    }

    next();
  } catch (error) {
    console.warn('Could not verify account status:', error.message);
    next();
  }
};

module.exports = {
  verifyToken,
  restrictTo,
  checkAccountActive,
};
