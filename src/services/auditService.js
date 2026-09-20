'use strict';

const { getPrismaClient } = require('../config/database');
const { parsePagination } = require('../utils/pagination');
const logger = require('../config/logger');

const prisma = getPrismaClient();

/** Write an immutable audit log entry */
async function writeAuditLog({ actorId, actorRole, action, resource, resourceId, before, after, ipAddress, userAgent, requestId }) {
  try {
    await prisma.auditLog.create({
      data: { actorId, actorRole, action, resource, resourceId, before, after, ipAddress, userAgent, requestId }
    });
  } catch (err) {
    // Audit log failures must not break the main flow
    logger.error('Failed to write audit log', { err: err.message });
  }
}

/** Query audit logs (admin only) */
async function getAuditLogs(filters, query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (filters.actorId)   where.actorId  = filters.actorId;
  if (filters.resource)  where.resource = filters.resource;
  if (filters.action)    where.action   = filters.action;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to)   where.createdAt.lte = new Date(filters.to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, page, limit, total };
}

module.exports = { 
  writeAuditLog, 
  getAuditLogs 
};
