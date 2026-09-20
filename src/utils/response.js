'use strict';

/**
 * Standardized API response helpers.
 * All responses follow the shape:
 *   { success, message, data, meta }
 */

function sendSuccess(res, { message = 'Success', data = null, meta = null, statusCode = 200 } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

function sendCreated(res, { message = 'Created successfully', data = null } = {}) {
  return sendSuccess(res, { message, data, statusCode: 201 });
}

function sendError(res, { message = 'Something went wrong', errors = null, statusCode = 500 } = {}) {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
}

function sendPaginated(res, { data, page, limit, total, message = 'Success' } = {}) {
  return sendSuccess(res, {
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { sendSuccess, sendCreated, sendError, sendPaginated };
