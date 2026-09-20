'use strict';

const { AuthorizationError } = require('../utils/errors');

/** Role-Based Access Control factory. Usage: authorize('ADMIN') or authorize('DOCTOR','ADMIN') */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new AuthorizationError('Not authenticated'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Role '${req.user.role}' not allowed. Required: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

/** Ownership check — ensures user owns the resource. Admins bypass. */
function requireOwnership(getOwnerId) {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'ADMIN') return next();
      const ownerId = await getOwnerId(req);
      if (ownerId !== req.user.id) return next(new AuthorizationError('You do not own this resource'));
      next();
    } catch (err) { next(err); }
  };
}

module.exports = { authorize, requireOwnership };
