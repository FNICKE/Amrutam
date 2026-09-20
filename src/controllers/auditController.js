'use strict';

const auditService = require('../services/auditService');
const { sendPaginated } = require('../utils/response');

async function getAuditLogs(req, res, next) {
  try {
    const { logs, page, limit, total } = await auditService.getAuditLogs(req.query, req.query);
    sendPaginated(res, { data: logs, page, limit, total });
  } catch (err) { next(err); }
}

module.exports = { getAuditLogs };
