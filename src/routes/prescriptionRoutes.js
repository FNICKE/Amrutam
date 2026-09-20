'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = Router();

router.use(authenticate);

const medicineSchema = z.object({
  name:      z.string().min(1),
  dosage:    z.string().min(1),
  frequency: z.string().min(1),
  duration:  z.string().min(1),
  notes:     z.string().optional(),
});

const createPrescriptionSchema = z.object({
  consultationId: z.string().uuid(),
  medicines:      z.array(medicineSchema).min(1),
  diagnosis:      z.string().min(1).max(500),
  notes:          z.string().max(1000).optional(),
});

// POST /api/v1/prescriptions  (DOCTOR only)
router.post('/', authorize('DOCTOR'), validate({ body: createPrescriptionSchema }), controller.createPrescription);

// GET  /api/v1/prescriptions/:id
router.get('/:id', controller.getPrescriptionById);

// PUT  /api/v1/prescriptions/:id  (DOCTOR only)
router.put('/:id', authorize('DOCTOR'), controller.updatePrescription);

module.exports = router;
