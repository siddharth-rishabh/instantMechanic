const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/AppError');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required.', 401));
  }

  if (!env.jwtSecret) {
    return next(new AppError('JWT configuration is unavailable.', 500));
  }

  const token = authorization.slice(7).trim();

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
}

module.exports = { authenticate };
