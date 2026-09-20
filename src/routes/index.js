'use strict';

const { Router } = require('express');

const router = Router();

// Mount all route modules
router.use('/auth',          require('./authRoutes'));
router.use('/users',         require('./userRoutes'));
router.use('/doctors',       require('./doctorRoutes'));
router.use('/bookings',      require('./bookingRoutes'));
router.use('/consultations', require('./consultationRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/search',        require('./searchRoutes'));
router.use('/admin',         require('./analyticsRoutes'));
router.use('/audit-logs',    require('./auditRoutes'));

module.exports = router;
