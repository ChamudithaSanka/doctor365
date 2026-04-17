const verifyInternalToken = (req, res, next) => {
  const internalToken = req.headers['x-internal-token'];
  const configuredToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!configuredToken) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_TOKEN_NOT_CONFIGURED',
        message: 'Internal service token is not configured',
      },
    });
  }

  if (!internalToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_INTERNAL_TOKEN',
        message: 'Internal service token is required',
      },
    });
  }

  if (internalToken !== configuredToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_INTERNAL_TOKEN',
        message: 'Invalid internal service token',
      },
    });
  }

  return next();
};

module.exports = {
  verifyInternalToken,
};
