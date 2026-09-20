'use strict';

const { Router } = require('express');
const controller = require('../controllers/auditController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = Router();

// GET /api/v1/audit-logs  (ADMIN only)
router.get('/', authenticate, authorize('ADMIN'), controller.getAuditLogs);

module.exports = router;
