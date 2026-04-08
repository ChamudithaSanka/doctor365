const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../../../../shared/authUtils');

const patientServiceBaseUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:5002';

const sanitizeText = (value) => String(value || '').trim();

const validatePatientRegistration = (payload) => {
  const requiredFields = [
    'dateOfBirth',
    'gender',
    'phone',
    'address',
    'emergencyContact',
  ];

  const missingFields = requiredFields.filter((field) => !payload[field]);
  return missingFields;
};

const normalizePhone = (value) => String(value || '').replace(/[\s-]/g, '');

const normalizePatientPayload = (payload) => ({
  firstName: String(payload.firstName || '').trim(),
  lastName: String(payload.lastName || '').trim(),
  dateOfBirth: String(payload.dateOfBirth || '').trim(),
  gender: String(payload.gender || '').trim().toLowerCase(),
  phone: normalizePhone(payload.phone),
  address: String(payload.address || '').trim(),
  emergencyContact: normalizePhone(payload.emergencyContact),
  medicalHistorySummary: String(payload.medicalHistorySummary || '').trim(),
});

const createPatientProfile = async (accessToken, payload) => {
  const response = await fetch(`${patientServiceBaseUrl}/api/patients/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const serviceMessage = data?.error?.message || data?.message || 'Unable to create patient profile';
    const error = new Error(serviceMessage);
    error.status = response.status;
    error.details = data?.error?.details;
    throw error;
  }
};

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      emergencyContact,
      medicalHistorySummary,
    } = req.body;

    const targetRole = 'patient';
    const normalizedPatientPayload = normalizePatientPayload({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      emergencyContact,
      medicalHistorySummary,
    });

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide all required fields',
        },
      });
    }

    if (targetRole === 'patient') {
      const missingPatientFields = validatePatientRegistration({
        dateOfBirth: normalizedPatientPayload.dateOfBirth,
        gender: normalizedPatientPayload.gender,
        phone: normalizedPatientPayload.phone,
        address: normalizedPatientPayload.address,
        emergencyContact: normalizedPatientPayload.emergencyContact,
      });

      if (missingPatientFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Missing required patient fields: ${missingPatientFields.join(', ')}`,
          },
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName: normalizedPatientPayload.firstName || firstName,
      lastName: normalizedPatientPayload.lastName || lastName,
      role: targetRole,
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.role);

    if (targetRole === 'patient') {
      try {
        await createPatientProfile(accessToken, normalizedPatientPayload);
      } catch (profileError) {
        await User.findByIdAndDelete(user._id);

        const statusCode = profileError.status >= 400 && profileError.status < 500 ? 400 : 502;

        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'PATIENT_PROFILE_SETUP_FAILED',
            message: `User was not created because patient profile setup failed: ${profileError.message}`,
            details: profileError.details || [],
          },
        });
      }
    }

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Return user info (exclude password and refreshToken)
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error during registration',
      },
    });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide email, password, firstName, and lastName',
        },
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    const user = new User({
      email: sanitizeText(email).toLowerCase(),
      password,
      firstName: sanitizeText(firstName),
      lastName: sanitizeText(lastName),
      role: 'doctor',
      isVerified: true,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      message: 'Doctor auth account created successfully',
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating doctor account',
      },
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide email and password',
        },
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.role);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error during login',
      },
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Refresh token does not match',
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id, user.email, user.role);

    // Save new refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error refreshing token',
      },
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Clear refresh token from database
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error during logout',
      },
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('email firstName lastName role isVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error retrieving user',
      },
    });
  }
};
