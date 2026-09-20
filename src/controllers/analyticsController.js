'use strict';

const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

async function getDashboard(req, res, next) {
  try {
    const data = await analyticsService.getDashboard();
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}

async function getRevenueAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getRevenueAnalytics(
      startDate || new Date(Date.now() - 30 * 86400000).toISOString(),
      endDate   || new Date().toISOString()
    );
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}

async function getConsultationStats(req, res, next) {
  try {
    const data = await analyticsService.getConsultationStats();
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}

async function getTopDoctors(req, res, next) {
  try {
    const data = await analyticsService.getTopDoctors(req.query.limit || 10);
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}

module.exports = { getDashboard, getRevenueAnalytics, getConsultationStats, getTopDoctors };
