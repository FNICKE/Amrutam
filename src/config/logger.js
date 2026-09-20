'use strict';

const winston = require('winston');
const env = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    if (requestId) log += ` [${requestId}]`;
    log += ` ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
    return log;
  })
);

// Structured JSON for production (Loki/ELK compatible)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.isDev ? devFormat : prodFormat,
  defaultMeta: { service: 'amrutam-api' },
  transports: [
    new winston.transports.Console(),
  ],
});

// Add file transports in production
if (!env.isDev) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
