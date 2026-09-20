'use strict';

const { ValidationError } = require('../utils/errors');

/**
 * Zod validation middleware factory.
 * Usage: validate({ body: schema, params: schema, query: schema })
 */
function validate({ body, params, query } = {}) {
  return async (req, res, next) => {
    const validationErrors = [];
    try {
      if (body) {
        const r = body.safeParse(req.body);
        if (!r.success) r.error.errors.forEach(e => validationErrors.push({ field: e.path.join('.'), message: e.message }));
        else req.body = r.data;
      }
      if (params) {
        const r = params.safeParse(req.params);
        if (!r.success) r.error.errors.forEach(e => validationErrors.push({ field: `params.${e.path.join('.')}`, message: e.message }));
        else req.params = r.data;
      }
      if (query) {
        const r = query.safeParse(req.query);
        if (!r.success) r.error.errors.forEach(e => validationErrors.push({ field: `query.${e.path.join('.')}`, message: e.message }));
        else req.query = r.data;
      }
      if (validationErrors.length > 0) return next(new ValidationError('Validation failed', validationErrors));
      next();
    } catch (err) { next(err); }
  };
}

module.exports = { validate };
