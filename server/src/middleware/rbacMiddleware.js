const ApiError = require('../utils/apiError');

/**
 * Role-Based Access Control (RBAC) Guard Middleware.
 * Allows access if req.user has one of the allowed roles, or if user is ADMIN.
 *
 * @param  {...string} allowedRoles - List of role names permitted to access endpoint
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // ADMIN has full superuser permissions across all modules
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user's role is in the allowed roles list
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Access forbidden: Role '${req.user.role}' lacks sufficient permissions for this operation`
      )
    );
  };
};

module.exports = {
  authorizeRoles,
};
