const verifyInternalToken = (req, res, next) => {
  const internalToken = req.headers['x-internal-token'];

  if (!internalToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_INTERNAL',
        message: 'Missing internal token',
      },
    });
  }

  if (!process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal service token is not configured',
      },
    });
  }

  if (internalToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_INTERNAL',
        message: 'Invalid internal token',
      },
    });
  }

  next();
};

module.exports = {
  verifyInternalToken,
};