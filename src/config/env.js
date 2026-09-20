'use strict';

require('dotenv').config();

/**
 * Central env config — validated at startup.
 * App will crash early if required variables are missing.
 */
const required = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  // Server
  NODE_ENV:   process.env.NODE_ENV    || 'development',
  PORT:       parseInt(process.env.PORT || '5000', 10),
  isDev:      process.env.NODE_ENV !== 'production',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET:           process.env.JWT_SECRET,
  JWT_EXPIRES_IN:       process.env.JWT_EXPIRES_IN       || '15m',
  JWT_REFRESH_SECRET:   process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // MFA
  MFA_APP_NAME: process.env.MFA_APP_NAME || 'Amrutam',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@amrutam.com',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX:       parseInt(process.env.RATE_LIMIT_MAX       || '100', 10),

  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
