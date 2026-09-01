function errorHandler(error, req, res, next) {
  console.error(error);

  const statusCode = error.statusCode || error.status || 500;
  const message = statusCode >= 500 ? 'Internal server error.' : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500
      ? { stack: error.stack }
      : {}),
  });
}

module.exports = { errorHandler };
