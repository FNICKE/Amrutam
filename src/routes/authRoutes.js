'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = Router();

const registerSchema = z.object({
  email:     z.string().email('Invalid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).optional().default(''),
  lastName:  z.string().min(1).optional().default(''),
  role:      z.enum(['PATIENT', 'DOCTOR']).optional().default('PATIENT'),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const tokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// POST /api/v1/auth/register
router.post('/register', validate({ body: registerSchema }), controller.register);

// POST /api/v1/auth/login
router.post('/login', validate({ body: loginSchema }), controller.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate({ body: tokenSchema }), controller.refreshTokens);

// POST /api/v1/auth/logout
router.post('/logout', validate({ body: tokenSchema }), controller.logout);

// GET /api/v1/auth/me  (protected)
router.get('/me', authenticate, controller.getMe);

module.exports = router;
