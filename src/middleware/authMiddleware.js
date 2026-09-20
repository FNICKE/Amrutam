'use strict';

const { verifyAccessToken } = require('../config/jwt');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../config/logger');

/** Authenticate requests via Bearer JWT. Attaches decoded payload to req.user */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }
    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
    logger.debug('User authenticated', { userId: req.user.id, role: req.user.role });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AuthenticationError('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(new AuthenticationError('Invalid token'));
    next(err);
  }
}

/** Optional auth — populates req.user if token present, does not block */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.slice(7));
    } catch { /* treat as unauthenticated */ }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
