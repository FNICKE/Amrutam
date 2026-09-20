'use strict';

const logger = require('../config/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';
  let code       = err.code       || 'INTERNAL_ERROR';
  let errors     = err.errors     || undefined;

  if (err.code === 'P2002') { statusCode = 409; message = 'A record with this value already exists'; code = 'CONFLICT'; }
  if (err.code === 'P2025') { statusCode = 404; message = 'Record not found'; code = 'NOT_FOUND'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; code = 'TOKEN_EXPIRED'; }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; code = 'INVALID_TOKEN'; }

  if (statusCode >= 500) {
    logger.error('Server error', { message: err.message, stack: err.stack, url: req.originalUrl, requestId: req.requestId });
  } else {
    logger.warn('Client error', { message, statusCode, url: req.originalUrl, requestId: req.requestId });
  }

  if (!env.isDev && statusCode >= 500) { message = 'Internal server error'; errors = undefined; }

  const body = { success: false, message, code };
  if (errors) body.errors = errors;
  if (env.isDev && err.stack) body.stack = err.stack;
  return res.status(statusCode).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found`, code: 'NOT_FOUND' });
}

module.exports = { errorHandler, notFoundHandler };
