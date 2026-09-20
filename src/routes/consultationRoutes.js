'use strict';

const { Router } = require('express');
const { z } = require('zod');
const controller = require('../controllers/consultationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = Router();

router.use(authenticate);

const notesSchema = z.object({ notes: z.string().min(1).max(2000) });

// GET  /api/v1/consultations          (ADMIN)
router.get('/', authorize('ADMIN', 'DOCTOR'), controller.listConsultations);

// GET  /api/v1/consultations/:id
router.get('/:id', controller.getConsultationById);

// POST /api/v1/consultations/:id/start  (DOCTOR only)
router.post('/:id/start', authorize('DOCTOR'), controller.startConsultation);

// POST /api/v1/consultations/:id/end    (DOCTOR only)
router.post('/:id/end', authorize('DOCTOR'), controller.endConsultation);

// POST /api/v1/consultations/:id/notes  (DOCTOR only)
router.post('/:id/notes', authorize('DOCTOR'), validate({ body: notesSchema }), controller.addNotes);

module.exports = router;
