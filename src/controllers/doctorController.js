'use strict';

const doctorService = require('../services/doctorService');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

async function getDoctors(req, res, next) {
  try {
    const { doctors, page, limit, total } = await doctorService.getDoctors(req.query, req.query);
    sendPaginated(res, { data: doctors, page, limit, total });
  } catch (err) { next(err); }
}

async function getDoctorById(req, res, next) {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    sendSuccess(res, { data: doctor });
  } catch (err) { next(err); }
}

async function createDoctorProfile(req, res, next) {
  try {
    const doctor = await doctorService.createDoctorProfile(req.user.id, req.body);
    sendCreated(res, { message: 'Doctor profile created', data: doctor });
  } catch (err) { next(err); }
}

async function updateDoctorProfile(req, res, next) {
  try {
    const doctor = await doctorService.updateDoctorProfile(req.params.id, req.user.id, req.user.role, req.body);
    sendSuccess(res, { message: 'Profile updated', data: doctor });
  } catch (err) { next(err); }
}

async function verifyDoctor(req, res, next) {
  try {
    const doctor = await doctorService.verifyDoctor(req.params.id);
    sendSuccess(res, { message: 'Doctor verified', data: doctor });
  } catch (err) { next(err); }
}

async function getAvailableSlots(req, res, next) {
  try {
    const slots = await doctorService.getAvailableSlots(req.params.id, req.query.date || new Date().toISOString());
    sendSuccess(res, { data: slots });
  } catch (err) { next(err); }
}

async function createSlots(req, res, next) {
  try {
    // Find doctor id from user id
    const { getPrismaClient } = require('../config/database');
    const prisma = getPrismaClient();
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) return next(new (require('../utils/errors').NotFoundError)('Doctor profile'));
    const result = await doctorService.createSlots(doctor.id, req.body.slots);
    sendCreated(res, { message: `${result.created} slots created`, data: result });
  } catch (err) { next(err); }
}

async function cancelSlot(req, res, next) {
  try {
    const { getPrismaClient } = require('../config/database');
    const prisma = getPrismaClient();
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    const doctorId = doctor?.id || null;
    const slot = await doctorService.cancelSlot(req.params.slotId, doctorId, req.user.role);
    sendSuccess(res, { message: 'Slot cancelled', data: slot });
  } catch (err) { next(err); }
}

module.exports = { getDoctors, getDoctorById, createDoctorProfile, updateDoctorProfile, verifyDoctor, getAvailableSlots, createSlots, cancelSlot };
