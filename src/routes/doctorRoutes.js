'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/doctorController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = Router();

const slotsSchema = z.object({
  slots: z.array(z.object({
    startTime: z.string(),
    endTime:   z.string(),
  })).min(1, 'At least one slot required'),
});

const doctorProfileSchema = z.object({
  specializations: z.array(z.string()).min(1),
  licenseNumber:   z.string().min(1),
  yearsExperience: z.number().int().min(0),
  consultationFee: z.number().positive(),
  bio:             z.string().optional(),
  languages:       z.array(z.string()).default(['English']),
});

// GET  /api/v1/doctors        (public)
router.get('/', controller.getDoctors);

// GET  /api/v1/doctors/:id    (public)
router.get('/:id', controller.getDoctorById);

// GET  /api/v1/doctors/:id/slots  (public)
router.get('/:id/slots', controller.getAvailableSlots);

// POST /api/v1/doctors        (DOCTOR or ADMIN)
router.post('/', authenticate, authorize('DOCTOR', 'ADMIN'), validate({ body: doctorProfileSchema }), controller.createDoctorProfile);

// PUT  /api/v1/doctors/:id    (DOCTOR or ADMIN)
router.put('/:id', authenticate, authorize('DOCTOR', 'ADMIN'), controller.updateDoctorProfile);

// POST /api/v1/doctors/:id/verify  (ADMIN only)
router.post('/:id/verify', authenticate, authorize('ADMIN'), controller.verifyDoctor);

// POST /api/v1/doctors/:id/slots   (DOCTOR or ADMIN)
router.post('/:id/slots', authenticate, authorize('DOCTOR', 'ADMIN'), validate({ body: slotsSchema }), controller.createSlots);

// DELETE /api/v1/doctors/:id/slots/:slotId  (DOCTOR or ADMIN)
router.delete('/:id/slots/:slotId', authenticate, authorize('DOCTOR', 'ADMIN'), controller.cancelSlot);

module.exports = router;
