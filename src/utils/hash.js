'use strict';

const bcrypt = require('bcryptjs');
const env = require('../config/env');

/**
 * Hash a plain-text password
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/**
 * Compare a plain-text password with a hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
