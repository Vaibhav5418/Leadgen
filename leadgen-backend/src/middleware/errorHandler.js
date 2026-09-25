function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error internally safely
  console.error(`[${req.id || 'NO_ID'}] ERROR: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    userId: req.user ? req.user._id : 'unauthenticated',
    stack: isProduction ? undefined : err.stack
  });

  if (res.headersSent) {
    return next(err);
  }

  // Safe user-facing message
  let message = 'An unexpected error occurred.';
  
  if (err.isOperational || statusCode < 500) {
    message = err.message;
  } else if (!isProduction) {
    message = err.message; // Expose message in non-prod
  }

  const response = {
    success: false,
    error: message,
    requestId: req.id
  };

  if (!isProduction && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
