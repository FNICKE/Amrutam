'use strict';

const prescriptionService = require('../services/prescriptionService');
const { sendSuccess, sendCreated } = require('../utils/response');

async function createPrescription(req, res, next) {
  try {
    const prescription = await prescriptionService.createPrescription(
      req.body.consultationId, req.user.id, req.body
    );
    sendCreated(res, { message: 'Prescription created', data: prescription });
  } catch (err) { next(err); }
}

async function getPrescriptionById(req, res, next) {
  try {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, { data: prescription });
  } catch (err) { next(err); }
}

async function updatePrescription(req, res, next) {
  try {
    const prescription = await prescriptionService.updatePrescription(req.params.id, req.user.id, req.body);
    sendSuccess(res, { message: 'Prescription updated', data: prescription });
  } catch (err) { next(err); }
}

module.exports = { createPrescription, getPrescriptionById, updatePrescription };
