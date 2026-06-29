const { ZodError } = require('zod');
const AppError = require('../services/appError');

const errorHandlerMiddleware = (error, req, res, next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed.',
      details: error.issues
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: 'Internal server error.'
  });
};

module.exports = errorHandlerMiddleware;
