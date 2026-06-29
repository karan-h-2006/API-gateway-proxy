const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../services/appError');
const developerRepository = require('../db/repositories/developerRepository');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      throw new AppError(401, 'Authorization token is required.');
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const developer = await developerRepository.findDeveloperById(payload.sub);

    if (!developer) {
      throw new AppError(401, 'Developer account not found.');
    }

    if (!developer.isActive) {
      throw new AppError(403, 'Developer account is inactive.');
    }

    req.user = {
      id: developer.id,
      email: developer.email,
      name: developer.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError(401, 'Invalid or expired authorization token.'));
      return;
    }

    next(error);
  }
};

module.exports = authenticateToken;
