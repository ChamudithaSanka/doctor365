const jwt = require('jsonwebtoken');

/**
 * Verify JWT Token from Authorization header
 * Expected header format: Authorization: Bearer <token>
 * 
 * Extracts token payload into req.user:
 *   - userId: User ID from token
 *   - email: User email
 *   - role: User role (patient, doctor, admin)
 *   - name: User full name
 * 
 * Returns 401 if:
 *   - No token provided
 *   - Token is invalid or expired
 */
const verifyToken = (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_AUTH_HEADER',
          message: 'Authorization header is missing',
        },
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        },
      });
    }

    const token = parts[1];

    // 2. Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Validate required fields in token payload
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Token payload missing required fields',
        },
      });
    }

    // 4. Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name || '',
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.',
        },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token provided',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Verify user has required role(s)
 * Usage: authorizeRole('doctor') or authorizeRole('doctor', 'admin')
 * 
 * Returns 403 if user role not in allowed roles
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check user was authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    // 2. Check user has allowed role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This operation requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        },
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRole,
};
