'use strict';

const bookingService = require('../services/bookingService');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

async function createBooking(req, res, next) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || uuidv4();
    const consultation = await bookingService.createBooking({
      patientId:     req.user.id,
      slotId:        req.body.slotId,
      type:          req.body.type || 'VIDEO',
      chiefComplaint: req.body.chiefComplaint,
      idempotencyKey,
    });
    sendCreated(res, { message: 'Booking created', data: consultation });
  } catch (err) { next(err); }
}

async function getMyBookings(req, res, next) {
  try {
    const { consultations, page, limit, total } = await bookingService.getMyBookings(req.user.id, req.query);
    sendPaginated(res, { data: consultations, page, limit, total });
  } catch (err) { next(err); }
}

async function cancelBooking(req, res, next) {
  try {
    const result = await bookingService.cancelBooking(req.params.id, req.user.id, req.user.role, req.body.reason);
    sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
}

module.exports = { createBooking, getMyBookings, cancelBooking };
