'use strict';

const { getPrismaClient } = require('../config/database');
const { NotFoundError, ConflictError, AppError } = require('../utils/errors');
const logger = require('../config/logger');

const prisma = getPrismaClient();

/** Create a prescription for a completed/ongoing consultation */
async function createPrescription(consultationId, doctorUserId, prescriptionData) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw new NotFoundError('Consultation');

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor || consultation.doctorId !== doctor.id) throw new AppError('Access denied', 403, 'FORBIDDEN');
  if (!['ONGOING', 'COMPLETED'].includes(consultation.status)) {
    throw new ConflictError('Prescription can only be added to ONGOING or COMPLETED consultations');
  }

  const existing = await prisma.prescription.findUnique({ where: { consultationId } });
  if (existing) throw new ConflictError('Prescription already exists for this consultation');

  const prescription = await prisma.prescription.create({
    data: {
      consultationId,
      medicines:  prescriptionData.medicines,
      diagnosis:  prescriptionData.diagnosis,
      notes:      prescriptionData.notes,
      digitalSig: `${doctor.id}-${Date.now()}`, // simplified signature
    }
  });

  logger.info('Prescription created', { prescriptionId: prescription.id, consultationId });

  // In production: enqueue PDF generation job here
  // await pdfQueue.add('generate-prescription-pdf', { prescriptionId: prescription.id });

  return prescription;
}

/** Get prescription by ID (patient or doctor of that consultation) */
async function getPrescriptionById(id, userId, role) {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: { consultation: true }
  });
  if (!prescription) throw new NotFoundError('Prescription');

  if (role === 'ADMIN') return prescription;

  const { consultation } = prescription;
  const doctor = await prisma.doctor.findUnique({ where: { userId } }).catch(() => null);
  const doctorId = doctor?.id;

  if (consultation.patientId !== userId && consultation.doctorId !== doctorId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  return prescription;
}

/** Update prescription (doctor only, before 24h) */
async function updatePrescription(id, doctorUserId, data) {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: { consultation: true }
  });
  if (!prescription) throw new NotFoundError('Prescription');

  const doctor = await prisma.doctor.findUnique({ where: { userId: doctorUserId } });
  if (!doctor || prescription.consultation.doctorId !== doctor.id) throw new AppError('Access denied', 403, 'FORBIDDEN');

  const hoursSinceCreated = (Date.now() - new Date(prescription.createdAt).getTime()) / 3600000;
  if (hoursSinceCreated > 24) throw new ConflictError('Cannot edit prescription after 24 hours');

  return prisma.prescription.update({ where: { id }, data });
}

module.exports = { createPrescription, getPrescriptionById, updatePrescription };
