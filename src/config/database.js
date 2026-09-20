'use strict';

const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// Singleton Prisma client
let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query',  emit: 'event' },
        { level: 'error',  emit: 'event' },
        { level: 'warn',   emit: 'event' },
      ],
    });

    // Log slow queries in development
    prisma.$on('query', (e) => {
      if (e.duration > 100) {
        logger.warn('Slow query detected', {
          query:    e.query,
          duration: `${e.duration}ms`,
        });
      }
    });

    prisma.$on('error', (e) => {
      logger.error('Prisma error', { message: e.message });
    });
  }
  return prisma;
}

async function connectDatabase() {
  const client = getPrismaClient();
  await client.$connect();
  logger.info('Database connected successfully');
  return client;
}

async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

module.exports = { getPrismaClient, connectDatabase, disconnectDatabase };
