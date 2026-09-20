'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = Router();

// All user routes require authentication
router.use(authenticate);

const updateProfileSchema = z.object({
  firstName:   z.string().min(1).optional(),
  lastName:    z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  avatarUrl:   z.string().url().optional(),
  address:     z.object({
    street:  z.string().optional(),
    city:    z.string().optional(),
    state:   z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
});

// GET  /api/v1/users/me
router.get('/me', controller.getProfile);

// PUT  /api/v1/users/me
router.put('/me', validate({ body: updateProfileSchema }), controller.updateProfile);

// PUT  /api/v1/users/me/password
router.put('/me/password', validate({ body: changePasswordSchema }), controller.changePassword);

// DELETE /api/v1/users/me
router.delete('/me', controller.deactivateAccount);

// GET  /api/v1/users  (Admin only)
router.get('/', authorize('ADMIN'), controller.getAllUsers);

module.exports = router;
