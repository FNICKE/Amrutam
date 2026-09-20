'use strict';

// Validate env variables before anything else
require('./src/config/env');

const http = require('http');
const app  = require('./src/app');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
const logger = require('./src/config/logger');
const env    = require('./src/config/env');

const server = http.createServer(app);

async function start() {
  try {
    await connectDatabase();

    server.listen(env.PORT, () => {
      logger.info(`Amrutam API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
      logger.info(`API base:     http://localhost:${env.PORT}/api/v1`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// Graceful shutdown handler
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    try {
      await disconnectDatabase();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { err: err.message });
      process.exit(1);
    }
  });

  // Force exit if not done within 10 seconds
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();