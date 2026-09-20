'use strict';

/**
 * Idempotency middleware — prevents duplicate write requests.
 * Client must send header: Idempotency-Key: <uuid>
 * Result is cached in Redis for 24 hours.
 *
 * Usage: router.post('/bookings', authenticate, idempotency, handler)
 */

const logger = require('../config/logger');

// We lazily load redis so the app doesn't crash if Redis isn't needed
let redisClient = null;
function getRedis() {
  if (!redisClient) {
    try {
      const { createClient } = require('redis');
      const env = require('../config/env');
      redisClient = createClient({ url: env.REDIS_URL });
      redisClient.connect().catch(() => {});
    } catch { /* Redis optional */ }
  }
  return redisClient;
}

async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // Optional — skip if not provided

  const redis = getRedis();
  if (!redis || !redis.isOpen) return next(); // Degrade gracefully

  const cacheKey = `idempotency:${req.user?.id || 'anon'}:${key}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info('Idempotent request — returning cached response', { key });
      const parsed = JSON.parse(cached);
      return res.status(parsed.statusCode).json(parsed.body);
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode < 400) {
        await redis.setEx(cacheKey, 86400, JSON.stringify({ statusCode: res.statusCode, body }));
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.warn('Idempotency check failed — proceeding without cache', { err: err.message });
    next();
  }
}

module.exports = { idempotency };
