'use strict';

const { Router } = require('express');
const controller = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = Router();

// All analytics routes — admin only
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/admin/dashboard
router.get('/dashboard', controller.getDashboard);

// GET /api/v1/admin/revenue?startDate=2024-01-01&endDate=2024-01-31
router.get('/revenue', controller.getRevenueAnalytics);

// GET /api/v1/admin/consultations/stats
router.get('/consultations/stats', controller.getConsultationStats);

// GET /api/v1/admin/doctors/top
router.get('/doctors/top', controller.getTopDoctors);

module.exports = router;
