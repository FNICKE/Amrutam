'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { idempotency } = require('../middleware/idempotencyMiddleware');

const router = Router();

// All booking routes require auth
router.use(authenticate);

const createBookingSchema = z.object({
  slotId:         z.string().uuid('Invalid slot ID'),
  type:           z.enum(['VIDEO', 'AUDIO', 'CHAT']).default('VIDEO'),
  chiefComplaint: z.string().max(500).optional(),
});

const cancelSchema = z.object({
  reason: z.string().max(200).optional().default('Patient requested cancellation'),
});

// POST /api/v1/bookings    (idempotent write)
router.post('/', idempotency, validate({ body: createBookingSchema }), controller.createBooking);

// GET  /api/v1/bookings/me
router.get('/me', controller.getMyBookings);

// DELETE /api/v1/bookings/:id  (cancel)
router.delete('/:id', validate({ body: cancelSchema }), controller.cancelBooking);

module.exports = router;
