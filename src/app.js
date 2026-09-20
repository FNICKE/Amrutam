'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const env        = require('./config/env');
const logger     = require('./config/logger');
const apiRoutes  = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// ── Trust proxy (needed behind nginx / load balancer) ──
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────
app.use(cors({
  origin:      env.isDev ? '*' : (process.env.ALLOWED_ORIGINS || '').split(','),
  credentials: true,
}));

// ── Correlation ID (X-Request-ID) ─────────────────────
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ── HTTP request logging ───────────────────────────────
app.use(morgan(env.isDev ? 'dev' : 'combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Body parsing ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Global rate limiting ───────────────────────────────
app.use(rateLimit({
  windowMs:      env.RATE_LIMIT_WINDOW_MS,
  max:           env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code:    'RATE_LIMITED',
  },
}));

// ── Root endpoint ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Amrutam Telemedicine API',
    docs: '/api/v1',
    health: '/health'
  });
});

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success:   true,
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || '1.0.0',
    env:       env.NODE_ENV,
  });
});

// ── API routes ─────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── 404 handler ────────────────────────────────────────
app.use(notFoundHandler);

// ── Central error handler ──────────────────────────────
app.use(errorHandler);

module.exports = app;
