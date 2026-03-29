const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let code = 'SERVER_ERROR';
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Resource not found with id of ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    code = 'DUPLICATE_FIELD_VALUE';
    message = 'Duplicate field value entered';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = errorHandler;
