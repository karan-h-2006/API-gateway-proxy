const AppError = require('../services/appError');

const notFoundMiddleware = (req, res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found.`));
};

module.exports = notFoundMiddleware;
