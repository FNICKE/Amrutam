'use strict';

const jwt = require('jsonwebtoken');
const env = require('./env');

/**
 * Sign an access token (short-lived, 15 min)
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

/**
 * Sign a refresh token (long-lived, 7 days)
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

/**
 * Verify an access token — throws if invalid/expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

/**
 * Verify a refresh token — throws if invalid/expired
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
