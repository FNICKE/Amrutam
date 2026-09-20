'use strict';

const consultationService = require('../services/consultationService');
const { sendSuccess, sendPaginated } = require('../utils/response');

async function getConsultationById(req, res, next) {
  try {
    const consultation = await consultationService.getConsultationById(req.params.id, req.user.id, req.user.role);
    sendSuccess(res, { data: consultation });
  } catch (err) { next(err); }
}

async function startConsultation(req, res, next) {
  try {
    const consultation = await consultationService.startConsultation(req.params.id, req.user.id);
    sendSuccess(res, { message: 'Consultation started', data: consultation });
  } catch (err) { next(err); }
}

async function endConsultation(req, res, next) {
  try {
    const consultation = await consultationService.endConsultation(req.params.id, req.user.id);
    sendSuccess(res, { message: 'Consultation completed', data: consultation });
  } catch (err) { next(err); }
}

async function addNotes(req, res, next) {
  try {
    const consultation = await consultationService.addNotes(req.params.id, req.user.id, req.body.notes);
    sendSuccess(res, { message: 'Notes added', data: consultation });
  } catch (err) { next(err); }
}

async function listConsultations(req, res, next) {
  try {
    const { consultations, page, limit, total } = await consultationService.listConsultations(req.query, req.query);
    sendPaginated(res, { data: consultations, page, limit, total });
  } catch (err) { next(err); }
}

module.exports = { getConsultationById, startConsultation, endConsultation, addNotes, listConsultations };
