'use strict';

const { getPrismaClient } = require('../config/database');
const { NotFoundError, ConflictError, AppError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const prisma = getPrismaClient();

/**
 * Create a booking (consultation).
 * Implements saga pattern:
 *   1. Atomically claim the slot if it is AVAILABLE
 *   2. Create consultation (SCHEDULED)
 *   3. Mark slot as BOOKED
 *   4. Create payment record (PENDING)
 *
 * Idempotent via idempotencyKey.
 */
async function createBooking({ patientId, slotId, type, chiefComplaint, idempotencyKey }) {
  // Check for existing booking with same idempotency key
  const existing = await prisma.consultation.findUnique({ where: { idempotencyKey } });
  if (existing) {
    logger.info('Idempotent booking — returning existing', { consultationId: existing.id });
    return existing;
  }

  // Run as a transaction (Saga Step A + B)
  const consultation = await prisma.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundError('Availability slot');

    const claimed = await tx.availabilitySlot.updateMany({
      where: { id: slotId, status: 'AVAILABLE' },
      data:  { status: 'BOOKED' }
    });
    if (claimed.count !== 1) throw new ConflictError('Slot is no longer available');

    // Find doctor's consultation fee
    const doctor = await tx.doctor.findUnique({ where: { id: slot.doctorId } });
    if (!doctor || !doctor.isVerified) throw new AppError('Doctor is not available', 400, 'DOCTOR_UNAVAILABLE');

    // Step A: Create consultation
    const consultation = await tx.consultation.create({
      data: {
        patientId,
        doctorId:      slot.doctorId,
        slotId,
        type,
        chiefComplaint,
        idempotencyKey,
        scheduledAt:   slot.startTime,
        status:        'SCHEDULED',
      }
    });

    // Step B: Create payment record
    await tx.payment.create({
      data: {
        consultationId: consultation.id,
        amount:         doctor.consultationFee,
        currency:       'INR',
        status:         'PENDING',
        idempotencyKey: `payment-${idempotencyKey}`,
      }
    });

    return consultation;
  });

  logger.info('Booking created', { consultationId: consultation.id, patientId });
  return consultation;
}

/** Get all bookings for a patient */
async function getMyBookings(patientId, query) {
  const { parsePagination } = require('../utils/pagination');
  const { page, limit, skip } = parsePagination(query);

  const where = { patientId };
  if (query.status) where.status = query.status;

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where, skip, take: limit,
      include: { prescription: true, payment: true },
      orderBy: { scheduledAt: 'desc' }
    }),
    prisma.consultation.count({ where })
  ]);

  return { consultations, page, limit, total };
}

/** Cancel a booking (compensation saga — restore slot) */
async function cancelBooking(consultationId, userId, role, reason) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { payment: true }
  });
  if (!consultation) throw new NotFoundError('Consultation');

  if (role !== 'ADMIN' && consultation.patientId !== userId) {
    throw new AppError('Unauthorized to cancel this booking', 403, 'FORBIDDEN');
  }
  if (!['SCHEDULED'].includes(consultation.status)) {
    throw new ConflictError('Only SCHEDULED consultations can be cancelled');
  }

  // Compensation transaction
  await prisma.$transaction(async (tx) => {
    await tx.consultation.update({
      where: { id: consultationId },
      data:  { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason }
    });

    // Restore slot
    await tx.availabilitySlot.update({
      where: { id: consultation.slotId },
      data:  { status: 'AVAILABLE' }
    });

    // Mark payment as refunded if it was completed
    if (consultation.payment && consultation.payment.status === 'COMPLETED') {
      await tx.payment.update({
        where: { id: consultation.payment.id },
        data:  { status: 'REFUNDED' }
      });
    }
  });

  logger.info('Booking cancelled', { consultationId, userId });
  return { message: 'Booking cancelled successfully' };
}

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking
};
