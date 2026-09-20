'use strict';

const { getPrismaClient } = require('../config/database');
const { NotFoundError, AuthorizationError, ConflictError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');

const prisma = getPrismaClient();

/** List doctors with filters */
async function getDoctors(filters, query) {
  const { page, limit, skip } = parsePagination(query);

  const where = { isVerified: true };
  if (filters.specialization) where.specializations = { has: filters.specialization };
  if (filters.minFee)    where.consultationFee = { ...where.consultationFee, gte: parseFloat(filters.minFee) };
  if (filters.maxFee)    where.consultationFee = { ...where.consultationFee, lte: parseFloat(filters.maxFee) };
  if (filters.minRating) where.rating = { gte: parseFloat(filters.minRating) };
  if (filters.language)  where.languages = { has: filters.language };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({ where, skip, take: limit, orderBy: { rating: 'desc' } }),
    prisma.doctor.count({ where })
  ]);

  return { doctors, page, limit, total };
}

/** Get single doctor by id */
async function getDoctorById(id) {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) throw new NotFoundError('Doctor');
  return doctor;
}

/** Create doctor profile (linked to existing user) */
async function createDoctorProfile(userId, data) {
  const existing = await prisma.doctor.findUnique({ where: { userId } });
  if (existing) throw new ConflictError('Doctor profile already exists for this user');

  const doctor = await prisma.doctor.create({
    data: { userId, ...data }
  });
  return doctor;
}

/** Update doctor profile */
async function updateDoctorProfile(doctorId, requestingUserId, role, data) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundError('Doctor');

  // Only the doctor themselves or admin can update
  if (role !== 'ADMIN' && doctor.userId !== requestingUserId) {
    throw new AuthorizationError('You cannot update this profile');
  }

  const updated = await prisma.doctor.update({ where: { id: doctorId }, data });
  return updated;
}

/** Admin: verify a doctor */
async function verifyDoctor(doctorId) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundError('Doctor');
  return prisma.doctor.update({ where: { id: doctorId }, data: { isVerified: true } });
}

/** Get available slots for a doctor on a given date */
async function getAvailableSlots(doctorId, date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      doctorId,
      status: 'AVAILABLE',
      startTime: { gte: start, lte: end }
    },
    orderBy: { startTime: 'asc' }
  });
  return slots;
}

/** Create availability slots in bulk */
async function createSlots(doctorId, slotsData) {
  const data = slotsData.map(s => ({
    doctorId,
    startTime: new Date(s.startTime),
    endTime:   new Date(s.endTime),
    status:    'AVAILABLE'
  }));
  const result = await prisma.availabilitySlot.createMany({ data, skipDuplicates: true });
  return { created: result.count };
}

/** Cancel a specific slot */
async function cancelSlot(slotId, doctorId, role) {
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new NotFoundError('Slot');
  if (role !== 'ADMIN' && slot.doctorId !== doctorId) throw new AuthorizationError('You cannot cancel this slot');
  if (slot.status === 'BOOKED') throw new ConflictError('Cannot cancel a booked slot');

  return prisma.availabilitySlot.update({ where: { id: slotId }, data: { status: 'CANCELLED' } });
}

module.exports = {
  getDoctors, getDoctorById, createDoctorProfile,
  updateDoctorProfile, verifyDoctor, getAvailableSlots,
  createSlots, cancelSlot
};
