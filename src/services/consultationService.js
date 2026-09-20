'use strict';

const { getPrismaClient } = require('../config/database');
const { NotFoundError, ConflictError, AppError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');
const logger = require('../config/logger');

const prisma = getPrismaClient();

/** Get consultation by ID (with ownership check) */
async function getConsultationById(id, userId, role) {
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { prescription: true, payment: true }
  });
  if (!consultation) throw new NotFoundError('Consultation');

  if (role === 'ADMIN') return consultation;
  if (consultation.patientId !== userId && consultation.doctorId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }
  return consultation;
}

/** Doctor starts the consultation */
async function startConsultation(consultationId, doctorUserId) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundError('Consultation');

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor || consultation.doctorId !== doctor.id) throw new AppError('Access denied', 403, 'FORBIDDEN');
  if (consultation.status !== 'SCHEDULED') throw new ConflictError('Consultation is not in SCHEDULED state');

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data:  { status: 'ONGOING', startedAt: new Date() }
  });
  logger.info('Consultation started', { consultationId });
  return updated;
}

/** Doctor ends the consultation */
async function endConsultation(consultationId, doctorUserId) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundError('Consultation');

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor || consultation.doctorId !== doctor.id) throw new AppError('Access denied', 403, 'FORBIDDEN');
  if (consultation.status !== 'ONGOING') throw new ConflictError('Consultation is not ONGOING');

  const [updated] = await prisma.$transaction([
    prisma.consultation.update({
      where: { id: consultationId },
      data:  { status: 'COMPLETED', endedAt: new Date() }
    }),
    // Update doctor stats
    prisma.doctor.update({
      where: { id: doctor.id },
      data:  { totalConsultations: { increment: 1 } }
    }),
    // Mark payment as completed (mock — real payment webhook would do this)
    prisma.payment.updateMany({
      where: { consultationId, status: 'PENDING' },
      data:  { status: 'COMPLETED' }
    })
  ]);

  logger.info('Consultation completed', { consultationId });
  return updated;
}

/** Doctor adds notes */
async function addNotes(consultationId, doctorUserId, notes) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundError('Consultation');

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor || consultation.doctorId !== doctor.id) throw new AppError('Access denied', 403, 'FORBIDDEN');

  return prisma.consultation.update({ where: { id: consultationId }, data: { notes } });
}

/** List consultations (for admin or doctor) */
async function listConsultations(filters, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (filters.status)   where.status   = filters.status;
  if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.patientId) where.patientId = filters.patientId;

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({ where, skip, take: limit, orderBy: { scheduledAt: 'desc' } }),
    prisma.consultation.count({ where })
  ]);
  return { consultations, page, limit, total };
}

module.exports = { 
  getConsultationById,
  startConsultation,
  endConsultation,
  addNotes,
  listConsultations
 };
