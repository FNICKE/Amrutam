'use strict';

const searchService = require('../services/searchService');
const { sendSuccess, sendPaginated } = require('../utils/response');

async function searchDoctors(req, res, next) {
  try {
    const q = req.query.q || '';
    const { doctors, page, limit, total } = await searchService.searchDoctors(q, req.query, req.query);
    sendPaginated(res, { data: doctors, page, limit, total, message: `Search results for "${q}"` });
  } catch (err) { next(err); }
}

async function searchSlots(req, res, next) {
  try {
    const { slots, page, limit, total } = await searchService.searchAvailableSlots(req.query, req.query);
    sendPaginated(res, { data: slots, page, limit, total });
  } catch (err) { next(err); }
}

module.exports = { searchDoctors, searchSlots };
