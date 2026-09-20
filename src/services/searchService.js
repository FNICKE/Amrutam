'use strict';

const { getPrismaClient } = require('../config/database');
const { parsePagination } = require('../utils/pagination');

const prisma = getPrismaClient();

/** Full-text search for doctors by name, specialization, or bio */
async function searchDoctors(q, filters, query) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    isVerified: true,
    OR: [
      { specializations: { hasSome: [q] } },
      { bio: { contains: q, mode: 'insensitive' } },
      { languages: { hasSome: [q] } },
    ]
  };

  if (filters.minFee)    where.consultationFee = { gte: parseFloat(filters.minFee) };
  if (filters.maxFee)    where.consultationFee = { ...where.consultationFee, lte: parseFloat(filters.maxFee) };
  if (filters.minRating) where.rating = { gte: parseFloat(filters.minRating) };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({ where, skip, take: limit, orderBy: { rating: 'desc' } }),
    prisma.doctor.count({ where })
  ]);

  return { doctors, page, limit, total };
}

/** Search available slots */
async function searchAvailableSlots(filters, query) {
  const { page, limit, skip } = parsePagination(query);

  const where = { status: 'AVAILABLE' };
  if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.date) {
    const date = new Date(filters.date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    where.startTime = { gte: date, lt: next };
  }

  const [slots, total] = await Promise.all([
    prisma.availabilitySlot.findMany({ where, skip, take: limit, orderBy: { startTime: 'asc' } }),
    prisma.availabilitySlot.count({ where })
  ]);

  return { slots, page, limit, total };
}

module.exports = { searchDoctors, searchAvailableSlots };
