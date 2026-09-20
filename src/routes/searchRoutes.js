'use strict';

const { Router } = require('express');
const controller = require('../controllers/searchController');

const router = Router();

// GET /api/v1/search/doctors?q=cardiology&minFee=100&maxFee=500
router.get('/doctors', controller.searchDoctors);

// GET /api/v1/search/slots?doctorId=xxx&date=2024-01-15
router.get('/slots', controller.searchSlots);

module.exports = router;
