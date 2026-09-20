'use strict';

const { getPrismaClient } = require('../config/database');
const { parsePagination } = require('../utils/pagination');

const prisma = getPrismaClient();

/** Admin dashboard metrics */
async function getDashboard() {
  const [
    totalUsers,
    totalDoctors,
    totalConsultations,
    scheduledConsultations,
    completedToday,
    revenueToday,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PATIENT', isActive: true } }),
    prisma.doctor.count({ where: { isVerified: true } }),
    prisma.consultation.count(),
    prisma.consultation.count({ where: { status: 'SCHEDULED' } }),
    prisma.consultation.count({
      where: {
        status: 'COMPLETED',
        endedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    }),
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      },
      _sum: { amount: true }
    }),
  ]);

  return {
    totalUsers,
    totalDoctors,
    totalConsultations,
    scheduledConsultations,
    completedToday,
    revenueToday: revenueToday._sum.amount || 0,
  };
}

/** Revenue analytics over a date range */
async function getRevenueAnalytics(startDate, endDate) {
  const result = await prisma.payment.groupBy({
    by:     ['createdAt'],
    where:  { status: 'COMPLETED', createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
    _sum:   { amount: true },
    _count: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: 'COMPLETED', createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
    _sum: { amount: true }
  });

  return { breakdown: result, totalRevenue: totalRevenue._sum.amount || 0 };
}

/** Consultation stats by status */
async function getConsultationStats() {
  const stats = await prisma.consultation.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  return stats.reduce((acc, s) => { acc[s.status] = s._count.id; return acc; }, {});
}

/** Top doctors by consultations */
async function getTopDoctors(limit = 10) {
  return prisma.doctor.findMany({
    where:   { isVerified: true },
    orderBy: { totalConsultations: 'desc' },
    take:    parseInt(limit),
  });
}

module.exports = {
   getDashboard,
   getRevenueAnalytics,
   getConsultationStats,
   getTopDoctors
   };
