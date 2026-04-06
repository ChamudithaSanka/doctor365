const verifyAdminToken = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];

  if (!adminToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_ADMIN',
        message: 'Missing admin token for callback',
      },
    });
  }

  if (!process.env.ADMIN_CALLBACK_TOKEN) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Admin callback token is not configured',
      },
    });
  }

  if (adminToken !== process.env.ADMIN_CALLBACK_TOKEN) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_ADMIN',
        message: 'Invalid admin token',
      },
    });
  }

  next();
};

module.exports = {
  verifyAdminToken,
};
